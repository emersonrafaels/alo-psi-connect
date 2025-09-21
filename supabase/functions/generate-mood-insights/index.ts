import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.0';

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

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      throw new Error('OpenAI API key não configurada');
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

    // Prepare data for OpenAI
    const entriesText = moodEntries.map(entry => 
      `Data: ${entry.date}
      Humor: ${entry.mood_score}/5
      Energia: ${entry.energy_level}/5
      Ansiedade: ${entry.anxiety_level}/5
      Sono: ${entry.sleep_hours}h (qualidade: ${entry.sleep_quality}/5)
      ${entry.journal_text ? `Diário: ${entry.journal_text}` : ''}
      ${entry.tags?.length ? `Tags: ${entry.tags.join(', ')}` : ''}`
    ).join('\n\n');

    const systemPrompt = `Você é um assistente especializado em análise de bem-estar emocional. 
    Analise os dados do diário emocional e forneça insights úteis e compassivos.
    
    Seus insights devem:
    - Identificar padrões e tendências
    - Sugerir correlações entre diferentes métricas
    - Oferecer recomendações práticas e gentis
    - Ser encorajador e positivo
    - Focar em ações que a pessoa pode tomar
    
    Responda em português brasileiro, de forma empática e profissional.
    Limite sua resposta a no máximo 300 palavras.`;

    const userPrompt = `Analise estes dados do diário emocional e forneça insights sobre padrões, tendências e sugestões de melhoria:

    ${entriesText}`;

    // Call OpenAI
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('OpenAI API error:', error);
      throw new Error('Erro ao gerar insights');
    }

    const data = await response.json();
    const insights = data.choices[0].message.content;

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
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});