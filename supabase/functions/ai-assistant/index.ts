import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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
    const { message, professionals } = await req.json();
    
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OPENAI_API_KEY não está configurada');
    }

    // Create Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get professional data if not provided
    let professionalsData = professionals;
    if (!professionalsData) {
      const { data, error } = await supabase
        .from('profissionais')
        .select(`
          id,
          display_name,
          profissao,
          resumo,
          resumo_profissional,
          preco_consulta,
          servicos_raw,
          crp_crm,
          tempo_consulta
        `)
        .eq('ativo', true);

      if (error) {
        console.error('Error fetching professionals:', error);
        professionalsData = [];
      } else {
        professionalsData = data || [];
      }
    }

    // Prepare professionals data for AI
    const professionalsInfo = professionalsData.map((prof: any) => ({
      id: prof.id,
      nome: prof.display_name,
      profissao: prof.profissao,
      resumo: prof.resumo,
      resumo_profissional: prof.resumo_profissional,
      preco: prof.preco_consulta,
      especialidades: prof.servicos_raw,
      crp_crm: prof.crp_crm,
      tempo_consulta: prof.tempo_consulta
    }));

    const systemPrompt = `Você é um assistente especializado em saúde mental da AloPsi que ajuda usuários a encontrar o profissional ideal.

CONTEXTO DOS PROFISSIONAIS DISPONÍVEIS:
${JSON.stringify(professionalsInfo, null, 2)}

SUAS FUNÇÕES:
1. Ajudar usuários a encontrar profissionais baseado em suas necessidades
2. Fazer perguntas relevantes para entender melhor o que o usuário precisa
3. Recomendar profissionais específicos com justificativas claras
4. Explicar as diferentes abordagens terapêuticas
5. Informar sobre preços e disponibilidade

DIRETRIZES DE COMPORTAMENTO:
- Seja empático, acolhedor e profissional
- Use linguagem clara e acessível
- Faça perguntas abertas para entender as necessidades
- Recomende de 1 a 3 profissionais mais adequados
- Explique o porquê de cada recomendação
- Mencione especialidades e experiências relevantes
- Considere aspectos como preço, experiência e abordagem
- Sempre termine sugerindo próximos passos

FORMATO DE RESPOSTA OBRIGATÓRIO:
Use SEMPRE markdown bem estruturado:

### 🎯 **Recomendações Personalizadas**

**👨‍⚕️ Dr. [Nome]** - *[Profissão]*
• **Especialidade:** [Lista especialidades relevantes]
• **Por que é ideal:** [Justificativa clara]
• **Investimento:** R$ [valor] por consulta
• **Perfil:** [Link para /profissional/[id]]

---

### 💡 **Próximos Passos**
1. [Ação recomendada]
2. [Segunda ação]

### ❓ **Precisa de mais informações?**
[Pergunta para continuar a conversa]

REGRAS DE FORMATAÇÃO:
- Use ### para títulos principais
- Use ** para negrito em nomes e conceitos importantes
- Use • para listas de características
- Use emojis apropriados (🎯💡❓👨‍⚕️💰⏰📱)
- Use --- para separadores visuais
- Sempre inclua links no formato [Perfil](/profissional/[id])
- Mantenha parágrafos curtos e organizados`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5-2025-08-07',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        max_completion_tokens: 1000,
        stream: false
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('OpenAI API error:', error);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    return new Response(JSON.stringify({ 
      response: aiResponse,
      success: true 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ai-assistant function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});