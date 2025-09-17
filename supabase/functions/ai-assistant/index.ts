import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.0';
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
    const { message, professionals: providedProfessionals, sessionId, userId } = await req.json();

    // Ensure we have a valid session ID
    const validSessionId = sessionId || crypto.randomUUID();

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

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Manage chat session and memory window
    await manageSessionAndMemory(supabase, validSessionId, userId, message);

    // Get AI configuration
    const { data: configs } = await supabase
      .from('system_configurations')
      .select('key, value')
      .eq('category', 'ai_assistant');

    const configMap = configs?.reduce((acc, config) => {
      acc[config.key] = config.value;
      return acc;
    }, {} as Record<string, any>) || {};

    const model = configMap.model || 'gpt-4o-mini';
    const maxTokens = configMap.max_tokens || 2000;
    const includeProData = configMap.include_professional_data !== false;
    const systemPrompt = configMap.system_prompt || getDefaultSystemPrompt();

    console.log('📋 AI Configuration:', { model, maxTokens, includeProData, systemPromptLength: systemPrompt.length });

    // Get conversation history for memory window
    const conversationHistory = await getConversationHistory(supabase, validSessionId);

    // Fetch enhanced professional data if needed
    let professionals = providedProfessionals;
    let professionalDataText = '';
    
    if (includeProData && !professionals) {
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
          const schedulesByPeriod = {
            manhã: [],
            tarde: [],
            noite: []
          };

          profSchedules.forEach(schedule => {
            const startHour = parseInt(schedule.start_time.split(':')[0]);
            let period = 'manhã';
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

    // Format enhanced professional data for AI context
    if (professionals && professionals.length > 0) {
      professionalDataText = `

=== PROFISSIONAIS DISPONÍVEIS NA ALOPSI ===

${professionals.map((prof, index) => `
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
   - Manhã: ${prof.horarios_disponiveis?.manhã?.map(h => `${h.dia} ${h.inicio}-${h.fim}`).join(', ') || 'Não disponível'}
   - Tarde: ${prof.horarios_disponiveis?.tarde?.map(h => `${h.dia} ${h.inicio}-${h.fim}`).join(', ') || 'Não disponível'}
   - Noite: ${prof.horarios_disponiveis?.noite?.map(h => `${h.dia} ${h.inicio}-${h.fim}`).join(', ') || 'Não disponível'}
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

    // Construct the enhanced system prompt with tools
    const enhancedSystemPrompt = getEnhancedSystemPrompt(systemPrompt, professionalDataText);

    console.log('🎯 Enhanced system prompt prepared, length:', enhancedSystemPrompt.length);

    // Validate the model
    const validModels = ['gpt-4o-mini', 'gpt-4o', 'gpt-3.5-turbo'];
    const modelToUse = validModels.includes(model) ? model : 'gpt-4o-mini';
    
    if (model !== modelToUse) {
      console.log(`⚠️ Model ${model} not in valid list, using ${modelToUse} instead`);
    }

    // Prepare messages with conversation history
    const messages = [
      { role: 'system', content: enhancedSystemPrompt },
      ...conversationHistory.map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      { role: 'user', content: message }
    ];

    // Call OpenAI API with tools
    console.log('🚀 Calling OpenAI API with tools...');
    const openAiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: modelToUse,
        messages,
        max_tokens: maxTokens,
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
              description: "Verifica disponibilidade de horários para um profissional específico",
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
          }
        ],
        tool_choice: "auto"
      }),
    });

    if (!openAiResponse.ok) {
      const errorData = await openAiResponse.text();
      console.error('❌ OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${openAiResponse.status} - ${errorData}`);
    }

    const data = await openAiResponse.json();
    let assistantMessage = data.choices[0].message.content;
    
    // Handle tool calls if present
    const toolCalls = data.choices[0].message.tool_calls;
    if (toolCalls && toolCalls.length > 0) {
      console.log('🔧 Processing tool calls:', toolCalls.length);
      
      for (const toolCall of toolCalls) {
        if (toolCall.function.name === 'search_professionals' || toolCall.function.name === 'check_availability') {
          const toolResponse = await supabase.functions.invoke('ai-assistant-tool', {
            body: {
              action: toolCall.function.name,
              parameters: JSON.parse(toolCall.function.arguments)
            }
          });

          if (toolResponse.data) {
            // Add tool result to context for next API call if needed
            console.log('🔧 Tool response received:', toolCall.function.name);
          }
        }
      }
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
    console.error('❌ Error in ai-assistant function:', error);
    return new Response(JSON.stringify({ 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});