// Gera insights preditivos e sugestões de ação para instituições (cache 24h)
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const MODEL = "google/gemini-2.5-flash";

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    if (!LOVABLE_API_KEY) return json({ error: "LOVABLE_API_KEY não configurada" }, 500);
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);

    const supabaseUser = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: claims, error: claimsErr } = await supabaseUser.auth.getClaims(token);
    if (claimsErr || !claims?.claims?.sub) return json({ error: "Unauthorized" }, 401);
    const userId = claims.claims.sub as string;

    const body = await req.json().catch(() => ({}));
    const institutionId = body?.institutionId as string | undefined;
    const force = !!body?.force;
    if (!institutionId) return json({ error: "institutionId obrigatório" }, 400);

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: iu } = await admin
      .from("institution_users").select("id")
      .eq("institution_id", institutionId).eq("user_id", userId).maybeSingle();
    if (!iu) return json({ error: "Sem acesso" }, 403);

    if (!force) {
      const { data: cached } = await admin
        .from("buddy_insights")
        .select("id, payload, created_at")
        .eq("institution_id", institutionId)
        .eq("insight_type", "institution_predictive")
        .order("created_at", { ascending: false }).limit(1).maybeSingle();
      if (cached && Date.now() - new Date(cached.created_at).getTime() < 24 * 3600_000) {
        return json({ cached: true, ...(cached.payload as any) });
      }
    }

    const start = new Date(Date.now() - 60 * 86400_000).toISOString().slice(0, 10);
    const end = new Date().toISOString().slice(0, 10);
    const [aggRes, triageRes] = await Promise.all([
      admin.rpc("get_institution_mood_aggregates", {
        p_institution_id: institutionId, p_start_date: start, p_end_date: end,
      }).then((r: any) => r).catch(() => ({ data: null })),
      admin.from("student_triage").select("status,risk_level,priority,created_at,resolved_at,recommended_action")
        .eq("institution_id", institutionId).gte("created_at", new Date(Date.now() - 60 * 86400_000).toISOString()),
    ]);

    const context = {
      period: { start, end },
      mood_aggregates: aggRes.data,
      triage_summary: {
        total: (triageRes.data || []).length,
        by_status: (triageRes.data || []).reduce((acc: any, t: any) => {
          acc[t.status] = (acc[t.status] || 0) + 1; return acc;
        }, {}),
        by_risk: (triageRes.data || []).reduce((acc: any, t: any) => {
          const k = String(t.risk_level).toLowerCase();
          acc[k] = (acc[k] || 0) + 1; return acc;
        }, {}),
      },
    };

    const systemPrompt = `Você é o Buddy institucional. Analise dados agregados anônimos e devolva APENAS JSON válido (sem markdown, sem comentários) no formato:
{
  "predictive_insights": [
    { "title": string, "description": string, "affected_cohort": string, "time_window": string, "confidence": "baixa"|"media"|"alta", "evidence": string }
  ],
  "suggested_actions": [
    { "title": string, "description": string, "category": "grupo"|"pratica"|"campanha"|"triagem"|"conteudo", "cta_label": string }
  ]
}
Regras: 3 a 5 insights preditivos; 3 a 5 sugestões acionáveis; foco em próximos 15 dias; nunca cite alunos individualmente; use português brasileiro; seja específico e prático.`;

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${LOVABLE_API_KEY}` },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Dados agregados: ${JSON.stringify(context)}` },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!aiResp.ok) {
      const errText = await aiResp.text();
      return json({ error: "Falha ao gerar insights", details: errText }, aiResp.status);
    }

    const aiJson = await aiResp.json();
    const raw = aiJson?.choices?.[0]?.message?.content ?? "{}";
    let parsed: any = {};
    try { parsed = JSON.parse(raw); } catch { parsed = { predictive_insights: [], suggested_actions: [] }; }

    const payload = {
      predictive_insights: Array.isArray(parsed.predictive_insights) ? parsed.predictive_insights : [],
      suggested_actions: Array.isArray(parsed.suggested_actions) ? parsed.suggested_actions : [],
      generated_at: new Date().toISOString(),
      model: MODEL,
    };

    await admin.from("buddy_insights").insert({
      institution_id: institutionId,
      insight_type: "institution_predictive",
      payload,
      period_start: start,
      period_end: end,
      model: MODEL,
    });

    return json({ cached: false, ...payload });
  } catch (e: any) {
    console.error("predictive error", e);
    return json({ error: e?.message || "Erro interno" }, 500);
  }
});
