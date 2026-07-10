// Gera insights executivos e "efeito uau" para gestão institucional (cache 24h)
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
    const [aggRes, triageRes, studentsRes] = await Promise.all([
      admin.rpc("get_institution_mood_aggregates", { p_institution_id: institutionId, p_period_days: 60 })
        .then((r: any) => r).catch(() => ({ data: null })),
      admin.from("student_triage").select("status,risk_level,priority,created_at,resolved_at,recommended_action")
        .eq("institution_id", institutionId).gte("created_at", new Date(Date.now() - 60 * 86400_000).toISOString()),
      admin.from("patient_institutions").select("patient_id").eq("institution_id", institutionId),
    ]);

    const triages = triageRes.data || [];
    const STATUS_PT: Record<string, string> = {
      open: "em aberto",
      triaged: "triadas",
      in_progress: "em acompanhamento",
      resolved: "resolvidas",
      pending: "aguardando análise",
    };
    const RISK_PT: Record<string, string> = {
      high: "alto risco",
      medium: "risco moderado",
      low: "baixo risco",
      critical: "crítico",
      alert: "alerta",
      attention: "atenção",
      healthy: "saudável",
      no_data: "sem registros no período",
    };
    const humanizeKeys = (obj: Record<string, number>, dict: Record<string, string>) =>
      Object.fromEntries(Object.entries(obj).map(([k, v]) => [dict[k] || k, v]));
    const byStatusRaw = triages.reduce((acc: any, t: any) => { acc[t.status] = (acc[t.status] || 0) + 1; return acc; }, {});
    const byRiskRaw = triages.reduce((acc: any, t: any) => {
      const k = String(t.risk_level).toLowerCase(); acc[k] = (acc[k] || 0) + 1; return acc;
    }, {});
    const context = {
      period: { start, end },
      total_students: studentsRes.data?.length || 0,
      mood_aggregates: aggRes.data,
      triage_summary: {
        total: triages.length,
        by_status: humanizeKeys(byStatusRaw, STATUS_PT),
        by_risk: humanizeKeys(byRiskRaw, RISK_PT),
        resolved: triages.filter((t: any) => t.status === "resolved").length,
      },
    };


    const systemPrompt = `Você é um consultor sênior de bem-estar estudantil falando com a reitoria/coordenação de uma instituição de ensino.
Traduza dados agregados anônimos em decisões que a gestão toma segunda de manhã. Nada de jargão clínico. Nada de "recomendo procurar um profissional". Fale como um estrategista que entende de educação, retenção, evasão, clima acadêmico e reputação institucional.

Cada insight deve responder: (1) o que está acontecendo agora, (2) por que isso importa para a INSTITUIÇÃO (retenção, engajamento, clima, reputação, desempenho), (3) o que fazer nos próximos 15 dias, (4) quem executa.

Produza um "efeito uau": comece por um headline forte, uma métrica de destaque que o gestor vai lembrar, e conquistas para celebrar. Nunca cite alunos individualmente.

Devolva APENAS JSON válido (sem markdown) no formato:
{
  "headline": "Frase única de impacto, máx 90 caracteres, tom de manchete executiva",
  "tldr": "Resumo executivo em 2 a 3 frases — leitura de 10 segundos",
  "wow_metric": { "label": "curto", "value": "número/percentual formatado", "context": "o que isso significa em 1 frase" },
  "celebrate": ["conquista 1", "conquista 2", "conquista 3"],
  "insights": [
    {
      "title": "Título curto e específico",
      "situation": "O que os dados mostram (1-2 frases, com números)",
      "impact": "Por que a instituição deve se importar (retenção/engajamento/clima)",
      "recommendation": "Ação concreta em 1-2 frases",
      "cohort": "Grupo afetado (ex: 'alunos com humor <3 nos últimos 15 dias')",
      "dimension": "academico" | "socioemocional" | "engajamento" | "risco",
      "severity": "positivo" | "atencao" | "alerta" | "critico",
      "confidence": "baixa" | "media" | "alta",
      "evidence": "Referência numérica curta que sustenta"
    }
  ],
  "priority_actions": [
    {
      "title": "Ação clara",
      "why": "Motivo em 1 frase (foco em resultado institucional)",
      "how": ["passo 1", "passo 2", "passo 3"],
      "owner": "Coordenação" | "Psicologia" | "Professores" | "Gestão" | "Comunicação",
      "timeframe": "esta semana" | "15 dias" | "30 dias",
      "cta_label": "Rótulo do botão",
      "cta_target": "triagem" | "notas" | "diario" | "metricas" | null
    }
  ]
}
Regras: 4 insights, 3 a 4 ações prioritárias, 3 conquistas. Se dados forem escassos, ainda assim gere insights úteis com confidence="baixa".`;

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${LOVABLE_API_KEY}` },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Dados agregados da instituição:\n${JSON.stringify(context, null, 2)}` },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!aiResp.ok) {
      const errText = await aiResp.text();
      console.error("AI error", aiResp.status, errText);
      return json({ error: "Falha ao gerar insights", details: errText }, aiResp.status);
    }

    const aiJson = await aiResp.json();
    const raw = aiJson?.choices?.[0]?.message?.content ?? "{}";
    let parsed: any = {};
    try { parsed = JSON.parse(raw); } catch { parsed = {}; }

    const payload = {
      headline: parsed.headline || "",
      tldr: parsed.tldr || "",
      wow_metric: parsed.wow_metric || null,
      celebrate: Array.isArray(parsed.celebrate) ? parsed.celebrate : [],
      insights: Array.isArray(parsed.insights) ? parsed.insights : [],
      priority_actions: Array.isArray(parsed.priority_actions) ? parsed.priority_actions : [],
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
