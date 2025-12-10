import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface DailyEntry {
  date: string;
  avg_mood: number | null;
  avg_anxiety: number | null;
  avg_sleep: number | null;
  avg_energy: number | null;
  entries_count: number;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { institutionId, dailyEntries, metrics } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    if (!institutionId || !dailyEntries || dailyEntries.length === 0) {
      return new Response(
        JSON.stringify({ 
          predictions: [],
          insights: [],
          error: "Dados insuficientes para análise preditiva" 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Prepare data summary for AI
    const dataSummary = {
      totalDays: dailyEntries.length,
      avgMood: metrics?.avg_mood_score,
      avgAnxiety: metrics?.avg_anxiety_level,
      avgSleep: metrics?.avg_sleep_quality,
      avgEnergy: metrics?.avg_energy_level,
      studentsWithEntries: metrics?.students_with_entries,
      studentsWithLowMood: metrics?.students_with_low_mood,
      moodTrend: metrics?.mood_trend,
      changePercent: metrics?.period_comparison?.change_percent,
      recentDays: dailyEntries.slice(-14), // Last 14 days for pattern analysis
    };

    const systemPrompt = `Você é um analista de dados de bem-estar estudantil especializado em análise preditiva.
Analise os dados de bem-estar emocional de uma instituição educacional e gere insights preditivos.

Tipos de análise:
1. TREND: Previsões de tendência (como métricas devem evoluir nos próximos 7-14 dias)
2. ALERT: Alertas antecipados (riscos ou situações que precisam de atenção)
3. PATTERN: Padrões detectados (correlações, ciclos semanais, etc.)
4. RECOMMENDATION: Recomendações acionáveis baseadas nos dados
5. CORRELATION: Correlações entre métricas (sono x humor, etc.)

Considere:
- Tendências recentes e históricas
- Padrões semanais (segundas vs sextas, etc.)
- Correlações entre métricas
- Sinais de alerta precoce
- Contexto educacional (provas, feriados, etc.)

Seja específico, quantitativo e acionável. Use porcentagens e valores concretos.
Priorize insights que permitam ação preventiva.`;

    const userPrompt = `Analise estes dados de bem-estar estudantil e gere insights preditivos:

RESUMO GERAL:
- Período analisado: ${dataSummary.totalDays} dias
- Média de humor: ${dataSummary.avgMood?.toFixed(1) || 'N/A'}/5
- Média de ansiedade: ${dataSummary.avgAnxiety?.toFixed(1) || 'N/A'}/5
- Média de sono: ${dataSummary.avgSleep?.toFixed(1) || 'N/A'}/5
- Média de energia: ${dataSummary.avgEnergy?.toFixed(1) || 'N/A'}/5
- Alunos participando: ${dataSummary.studentsWithEntries || 0}
- Alunos com humor baixo: ${dataSummary.studentsWithLowMood || 0}
- Tendência atual: ${dataSummary.moodTrend} (${dataSummary.changePercent?.toFixed(1) || 0}%)

DADOS DOS ÚLTIMOS 14 DIAS:
${JSON.stringify(dataSummary.recentDays, null, 2)}

Gere 3-5 insights preditivos relevantes usando a função generate_predictions.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "generate_predictions",
              description: "Gera previsões e insights preditivos baseados em análise de dados de bem-estar",
              parameters: {
                type: "object",
                properties: {
                  predictions: {
                    type: "array",
                    description: "Lista de insights preditivos gerados",
                    items: {
                      type: "object",
                      properties: {
                        type: {
                          type: "string",
                          enum: ["trend", "alert", "pattern", "recommendation", "correlation"],
                          description: "Tipo do insight preditivo",
                        },
                        severity: {
                          type: "string",
                          enum: ["low", "medium", "high"],
                          description: "Severidade ou importância do insight",
                        },
                        metric: {
                          type: "string",
                          description: "Métrica principal relacionada (mood, anxiety, sleep, energy, general)",
                        },
                        prediction_value: {
                          type: "number",
                          description: "Valor previsto ou mudança percentual esperada",
                        },
                        confidence: {
                          type: "number",
                          description: "Nível de confiança da previsão (0-100)",
                        },
                        timeframe_days: {
                          type: "number",
                          description: "Prazo em dias para a previsão",
                        },
                        title: {
                          type: "string",
                          description: "Título curto e claro do insight",
                        },
                        description: {
                          type: "string",
                          description: "Descrição detalhada do insight com dados específicos",
                        },
                        action_items: {
                          type: "array",
                          items: { type: "string" },
                          description: "Lista de ações recomendadas",
                        },
                      },
                      required: ["type", "severity", "metric", "confidence", "title", "description"],
                    },
                  },
                  forecast: {
                    type: "array",
                    description: "Previsão numérica para os próximos 7 dias",
                    items: {
                      type: "object",
                      properties: {
                        days_ahead: { type: "number" },
                        predicted_mood: { type: "number" },
                        predicted_anxiety: { type: "number" },
                        confidence_low: { type: "number" },
                        confidence_high: { type: "number" },
                      },
                    },
                  },
                },
                required: ["predictions"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "generate_predictions" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limits exceeded, please try again later.", predictions: [], insights: [] }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required, please add funds to your Lovable AI workspace.", predictions: [], insights: [] }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    console.log("AI response:", JSON.stringify(data, null, 2));

    // Extract tool call result
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) {
      throw new Error("No predictions generated");
    }

    const result = JSON.parse(toolCall.function.arguments);
    
    // Generate forecast dates
    const today = new Date();
    const forecastWithDates = (result.forecast || []).map((f: any) => {
      const forecastDate = new Date(today);
      forecastDate.setDate(forecastDate.getDate() + f.days_ahead);
      return {
        date: forecastDate.toISOString().split('T')[0],
        predicted_mood: f.predicted_mood,
        predicted_anxiety: f.predicted_anxiety,
        confidence_low: f.confidence_low,
        confidence_high: f.confidence_high,
      };
    });

    return new Response(
      JSON.stringify({
        predictions: result.predictions || [],
        forecast: forecastWithDates,
        generated_at: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in generate-predictive-wellbeing-insights:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error",
        predictions: [],
        forecast: [],
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
