// Gera um resumo executivo semanal para instituições (com cache de 24h)
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

    // Autoriza: usuário deve pertencer à instituição
    const { data: iu } = await admin
      .from("institution_users")
      .select("id")
      .eq("institution_id", institutionId)
      .eq("user_id", userId)
      .maybeSingle();
    if (!iu) return json({ error: "Sem acesso a esta instituição" }, 403);

    // Cache 24h
    if (!force) {
      const { data: cached } = await admin
        .from("buddy_insights")
        .select("id, payload, created_at")
        .eq("institution_id", institutionId)
        .eq("insight_type", "institution_weekly_brief")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (cached && Date.now() - new Date(cached.created_at).getTime() < 24 * 3600_000) {
        return json({ cached: true, ...(cached.payload as any) });
      }
    }

    // Coleta dados agregados
    const since = new Date(Date.now() - 7 * 86400_000).toISOString();
    const sinceDate = since.slice(0, 10);
    const prevSince = new Date(Date.now() - 14 * 86400_000).toISOString().slice(0, 10);

    const [studentsRes, moodRes, moodPrevRes, triageRes] = await Promise.all([
      admin.from("patient_institutions").select("patient_id").eq("institution_id", institutionId),
      admin.rpc("get_institution_mood_aggregates", { p_institution_id: institutionId, p_period_days: 7 })
        .then((r: any) => r).catch(() => ({ data: null })),
      admin.rpc("get_institution_mood_aggregates", { p_institution_id: institutionId, p_period_days: 14 })
        .then((r: any) => r).catch(() => ({ data: null })),

      admin.from("student_triage").select("status,risk_level,created_at,resolved_at")
        .eq("institution_id", institutionId).gte("created_at", since),
    ]);

    const totalStudents = studentsRes.data?.length || 0;
    const triages = triageRes.data || [];
    const totalTriage = triages.length;
    const resolvedTriage = triages.filter((t: any) => t.status === "resolved").length;
    const highRiskOpen = triages.filter(
      (t: any) => t.status !== "resolved" && ["alto", "critico", "high", "critical"].includes(String(t.risk_level).toLowerCase())
    ).length;

    const summary = {
      total_students: totalStudents,
      last_7d: moodRes.data,
      prev_7d: moodPrevRes.data,
      total_triage_week: totalTriage,
      resolved_triage_week: resolvedTriage,
      high_risk_open: highRiskOpen,
    };

    const prompt = `Você é o Buddy, um analista de bem-estar de uma instituição de ensino. Gere um resumo semanal executivo em português brasileiro (máx 220 palavras), tom acolhedor e prático, para gestores. Use os dados agregados anônimos abaixo. Estruture em: (1) Panorama da semana, (2) Sinais de atenção, (3) O que celebrar, (4) Sugestão de próximo passo. Nunca cite alunos individualmente.\n\nDADOS: ${JSON.stringify(summary)}`;

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!aiResp.ok) {
      const errText = await aiResp.text();
      console.error("AI error", aiResp.status, errText);
      return json({ error: "Falha ao gerar resumo", details: errText }, aiResp.status);
    }

    const aiJson = await aiResp.json();
    const brief = aiJson?.choices?.[0]?.message?.content ?? "";

    const payload = {
      brief,
      metrics: summary,
      generated_at: new Date().toISOString(),
      model: MODEL,
    };

    await admin.from("buddy_insights").insert({
      institution_id: institutionId,
      insight_type: "institution_weekly_brief",
      payload,
      period_start: sinceDate,
      period_end: new Date().toISOString().slice(0, 10),
      model: MODEL,
    });

    return json({ cached: false, ...payload });
  } catch (e: any) {
    console.error("weekly-brief error", e);
    return json({ error: e?.message || "Erro interno" }, 500);
  }
});
