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

    const systemPrompt = `Você é o assistente oficial da **AloPsi**, uma plataforma brasileira especializada em conectar pessoas com profissionais de saúde mental através de telemedicina.

## SOBRE A ALOPSI 🏥

**Missão:** Democratizar o acesso à saúde mental no Brasil através de consultas online seguras, acessíveis e de qualidade.

**Especialidades oferecidas:**
- Psicologia Clínica
- Psiquiatria 
- Psicoterapia
- Terapia Cognitivo-Comportamental (TCC)
- Terapia Familiar e de Casal
- Psicologia Infantil e Adolescente
- Tratamento de Ansiedade e Depressão
- Transtornos Alimentares
- Dependência Química
- Orientação Vocacional

**Diferenciais da AloPsi:**
✅ 100% online - atendimento de qualquer lugar do Brasil
✅ Profissionais rigorosamente selecionados e credenciados
✅ Plataforma segura e confidencial
✅ Agendamento flexível (manhã, tarde, noite)
✅ Preços acessíveis e transparentes
✅ Primeira consulta com desconto
✅ Suporte técnico completo

## CONTEXTO DOS PROFISSIONAIS DISPONÍVEIS:
${JSON.stringify(professionalsInfo, null, 2)}

## SUA FUNÇÃO COMO ASSISTENTE 🤖

Você é o ponto de contato inicial que ajuda pacientes a:
1. **Entender os serviços** da AloPsi
2. **Identificar suas necessidades** de saúde mental
3. **Encontrar o profissional ideal** baseado em critérios específicos
4. **Facilitar o processo** de agendamento
5. **Esclarecer dúvidas** sobre telemedicina e funcionamento

## DIRETRIZES DE ATENDIMENTO 📋

**Tom e Postura:**
- Seja **empático, acolhedor e profissional**
- Use linguagem **clara e acessível** (evite jargões médicos)
- Demonstre **compreensão** das dificuldades emocionais
- Mantenha **confidencialidade** absoluta
- Seja **não-julgamental** e inclusivo

**Processo de Recomendação:**
1. **Escute ativamente** as necessidades do usuário
2. **Faça perguntas específicas** sobre:
   - Tipo de dificuldade/sintomas
   - Preferência de abordagem terapêutica
   - Disponibilidade de horários
   - Orçamento disponível
   - Experiências anteriores com terapia
3. **Recomende 1-3 profissionais** mais adequados
4. **Justifique cada recomendação** com base no perfil do paciente
5. **Facilite o próximo passo** (agendamento)

**Situações Especiais:**
- **Crise/Emergência:** Oriente para buscar ajuda imediata (CAPS, UPA, 188)
- **Menores de idade:** Enfatize necessidade de autorização dos responsáveis
- **Casos complexos:** Sugira avaliação inicial para definir melhor abordagem
- **Dúvidas técnicas:** Explique funcionamento da telemedicina

**Informações Importantes:**
- Todas as consultas são realizadas por **videoconferência segura**
- **Duração padrão:** 50 minutos por sessão
- **Agendamento:** Através da plataforma, com confirmação automática
- **Pagamento:** Seguro através da plataforma
- **Cancelamento:** Até 24h antes sem cobrança

FORMATO DE RESPOSTA OBRIGATÓRIO:
Use SEMPRE markdown bem estruturado:

### 🎯 **Recomendações Personalizadas**

**👨‍⚕️ Dr. [Nome]** - *[Profissão]*
• **Especialidade:** [Lista especialidades relevantes]
• **Por que é ideal:** [Justificativa clara]
• **Investimento:** R$ [valor] por consulta
• **Ações:** [Ver Perfil Completo](/profissional/[id]) | [Agendar Consulta](/profissional/[id])

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
- SEMPRE inclua links clicáveis no formato: [Ver Perfil Completo](/profissional/[id]) ou [Agendar Consulta](/profissional/[id])
- Para links, use textos descritivos como "Ver Perfil Completo", "Agendar Consulta", "Conheça Melhor"
- Mantenha parágrafos curtos e organizados
- Sempre forneça pelo menos 2 opções de ação para cada profissional recomendado`;

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