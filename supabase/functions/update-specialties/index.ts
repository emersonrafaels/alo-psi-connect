import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not found');
    }

    // Create Supabase client with service role key for database updates
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Iniciando atualização das especialidades...');

    // Fetch all professionals with services data
    const { data: professionals, error: fetchError } = await supabase
      .from('profissionais')
      .select('id, display_name, profissao, servicos_raw')
      .not('servicos_raw', 'is', null);

    if (fetchError) {
      console.error('Erro ao buscar profissionais:', fetchError);
      throw new Error(`Erro ao buscar dados: ${fetchError.message}`);
    }

    console.log(`Encontrados ${professionals?.length || 0} profissionais com especialidades`);

    const standardSpecialties = [
      "Ansiedade",
      "Depressão",
      "Transtornos de Humor",
      "Transtorno de Ansiedade Generalizada (TAG)",
      "Transtorno de Pânico",
      "Transtorno Obsessivo Compulsivo (TOC)",
      "Transtorno Bipolar",
      "Transtornos Alimentares",
      "Compulsão Alimentar",
      "Anorexia",
      "Bulimia",
      "Transtorno de Personalidade Borderline",
      "Esquizofrenia",
      "Transtorno de Estresse Pós-Traumático (TEPT)",
      "Fobias",
      "Fobia Social",
      "Agorafobia",
      "Síndrome de Burnout",
      "Estresse",
      "Desenvolvimento Pessoal",
      "Autoestima",
      "Relacionamentos",
      "Terapia de Casal",
      "Conflitos Familiares",
      "Orientação Parental",
      "Psicologia Infantil",
      "Adolescência",
      "Terceira Idade",
      "Luto e Perda",
      "Dependência Química",
      "Vícios",
      "Sexualidade",
      "Disfunções Sexuais",
      "Orientação Sexual",
      "Identidade de Gênero",
      "Saúde Mental",
      "Psicossomática",
      "Dor Crônica",
      "Câncer (Apoio Psicológico)",
      "Gravidez e Maternidade",
      "Depressão Pós-Parto",
      "Infertilidade",
      "Neuropsicologia",
      "TDAH",
      "Autismo",
      "Déficit de Atenção",
      "Dificuldades de Aprendizagem",
      "Psicologia Organizacional",
      "Coaching",
      "Orientação Vocacional",
      "Bullying",
      "Violência Doméstica",
      "Abuso Sexual",
      "Trauma",
      "Medos e Fobias",
      "Insônia",
      "Transtornos do Sono"
    ];

    const results = [];

    for (const professional of professionals) {
      try {
        console.log(`Processando ${professional.display_name}...`);
        
        // Parse PHP serialized data
        let rawServices = [];
        if (professional.servicos_raw) {
          // Extract service names from PHP serialized string
          const matches = professional.servicos_raw.match(/_nome_servico";s:\d+:"([^"]+)"/g);
          if (matches) {
            rawServices = matches.map((match: string) => {
              const nameMatch = match.match(/_nome_servico";s:\d+:"([^"]+)"/);
              return nameMatch ? nameMatch[1] : '';
            }).filter((name: string) => name.length > 0);
          }
        }

        if (rawServices.length === 0) {
          console.log(`Nenhum serviço encontrado para ${professional.display_name}`);
          continue;
        }

        // Use OpenAI to standardize and map services
        const prompt = `
Você é um especialista em psicologia e precisa padronizar especialidades de profissionais de saúde mental.

ESPECIALIDADES PADRÃO DISPONÍVEIS:
${standardSpecialties.join(', ')}

ESPECIALIDADES ATUAIS DO PROFISSIONAL:
${rawServices.join(', ')}

INSTRUÇÕES:
1. Mapeie cada especialidade atual para uma ou mais especialidades padrão
2. Use apenas especialidades da lista padrão fornecida
3. Se uma especialidade atual não tiver equivalente exato, encontre a mais próxima
4. Evite duplicatas
5. Mantenha relevância com a área de psicologia/saúde mental
6. Máximo 10 especialidades por profissional

Retorne APENAS uma lista das especialidades padrão separadas por vírgula, sem numeração ou explicações.

Exemplo de resposta: Ansiedade, Depressão, Terapia de Casal`;

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openAIApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              { role: 'system', content: 'Você é um especialista em psicologia que padroniza especialidades profissionais.' },
              { role: 'user', content: prompt }
            ],
            max_tokens: 300,
            temperature: 0.1,
          }),
        });

        if (!response.ok) {
          throw new Error(`OpenAI API error: ${response.status}`);
        }

        const data = await response.json();
        const standardizedServices = data.choices[0].message.content.trim();
        
        console.log(`Especialidades padronizadas para ${professional.display_name}: ${standardizedServices}`);

        // Update the professional's services in the database
        const { error: updateError } = await supabase
          .from('profissionais')
          .update({ servicos_raw: standardizedServices })
          .eq('id', professional.id);

        if (updateError) {
          console.error(`Erro ao atualizar ${professional.display_name}:`, updateError);
          results.push({
            id: professional.id,
            name: professional.display_name,
            status: 'error',
            error: updateError.message,
            originalServices: rawServices,
            standardizedServices: null
          });
        } else {
          results.push({
            id: professional.id,
            name: professional.display_name,
            status: 'success',
            originalServices: rawServices,
            standardizedServices: standardizedServices
          });
        }

        // Add a small delay to respect API rate limits
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        console.error(`Erro ao processar ${professional.display_name}:`, error);
        results.push({
          id: professional.id,
          name: professional.display_name,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error',
          originalServices: [],
          standardizedServices: null
        });
      }
    }

    const successCount = results.filter(r => r.status === 'success').length;
    const errorCount = results.filter(r => r.status === 'error').length;

    console.log(`Processamento concluído: ${successCount} sucessos, ${errorCount} erros`);

    return new Response(JSON.stringify({
      success: true,
      message: `Especialidades atualizadas com sucesso! ${successCount} profissionais processados, ${errorCount} erros.`,
      results: results,
      summary: {
        total: results.length,
        successful: successCount,
        errors: errorCount
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Erro geral na função:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});