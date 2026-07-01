// Gera um snapshot de insights do Buddy conectando dados do paciente e IA
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const MODEL = "google/gemini-3-flash-preview";

type Recommendation = {
  id: string;
  title: string;
  description: string;
  category: string;
  cta?: string;
};

type Strength = { title: string; description: string };
type AttentionPoint = { title: string; description: string; severity?: "low" | "medium" | "high" };
type MapTopic = { id: string; label: string; weight: number };

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    if (!LOVABLE_API_KEY) {
      return json({ error: "LOVABLE_API_KEY não configurada" }, 500);
    }

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
    const periodDays = Math.min(Math.max(Number(body?.periodDays ?? 30), 7), 90);

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Resolve paciente
    const { data: profile } = await admin
      .from("profiles").select("id, nome").eq("user_id", userId).maybeSingle();
    if (!profile) return json({ error: "Perfil não encontrado" }, 404);

    const { data: patient } = await admin
      .from("pacientes").select("id").eq("profile_id", profile.id).maybeSingle();
    if (!patient) return json({ error: "Paciente não encontrado" }, 404);

    const patientId = patient.id as string;
    const periodEnd = new Date();
    const periodStart = new Date(periodEnd.getTime() - periodDays * 86400_000);
    const periodStartISO = periodStart.toISOString().slice(0, 10);
    const periodEndISO = periodEnd.toISOString().slice(0, 10);

    // Coleta dados
    const [portraitRes, moodRes, moodAnalysesRes, scaleRes, iseuRes, praticasRes, agendRes] =
      await Promise.all([
        admin.from("buddy_portraits").select("*").eq("patient_id", patientId).maybeSingle(),
        admin.from("mood_entries").select("id,date,emotion_values,notes")
          .eq("user_id", userId).gte("date", periodStartISO).order("date", { ascending: true }),
        admin.from("mood_entry_analyses").select("mood_entry_id,risk_level,summary,buddy_message")
          .in("mood_entry_id", []) // preenchido depois
          .limit(0),
        admin.from("emotional_scale_responses").select("id,created_at,scale_id,score")
          .eq("user_id", userId).gte("created_at", periodStart.toISOString()),
        admin.from("iseu_scores").select("*").eq("user_id", userId)
          .gte("created_at", periodStart.toISOString()),
        admin.from("praticas_checkouts").select("*").eq("user_id", userId)
          .gte("created_at", periodStart.toISOString()),
        admin.from("agendamentos").select("id,data_consulta,status")
          .eq("user_id", userId).gte("data_consulta", periodStartISO),
      ]);

    const moodEntries = moodRes.data ?? [];
    const moodIds = moodEntries.map((m: any) => m.id);
    const { data: moodAnalyses } = moodIds.length
      ? await admin.from("mood_entry_analyses")
          .select("mood_entry_id,risk_level,summary,buddy_message")
          .in("mood_entry_id", moodIds)
      : { data: [] as any[] };

    // Métricas determinísticas
    const wellbeingSamples: number[] = moodEntries
      .map((e: any) => averageEmotion(e.emotion_values))
      .filter((n: number | null): n is number => n !== null);
    const wellbeing = avg(wellbeingSamples);
    const stability = wellbeingSamples.length > 1
      ? Math.max(0, 10 - stdDev(wellbeingSamples))
      : null;
    const uniqueDays = new Set(moodEntries.map((e: any) => e.date)).size;
    const consistency = periodDays > 0 ? Math.min(10, (uniqueDays / periodDays) * 10) : null;
    const sleep = avgField(moodEntries, "sleep") ?? avgField(moodEntries, "sono");

    const sources = {
      diario: moodEntries.length,
      escalas: scaleRes.data?.length ?? 0,
      iseu: iseuRes.data?.length ?? 0,
      praticas: praticasRes.data?.length ?? 0,
      encontros: agendRes.data?.length ?? 0,
      analises: moodAnalyses?.length ?? 0,
    };

    // Prompt para IA
    const portrait = portraitRes.data;
    const system = `Você é o Buddy, um assistente empático e cuidadoso de bem-estar mental da Rede Bem-Estar.
Fale em português brasileiro, de forma acolhedora, humana e não clínica. Nunca diagnostique.
Analise os dados do paciente e devolva JSON válido no schema informado.`;

    const userPrompt = `Nome: ${profile.nome ?? "usuário"}
Período analisado: ${periodStartISO} a ${periodEndISO} (${periodDays} dias)

Métricas calculadas:
- Bem-estar médio (0-10): ${fmt(wellbeing)}
- Estabilidade emocional (0-10): ${fmt(stability)}
- Consistência de check-ins (0-10): ${fmt(consistency)}
- Sono médio (0-10): ${fmt(sleep)}

Fontes: ${JSON.stringify(sources)}

Retrato do paciente: ${portrait ? JSON.stringify({
  mind_on: portrait.mind_on, calms_me: portrait.calms_me,
  wants_to_improve: portrait.wants_to_improve, dreams: portrait.dreams,
  triggers: portrait.triggers, values_list: portrait.values_list,
  message_to_buddy: portrait.message_to_buddy,
  anxiety: portrait.anxiety, sadness: portrait.sadness, motivation: portrait.motivation,
}) : "ainda não preenchido"}

Últimos check-ins (até 20): ${JSON.stringify(moodEntries.slice(-20).map((e: any) => ({
  date: e.date, emotion_values: e.emotion_values, notes: (e.notes ?? "").slice(0, 200),
})))}

Análises da IA passadas (últimas 10): ${JSON.stringify((moodAnalyses ?? []).slice(-10))}

Devolva APENAS JSON válido no formato:
{
  "narrative": "texto empático em 2-3 parágrafos falando com o paciente",
  "strengths": [{"title":"...", "description":"..."}],
  "attention_points": [{"title":"...", "description":"...", "severity":"low|medium|high"}],
  "map_topics": [{"id":"kebab-id","label":"Tema","weight": 0.0-1.0}],
  "recommendations": [{"id":"kebab-id","title":"...","description":"...","category":"pratica|encontro|conteudo|rotina|apoio","cta":"Texto do botão"}]
}
Mínimo 3 fortalezas, 2 pontos de atenção, 5 tópicos do mapa, 4 recomendações.`;

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": LOVABLE_API_KEY,
        "X-Lovable-AIG-SDK": "buddy-insights",
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: system },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (aiRes.status === 429) return json({ error: "rate_limited", message: "Muitas requisições. Tente em instantes." }, 429);
    if (aiRes.status === 402) return json({ error: "credits_exhausted", message: "Créditos do Buddy esgotados. Fale com o suporte." }, 402);
    if (!aiRes.ok) {
      const err = await aiRes.text();
      console.error("Buddy AI error", aiRes.status, err);
      return json({ error: "ai_error", message: err.slice(0, 500) }, 500);
    }

    const aiJson = await aiRes.json();
    const rawText: string = aiJson.choices?.[0]?.message?.content ?? "{}";
    let parsed: {
      narrative?: string;
      strengths?: Strength[];
      attention_points?: AttentionPoint[];
      map_topics?: MapTopic[];
      recommendations?: Recommendation[];
    } = {};
    try { parsed = JSON.parse(rawText); } catch {
      const start = rawText.indexOf("{"); const end = rawText.lastIndexOf("}");
      if (start >= 0 && end > start) parsed = JSON.parse(rawText.slice(start, end + 1));
    }

    const { data: inserted, error: insertError } = await admin
      .from("buddy_insights")
      .insert({
        patient_id: patientId,
        period_start: periodStartISO,
        period_end: periodEndISO,
        wellbeing_score: wellbeing,
        emotional_stability: stability,
        sleep_quality: sleep,
        habit_consistency: consistency,
        strengths: parsed.strengths ?? [],
        attention_points: parsed.attention_points ?? [],
        map_topics: parsed.map_topics ?? [],
        sources,
        narrative: parsed.narrative ?? "",
        recommendations: parsed.recommendations ?? [],
        model: MODEL,
      })
      .select("*")
      .single();

    if (insertError) {
      console.error("Buddy insert error", insertError);
      return json({ error: "db_error", message: insertError.message }, 500);
    }

    return json({ insight: inserted }, 200);
  } catch (e: any) {
    console.error("buddy-generate-insights fatal", e);
    return json({ error: "internal", message: e?.message ?? "erro" }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
function avg(arr: number[]): number | null {
  if (!arr.length) return null;
  return Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 100) / 100;
}
function stdDev(arr: number[]): number {
  if (arr.length < 2) return 0;
  const m = arr.reduce((a, b) => a + b, 0) / arr.length;
  const v = arr.reduce((a, b) => a + (b - m) ** 2, 0) / arr.length;
  return Math.sqrt(v);
}
function averageEmotion(ev: any): number | null {
  if (!ev || typeof ev !== "object") return null;
  const nums = Object.values(ev).filter((v) => typeof v === "number") as number[];
  if (!nums.length) return null;
  // normaliza para escala 0-10 assumindo 1-5 base
  const scaled = nums.map((n) => (n <= 5 ? (n / 5) * 10 : n));
  return scaled.reduce((a, b) => a + b, 0) / scaled.length;
}
function avgField(entries: any[], key: string): number | null {
  const vals = entries
    .map((e) => e.emotion_values?.[key])
    .filter((v: any) => typeof v === "number") as number[];
  if (!vals.length) return null;
  const scaled = vals.map((n) => (n <= 5 ? (n / 5) * 10 : n));
  return avg(scaled);
}
function fmt(n: number | null): string {
  return n === null ? "sem dados" : n.toFixed(1);
}
