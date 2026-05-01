import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MoodEntry {
  date: string;
  mood_score: number;
  energy_level: number;
  anxiety_level: number;
  sleep_hours: number;
  sleep_quality: number;
  journal_text?: string;
  tags?: string[];
}

interface InsightRequest {
  moodEntries: MoodEntry[];
  sessionId?: string;
}

function categorizeTheme(theme: string): string {
  const t = theme.toLowerCase();
  if (/\b(trabalho|carreira|profiss|chefe|empresa|escrit|emprego)\b/.test(t)) return 'trabalho';
  if (/\b(estud|escola|faculdade|universidade|prova|aula|tcc)\b/.test(t)) return 'estudos';
  if (/\b(relacion|namoro|casamento|amor|parceir|crush|familia|família|amig)\b/.test(t)) return 'relacionamento';
  if (/\b(saúde|saude|sono|cansa|exerc|aliment|corpo|dor|doen)\b/.test(t)) return 'saude';
  if (/\b(dinheiro|finan|conta|salário|salario|gasto|divida|dívida)\b/.test(t)) return 'financeiro';
  if (/\b(lazer|hobby|descanso|viagem|diver|pass|fim de semana)\b/.test(t)) return 'lazer';
  return 'outros';
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!lovableApiKey && !openaiApiKey) {
      throw new Error('Nenhuma chave de IA configurada (LOVABLE_API_KEY ou OPENAI_API_KEY).');
    }

    const { moodEntries, sessionId }: InsightRequest = await req.json();

    if (!moodEntries || moodEntries.length === 0) {
      throw new Error('Dados do diário emocional são obrigatórios');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    let userId: string | null = null;
    let isGuest = true;

    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabase.auth.getUser(token);
      if (user) {
        userId = user.id;
        isGuest = false;
      }
    }

    // Get system configurations
    const { data: configs, error: configError } = await supabase
      .from('system_configurations')
      .select('key, value')
      .in('key', ['guest_insights_limit', 'user_insights_limit']);

    if (configError) {
      console.error('Error fetching configurations:', configError);
    }

    const guestLimit = configs?.find(c => c.key === 'guest_insights_limit')?.value || 3;
    const userLimit = configs?.find(c => c.key === 'user_insights_limit')?.value || 6;
    const currentLimit = isGuest ? parseInt(guestLimit) : parseInt(userLimit);

    // Get current month-year
    const now = new Date();
    const monthYear = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    // Check current usage
    let whereClause: any = { month_year: monthYear };
    if (isGuest && sessionId) {
      whereClause.session_id = sessionId;
      whereClause.user_id = null;
    } else if (!isGuest && userId) {
      whereClause.user_id = userId;
    } else {
      throw new Error('Sessão inválida');
    }

    const { data: usageData, error: usageError } = await supabase
      .from('ai_insights_usage')
      .select('*')
      .match(whereClause)
      .maybeSingle();

    if (usageError && usageError.code !== 'PGRST116') {
      console.error('Error checking usage:', usageError);
      throw new Error('Erro ao verificar limite de uso');
    }

    const currentUsage = usageData?.insights_count || 0;

    if (currentUsage >= currentLimit) {
      const limitMessage = isGuest 
        ? `Você atingiu o limite de ${currentLimit} insights por sessão. Faça login para ter mais insights mensais!`
        : `Você atingiu o limite de ${currentLimit} insights por mês. Aguarde o próximo mês para gerar novos insights.`;
      
      return new Response(
        JSON.stringify({ 
          error: limitMessage,
          limitReached: true,
          currentUsage,
          limit: currentLimit
        }),
        {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Prepare data for the AI model (todos os termos em PT-BR para evitar saídas em inglês)
    const entriesText = moodEntries.map(entry => {
      const lines = [
        `Data: ${entry.date}`,
        `Humor: ${entry.mood_score ?? 'N/A'}/5`,
        `Energia: ${entry.energy_level ?? 'N/A'}/5`,
        `Ansiedade: ${entry.anxiety_level ?? 'N/A'}/5`,
        `Horas de sono: ${entry.sleep_hours ?? 'N/A'}h (qualidade: ${entry.sleep_quality ?? 'N/A'}/5)`,
      ];
      if (entry.journal_text) lines.push(`Reflexão: ${entry.journal_text}`);
      if (entry.tags?.length) lines.push(`Tags: ${entry.tags.join(', ')}`);
      return lines.join('\n');
    }).join('\n\n');

    // Calcula nível de confiança com base no número de registros
    const entriesCount = moodEntries.length;
    const confidence: 'very_low' | 'low' | 'medium' | 'high' =
      entriesCount <= 2 ? 'very_low' :
      entriesCount <= 5 ? 'low' :
      entriesCount <= 10 ? 'medium' : 'high';

    const systemPrompt = `Você é um assistente de bem-estar emocional da Rede Bem-Estar.
Seu papel é ajudar a pessoa a refletir sobre seus registros de diário emocional, com tom acolhedor, humano, claro e cuidadoso.

REGRAS OBRIGATÓRIAS:
- Sempre responder em português brasileiro.
- Use SOMENTE os termos: "Humor", "Energia", "Ansiedade", "Horas de sono", "Qualidade do sono", "Estresse".
- NUNCA use termos em inglês como "Sleep Hours", "Mood Score", "Energy Level", "Anxiety Level".
- NÃO diagnostique. NÃO prometa cura. NÃO substitua acompanhamento profissional.
- Use linguagem cuidadosa: "pode haver uma relação", "parece estar associado", "vale observar".
- Seja conciso: cada item das listas deve ter no máximo 1-2 frases curtas.
- Quando há poucos registros, deixe isso explícito no resumo.`;

    const userPrompt = `Analise estes registros do diário emocional e gere uma análise estruturada com padrões, pontos positivos, pontos de atenção, possíveis temas e sugestões práticas.

Quantidade de registros: ${entriesCount}
Nível de confiança esperado: ${confidence}

Registros:

${entriesText}`;

    const insightTool = {
      type: 'function',
      function: {
        name: 'emit_mood_insight',
        description: 'Emite uma análise estruturada do diário emocional.',
        parameters: {
          type: 'object',
          properties: {
            summary: { type: 'string', description: 'Resumo curto e humano (1-2 frases) do estado emocional recente.' },
            positive_patterns: { type: 'array', items: { type: 'string' }, description: 'Padrões positivos observados.' },
            attention_points: { type: 'array', items: { type: 'string' }, description: 'Pontos que merecem atenção.' },
            possible_triggers: { type: 'array', items: { type: 'string' }, description: 'Possíveis gatilhos ou influências (use linguagem cuidadosa).' },
            suggested_actions: { type: 'array', items: { type: 'string' }, description: '2 a 4 sugestões práticas e gentis para os próximos dias.' },
            detected_themes: { type: 'array', items: { type: 'string' }, description: 'Temas recorrentes (ex.: trabalho, sono, descanso, relacionamento, estudos).' },
            risk_level: { type: 'string', enum: ['healthy', 'attention', 'alert', 'critical'] },
            confidence: { type: 'string', enum: ['very_low', 'low', 'medium', 'high'] },
          },
          required: ['summary', 'positive_patterns', 'attention_points', 'possible_triggers', 'suggested_actions', 'detected_themes', 'risk_level', 'confidence'],
          additionalProperties: false,
        },
      },
    };

    // Prefere Lovable AI Gateway; fallback para OpenAI
    const useLovable = !!lovableApiKey;
    const apiUrl = useLovable
      ? 'https://ai.gateway.lovable.dev/v1/chat/completions'
      : 'https://api.openai.com/v1/chat/completions';
    const apiKey = useLovable ? lovableApiKey : openaiApiKey;
    const model = useLovable ? 'google/gemini-2.5-flash' : 'gpt-4o-mini';

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        tools: [insightTool],
        tool_choice: { type: 'function', function: { name: 'emit_mood_insight' } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Limite de requisições atingido. Tente novamente em instantes.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Créditos de IA insuficientes. Adicione créditos em Settings → Workspace → Usage.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errText = await response.text();
      console.error('AI gateway error:', response.status, errText);
      throw new Error('Erro ao gerar insights');
    }

    const data = await response.json();
    const toolCall = data?.choices?.[0]?.message?.tool_calls?.[0];
    let structured: any = null;
    if (toolCall?.function?.arguments) {
      try { structured = JSON.parse(toolCall.function.arguments); } catch (e) { console.error('Failed to parse tool args', e); }
    }

    // Garante o nível de confiança calculado no servidor
    if (structured && typeof structured === 'object') {
      structured.confidence = confidence;
    } else {
      // Fallback: usa o conteúdo de texto se o tool-call falhou
      structured = {
        summary: data?.choices?.[0]?.message?.content || 'Não foi possível gerar uma análise estruturada desta vez.',
        positive_patterns: [],
        attention_points: [],
        possible_triggers: [],
        suggested_actions: [],
        detected_themes: [],
        risk_level: 'healthy',
        confidence,
      };
    }

    const insights = JSON.stringify(structured);

    // Persist detected themes + buddy memory (best-effort, non-blocking on errors)
    if (userId && Array.isArray(structured.detected_themes) && structured.detected_themes.length > 0) {
      try {
        const latestEntry = moodEntries[moodEntries.length - 1] as any;
        if (latestEntry?.id) {
          // Remove existing themes for this entry to avoid duplicates
          await supabase
            .from('mood_detected_themes')
            .delete()
            .eq('mood_entry_id', latestEntry.id)
            .eq('user_id', userId);
          const themeRows = structured.detected_themes.slice(0, 8).map((t: string) => ({
            mood_entry_id: latestEntry.id,
            user_id: userId,
            theme: String(t).toLowerCase().slice(0, 80),
            category: categorizeTheme(String(t)),
            sentiment: structured.risk_level === 'healthy' ? 'positivo' : structured.risk_level === 'attention' ? 'neutro' : 'negativo',
            confidence: structured.confidence === 'high' ? 0.9 : structured.confidence === 'medium' ? 0.7 : 0.5,
          }));
          if (themeRows.length > 0) {
            await supabase.from('mood_detected_themes').insert(themeRows);
          }
        }

        // Update buddy memory snapshot
        await supabase
          .from('mood_buddy_memory')
          .upsert({
            user_id: userId,
            recent_themes: structured.detected_themes.slice(0, 6),
            recent_observations: [
              ...(structured.attention_points || []).slice(0, 3),
              ...(structured.positive_patterns || []).slice(0, 2),
            ],
            last_message_at: new Date().toISOString(),
          }, { onConflict: 'user_id' });
      } catch (e) {
        console.error('Failed to persist themes/buddy memory:', e);
      }
    }

    // Save insight to history
    const { data: historyEntry, error: historyError } = await supabase
      .from('ai_insights_history')
      .insert({
        user_id: userId,
        session_id: isGuest ? sessionId : null,
        insight_content: insights,
        mood_data: moodEntries
      })
      .select()
      .single();

    if (historyError) {
      console.error('Error saving insight to history:', historyError);
    }

    // Update usage count
    if (usageData) {
      // Update existing record
      await supabase
        .from('ai_insights_usage')
        .update({ insights_count: currentUsage + 1 })
        .eq('id', usageData.id);
    } else {
      // Create new record
      const insertData: any = {
        insights_count: 1,
        month_year: monthYear,
      };

      if (isGuest && sessionId) {
        insertData.session_id = sessionId;
      } else if (!isGuest && userId) {
        insertData.user_id = userId;
      }

      await supabase
        .from('ai_insights_usage')
        .insert(insertData);
    }

    return new Response(
      JSON.stringify({ 
        insights,
        insightId: historyEntry?.id,
        currentUsage: currentUsage + 1,
        limit: currentLimit,
        isGuest
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in generate-mood-insights:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});