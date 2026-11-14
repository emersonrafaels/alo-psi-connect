import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getCaller, authErrorResponse } from '../_shared/guards.ts';
import { manageSessionAndMemory, saveMessage, getConversationHistory } from './memory-helpers.ts';
import { getDefaultSystemPrompt, getEnhancedSystemPrompt } from './system-prompts.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    // Signed-in callers only; identity comes from the token, never from the body.
    const caller = await getCaller(req, supabase);
    const userId = caller.userId;
    const body = await req.json();
    const { message, professionals: providedProfessionals, sessionId } = body;
    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const tenantId = typeof body.tenantId === 'string' && UUID_RE.test(body.tenantId) ? body.tenantId : null;
    if (typeof message !== 'string' || !message.trim() || message.length > 4000) {
      return new Response(JSON.stringify({ error: 'Mensagem inválida' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Ensure we have a valid session ID owned by the caller
    let validSessionId = typeof sessionId === 'string' && sessionId.length <= 100 ? sessionId : crypto.randomUUID();
    const { data: existingSession } = await supabase.from('ai_chat_sessions').select('user_id').eq('session_id', validSessionId).maybeSingle();
    if (existingSession && existingSession.user_id !== userId) validSessionId = crypto.randomUUID();

    console.log('🤖 AI Assistant request received:', { 
      message: message?.substring(0, 100) + '...', 
      sessionId: validSessionId, 
      userId, 
      providedProfessionals: !!providedProfessionals 
    });

    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not found');
    }

    // Manage chat session and memory window
    await manageSessionAndMemory(supabase, validSessionId, userId, message);

    // Get AI configuration (tenant-specific + global fallback)
    const { data: configs } = await supabase
      .from('system_configurations')
      .select('key, value, tenant_id')
      .eq('category', 'ai_assistant')
      .or(`tenant_id.is.null${tenantId ? `,tenant_id.eq.${tenantId}` : ''}`);

    // Priorizar configs do tenant sobre globais
    const configMap = configs?.reduce((acc, config) => {
      // Se já existe uma config e a atual é global, ignorar
      if (acc[config.key] && !config.tenant_id) {
        return acc;
      }
      
      // Se já existe uma config global e a atual é do tenant, substituir
      if (acc[config.key] && config.tenant_id) {
        return { ...acc, [config.key]: config.value };
      }
      
      // Nova config
      return { ...acc, [config.key]: config.value };
    }, {} as Record<string, any>) || {};

    console.log('📋 AI Configuration for tenant:', tenantId || 'global', {
      configCount: configs?.length || 0,
      hasTitle: !!configMap.title,
      hasSystemPrompt: !!configMap.system_prompt
    });

    // Get AI data sources configuration
    let dataSources = [];
    try {
      const { data: dataSourcesResult, error: dataSourcesError } = await supabase
        .from('ai_data_sources')
        .select('*')
        .eq('enabled', true);

      if (dataSourcesError) {
        console.warn('⚠️ Could not fetch data sources config:', dataSourcesError.message);
        dataSources = [];
      } else {
        dataSources = dataSourcesResult || [];
      }
    } catch (error) {
      console.warn('⚠️ Data sources table not available, continuing without additional data:', error instanceof Error ? error.message : 'Unknown error');
      dataSources = [];
    }

    console.log('📊 Active data sources:', dataSources?.length || 0);

    const model = configMap.model || 'gpt-4o-mini';
    const maxTokens = parseInt(configMap.max_tokens) || 1500; // Reduced to help with rate limits
    const includeProData = configMap.include_professional_data !== false;
    const systemPrompt = configMap.system_prompt || getDefaultSystemPrompt();

    console.log('📋 AI Configuration:', { model, maxTokens, includeProData, systemPromptLength: systemPrompt.length });

    // Get conversation history for memory window
    const conversationHistory = await getConversationHistory(supabase, validSessionId);

    // Fetch enhanced professional data if needed
    let professionals = providedProfessionals;
    let professionalDataText = '';
    let additionalUserData = '';
    
    // Check if professionals data source is enabled
    const professionalsDataSource = dataSources?.find(ds => ds.source_name === 'professionals');
    const shouldIncludeProData = includeProData && professionalsDataSource;
    
    if (shouldIncludeProData && !professionals) {
      console.log('🔍 Fetching enhanced professional data from database...');
      
      const { data: professionalsData, error: profError } = await supabase
        .from('profissionais')
        .select(`
          id,
          display_name,
          profissao,
          resumo_profissional,
          preco_consulta,
          tempo_consulta,
          formacao_raw,
          idiomas_raw,
          telefone,
          email_secundario,
          foto_perfil_url,
          crp_crm,
          linkedin,
          ativo,
          user_id,
          profiles!inner(nome, email)
        `)
        .eq('ativo', true)
        .order('display_name');

      if (profError) {
        console.error('❌ Error fetching professionals:', profError);
      } else {
        // Get schedules for all professionals
        const professionalIds = professionalsData?.map(p => p.user_id) || [];
        let schedulesData = [];

        if (professionalIds.length > 0) {
          const { data: schedules } = await supabase
            .from('profissionais_sessoes')
            .select('*')
            .in('user_id', professionalIds);

          schedulesData = schedules || [];
        }

        // Format professionals with enhanced data
        professionals = professionalsData?.map(prof => {
          const profSchedules = schedulesData.filter(s => s.user_id === prof.user_id);
          
          // Organize schedules by period
          const schedulesByPeriod: {
            manhã: Array<{dia: string; inicio: string; fim: string}>;
            tarde: Array<{dia: string; inicio: string; fim: string}>;
            noite: Array<{dia: string; inicio: string; fim: string}>;
          } = {
            manhã: [],
            tarde: [],
            noite: []
          };

          profSchedules.forEach(schedule => {
            const startHour = parseInt(schedule.start_time.split(':')[0]);
            let period: 'manhã' | 'tarde' | 'noite' = 'manhã';
            if (startHour >= 12 && startHour < 18) period = 'tarde';
            if (startHour >= 18) period = 'noite';

            schedulesByPeriod[period].push({
              dia: schedule.day,
              inicio: schedule.start_time,
              fim: schedule.end_time
            });
          });

          return {
            ...prof,
            horarios_disponiveis: schedulesByPeriod,
            disponibilidade: {
              manhã: schedulesByPeriod.manhã.length > 0,
              tarde: schedulesByPeriod.tarde.length > 0,
              noite: schedulesByPeriod.noite.length > 0
            },
            link_perfil: `/professional/${prof.id}`
          };
        }) || [];
        
        console.log(`✅ Fetched ${professionals.length} professionals with schedules`);
      }
    }

    // Fetch additional user data based on enabled data sources
    if (userId && dataSources && dataSources.length > 0) {
      console.log('🔍 Fetching additional user data based on enabled sources...');
      
      for (const dataSource of dataSources) {
        try {
          switch (dataSource.source_name) {
            case 'user_profile':
              if (dataSource.privacy_level !== 'public') {
                const { data: profile } = await supabase
                  .from('profiles')
                  .select(dataSource.data_fields.fields.join(', '))
                  .eq('user_id', userId)
                  .single();
                
                if (profile) {
                  additionalUserData += `\n=== PERFIL DO USUÁRIO ===\n${JSON.stringify(profile, null, 2)}\n`;
                }
              }
              break;

            case 'mood_entries':
              if (dataSource.privacy_level !== 'public') {
                const { data: moodEntries } = await supabase
                  .from('mood_entries')
                  .select(dataSource.data_fields.fields.join(', '))
                  .eq('user_id', userId)
                  .order('date', { ascending: false })
                  .limit(5);
                
                if (moodEntries && moodEntries.length > 0) {
                  additionalUserData += `\n=== ENTRADAS RECENTES DO DIÁRIO EMOCIONAL ===\n${JSON.stringify(moodEntries, null, 2)}\n`;
                }
              }
              break;

            case 'appointments':
              if (dataSource.privacy_level !== 'public') {
                const { data: appointments } = await supabase
                  .from('agendamentos')
                  .select(dataSource.data_fields.fields.join(', '))
                  .eq('user_id', userId)
                  .order('data_consulta', { ascending: false })
                  .limit(3);
                
                if (appointments && appointments.length > 0) {
                  additionalUserData += `\n=== HISTÓRICO DE AGENDAMENTOS ===\n${JSON.stringify(appointments, null, 2)}\n`;
                }
              }
              break;

            case 'ai_insights':
              if (dataSource.privacy_level !== 'public') {
                const { data: insights } = await supabase
                  .from('ai_insights_history')
                  .select(dataSource.data_fields.fields.join(', '))
                  .eq('user_id', userId)
                  .order('created_at', { ascending: false })
                  .limit(3);
                
                if (insights && insights.length > 0) {
                  additionalUserData += `\n=== INSIGHTS ANTERIORES ===\n${JSON.stringify(insights, null, 2)}\n`;
                }
              }
              break;
          }
        } catch (error) {
          console.error(`❌ Error fetching data for source ${dataSource.source_name}:`, error);
        }
      }
    }

    // Format enhanced professional data for AI context
    if (professionals && professionals.length > 0) {
      professionalDataText = `

=== PROFISSIONAIS DISPONÍVEIS NA ALOPSI ===

${professionals.map((prof: any, index: number) => `
${index + 1}. **${prof.display_name}** - ${prof.profissao}
   - ID: ${prof.id} (use para links: /professional/${prof.id})
   - Especialização: ${prof.resumo_profissional || 'Atendimento geral em psicologia'}
   - Preço: R$ ${prof.preco_consulta || 'Consultar'} por sessão
   - Duração: ${prof.tempo_consulta || 50} minutos
   - Formação: ${prof.formacao_raw || 'Graduação em Psicologia'}
   - Idiomas: ${prof.idiomas_raw || 'Português'}
   - CRP/CRM: ${prof.crp_crm || 'Não informado'}
   - Contato: ${prof.telefone || 'Via plataforma'} | ${prof.email_secundario || 'Via plataforma'}
   - LinkedIn: ${prof.linkedin || 'Não informado'}
   - Foto disponível: ${prof.foto_perfil_url ? 'Sim' : 'Não'}
   
   **Disponibilidade de horários:**
   ${prof.disponibilidade?.manhã ? '✅ Manhã' : '❌ Manhã'} | ${prof.disponibilidade?.tarde ? '✅ Tarde' : '❌ Tarde'} | ${prof.disponibilidade?.noite ? '✅ Noite' : '❌ Noite'}
   
   **Horários específicos:**
    - Manhã: ${prof.horarios_disponiveis?.manhã?.map((h: any) => `${h.dia} ${h.inicio}-${h.fim}`).join(', ') || 'Não disponível'}
    - Tarde: ${prof.horarios_disponiveis?.tarde?.map((h: any) => `${h.dia} ${h.inicio}-${h.fim}`).join(', ') || 'Não disponível'}
    - Noite: ${prof.horarios_disponiveis?.noite?.map((h: any) => `${h.dia} ${h.inicio}-${h.fim}`).join(', ') || 'Não disponível'}
`).join('')}

=== INSTRUÇÕES PARA APRESENTAÇÃO DOS PROFISSIONAIS ===
- SEMPRE apresente os profissionais de forma organizada e atrativa usando markdown
- Destaque as especialidades relevantes para cada consulta
- Inclua informações de preço, duração e disponibilidade quando relevantes
- Use links funcionais para os perfis: [Ver perfil](/professional/[id])
- Sugira profissionais específicos baseado nas necessidades mencionadas
- Organize por especialização ou disponibilidade quando apropriado
- Mencione os horários disponíveis quando o usuário perguntar sobre disponibilidade
- Se nenhum profissional atender aos critérios, explique e sugira alternativas
`;
    }

    // Construct the enhanced system prompt with tools and additional data
    const enhancedSystemPrompt = getEnhancedSystemPrompt(systemPrompt, professionalDataText + additionalUserData);

    console.log('🎯 Enhanced system prompt prepared, length:', enhancedSystemPrompt.length);

    // Validate the model and use more cost-effective option to reduce rate limits
    const validModels = ['gpt-4o-mini', 'gpt-4o', 'gpt-3.5-turbo', 'gpt-4.1-mini-2025-04-14', 'gpt-5-mini-2025-08-07'];
    const modelToUse = validModels.includes(model) ? 'gpt-4o-mini' : 'gpt-4o-mini'; // Always use mini for efficiency
    
    if (model !== modelToUse) {
      console.log(`⚠️ Model ${model} not in valid list, using ${modelToUse} instead`);
    }

    // Prepare messages with conversation history
    const messages = [
      { role: 'system', content: enhancedSystemPrompt },
      ...conversationHistory.map((msg: any) => ({
        role: msg.role,
        content: msg.content
      })),
      { role: 'user', content: message }
    ];

    // Prepare API request parameters based on model
    const requestBody: any = {
      model: modelToUse,
      messages,
      temperature: 0.7,
      tools: [
        {
          type: "function",
          function: {
            name: "search_professionals",
            description: "Busca profissionais na base de dados com filtros específicos",
            parameters: {
              type: "object",
              properties: {
                specialties: {
                  type: "array",
                  items: { type: "string" },
                  description: "Especialidades desejadas (ex: ansiedade, depressão)"
                },
                profession: {
                  type: "string",
                  description: "Tipo de profissional (psicólogo, psiquiatra, psicoterapeuta)"
                },
                price_range: {
                  type: "array",
                  items: { type: "number" },
                  description: "Faixa de preço [min, max]"
                },
                availability_period: {
                  type: "string",
                  description: "Período de preferência (manhã, tarde, noite)"
                }
              }
            }
          }
        },
        {
          type: "function",
          function: {
            name: "check_availability",
            description: "Verifica disponibilidade detalhada para um profissional em data específica, considerando todos os bloqueios e indisponibilidades",
            parameters: {
              type: "object",
              properties: {
                professional_id: {
                  type: "number",
                  description: "ID do profissional"
                },
                date: {
                  type: "string",
                  description: "Data no formato YYYY-MM-DD"
                },
                time_period: {
                  type: "string",
                  description: "Período desejado (manhã, tarde, noite)"
                }
              },
              required: ["professional_id"]
            }
          }
        },
        {
          type: "function",
          function: {
            name: "get_professional_calendar_status",
            description: "Obtém status geral do calendário e informações de um profissional",
            parameters: {
              type: "object",
              properties: {
                professional_id: {
                  type: "number",
                  description: "ID do profissional para obter status do calendário"
                }
              },
              required: ["professional_id"]
            }
          }
        }
      ],
      tool_choice: "auto"
    };

    // Use max_completion_tokens for newer models, max_tokens for legacy models
    if (modelToUse.includes('gpt-5') || modelToUse.includes('gpt-4.1') || modelToUse.includes('o3') || modelToUse.includes('o4')) {
      requestBody.max_completion_tokens = maxTokens;
      // Remove temperature for GPT-5 and newer models as it's not supported
      delete requestBody.temperature;
    } else {
      requestBody.max_tokens = maxTokens;
    }

    // Call OpenAI API with tools
    console.log('🚀 Calling OpenAI API with tools...');
    const openAiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!openAiResponse.ok) {
      const errorData = await openAiResponse.text();
      console.error('❌ OpenAI API error:', errorData);
      
      // Handle rate limit errors gracefully
      if (openAiResponse.status === 429) {
        console.log('⏳ Rate limit hit, returning error message to user');
        await saveMessage(supabase, validSessionId, 'assistant', 'Desculpe, o assistente está temporariamente sobrecarregado. Tente novamente em alguns segundos.');
        
        return new Response(JSON.stringify({ 
          content: 'Desculpe, o assistente está temporariamente sobrecarregado. Tente novamente em alguns segundos.' 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      throw new Error(`OpenAI API error: ${openAiResponse.status} - ${errorData}`);
    }

    const data = await openAiResponse.json();
    const choice = data.choices[0];
    let assistantMessage: string;
    
    // Handle tool calls if present
    if (choice.message.tool_calls) {
      console.log('🔧 Processing tool calls:', choice.message.tool_calls.length);
      
      const toolResults = [];
      
      for (const toolCall of choice.message.tool_calls) {
        const { name, arguments: args } = toolCall.function;
        const parsedArgs = JSON.parse(args);
        
        console.log(`🔧 Calling tool: ${name} with args:`, parsedArgs);
        
        // Call the ai-assistant-tool function
        const { data: toolResponse, error: toolError } = await supabase.functions.invoke('ai-assistant-tool', {
          body: {
            action: name,
            parameters: parsedArgs
          }
        });
        
        if (toolError) {
          console.error(`❌ Tool call error for ${name}:`, toolError);
          toolResults.push({
            tool_call_id: toolCall.id,
            role: 'tool',
            name: name,
            content: `Error: ${toolError.message}`
          });
        } else {
          console.log(`🔧 Tool response received: ${name}`);
          toolResults.push({
            tool_call_id: toolCall.id,
            role: 'tool',
            name: name,
            content: JSON.stringify(toolResponse)
          });
        }
      }
      
      // Prepare second request with the same model-specific parameters
      const secondRequestBody: any = {
        model: modelToUse,
        messages: [
          ...messages,
          choice.message,
          ...toolResults
        ],
        temperature: 0.7
      };

      // Use appropriate token parameter for the model
      if (modelToUse.includes('gpt-5') || modelToUse.includes('gpt-4.1') || modelToUse.includes('o3') || modelToUse.includes('o4')) {
        secondRequestBody.max_completion_tokens = maxTokens;
        delete secondRequestBody.temperature;
      } else {
        secondRequestBody.max_tokens = maxTokens;
      }
      
      // Make a second call to OpenAI with the tool results
      console.log('🔄 Making second OpenAI call with tool results...');
      const secondOpenaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(secondRequestBody),
      });

      if (!secondOpenaiResponse.ok) {
        const secondErrorData = await secondOpenaiResponse.text();
        console.error('❌ Second OpenAI API call error:', secondErrorData);
        
        // Handle rate limit errors gracefully for second call
        if (secondOpenaiResponse.status === 429) {
          console.log('⏳ Rate limit hit on second call, returning error message to user');
          await saveMessage(supabase, validSessionId, 'assistant', 'Desculpe, o assistente está temporariamente sobrecarregado. Tente novamente em alguns segundos.');
          
          return new Response(JSON.stringify({ 
            content: 'Desculpe, o assistente está temporariamente sobrecarregado. Tente novamente em alguns segundos.' 
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        
        throw new Error(`OpenAI API error: ${secondOpenaiResponse.status} - ${secondErrorData}`);
      }

      const secondOpenaiData = await secondOpenaiResponse.json();

      assistantMessage = secondOpenaiData.choices[0].message.content;
      console.log('✅ Tool integration completed successfully');
    } else {
      assistantMessage = choice.message.content;
      console.log('✅ Direct response received (no tools used)');
    }

    // Validate assistant message before saving
    if (!assistantMessage || assistantMessage.trim() === '') {
      console.error('❌ Assistant message is empty or null');
      assistantMessage = 'Desculpe, ocorreu um problema ao processar sua solicitação. Tente novamente.';
    }
    
    // Save assistant response to conversation history
    await saveMessage(supabase, validSessionId, 'assistant', assistantMessage);
    
    console.log('✅ OpenAI response received, length:', assistantMessage.length);

    return new Response(JSON.stringify({ 
      response: assistantMessage,
      sessionId: validSessionId,
      success: true
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    const authResp = authErrorResponse(error, corsHeaders);
    if (authResp) return authResp;
    console.error('❌ Error in ai-assistant function:', error);
    return new Response(JSON.stringify({ 
      error: 'Não foi possível processar a solicitação.'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});