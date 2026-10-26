import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createOpenAI } from "npm:@ai-sdk/openai@2";
import { streamText } from "npm:ai@5";
import { z } from "npm:zod@3";

const RUN_HEADER = "X-Lovable-AIG-Run-ID";
const MIN_GROUP = 10;

const Body = z.object({
  messages: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().min(1).max(4000) }))
    .min(1)
    .max(40),
});

const json = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const isoDaysAgo = (d: number) => new Date(Date.now() - d * 86400000).toISOString().slice(0, 10);
const round = (v: unknown) => (typeof v === "number" ? Math.round(v * 100) / 100 : v ?? null);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const auth = req.headers.get("Authorization");
  if (!auth?.startsWith("Bearer ")) return json({ error: "Não autorizado" }, 401);

  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: auth } },
  });
  const { data: claims, error: claimsError } = await supabase.auth.getClaims(auth.replace("Bearer ", ""));
  if (claimsError || !claims?.claims) return json({ error: "Não autorizado" }, 401);
  const userId = claims.claims.sub as string;

  let parsed;
  try {
    parsed = Body.safeParse(await req.json());
  } catch {
    return json({ error: "Requisição inválida" }, 400);
  }
  if (!parsed.success) return json({ error: "Requisição inválida" }, 400);

  const { data: link } = await supabase
    .from("institution_users")
    .select("institution_id")
    .eq("user_id", userId)
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();
  if (!link?.institution_id) return json({ error: "Disponível apenas para pessoas vinculadas a uma instituição." }, 403);
  const institutionId = link.institution_id as string;

  // ---- Aggregated, anonymised context (no names, no diary text) ----
  const [{ data: inst }, w15, w30, comparator, flags] = await Promise.all([
    supabase.from("educational_institutions").select("name").eq("id", institutionId).maybeSingle(),
    supabase.rpc("get_institution_wellbeing_summary", {
      p_institution_id: institutionId, p_start: isoDaysAgo(15), p_end: isoDaysAgo(0), p_prev_start: isoDaysAgo(30),
    }),
    supabase.rpc("get_institution_wellbeing_summary", {
      p_institution_id: institutionId, p_start: isoDaysAgo(30), p_end: isoDaysAgo(0), p_prev_start: isoDaysAgo(60),
    }),
    supabase.rpc("get_institution_comparator", { p_institution_id: institutionId }),
    supabase.rpc("get_institution_critical_flags", { p_institution_id: institutionId, p_since: isoDaysAgo(30) }),
  ]);

  const summarize = (w: any) => {
    const d = w?.data;
    if (!d) return null;
    return {
      total_alunos: d.total_students, alunos_com_registro: d.students_with_entries, registros: d.total_entries,
      alunos_humor_baixo: d.low_mood_students, humor_medio: round(d.avg_mood), ansiedade_media: round(d.avg_anxiety),
      sono_medio: round(d.avg_sleep), energia_media: round(d.avg_energy), humor_medio_periodo_anterior: round(d.prev_avg_mood),
    };
  };

  // Latest triage per student (paged)
  const latest = new Map<string, any>();
  for (let from = 0; from < 20000; from += 1000) {
    const { data, error } = await supabase
      .from("student_triage")
      .select("patient_id, risk_level, status, follow_up_date, created_at")
      .eq("institution_id", institutionId)
      .order("created_at", { ascending: false })
      .range(from, from + 999);
    if (error || !data?.length) break;
    for (const r of data) if (!latest.has(r.patient_id)) latest.set(r.patient_id, r);
    if (data.length < 1000) break;
  }
  const today = isoDaysAgo(0);
  const triage = { por_status: {} as Record<string, number>, por_risco: {} as Record<string, number>, followups_vencidos: 0 };
  for (const r of latest.values()) {
    triage.por_status[r.status] = (triage.por_status[r.status] ?? 0) + 1;
    triage.por_risco[r.risk_level] = (triage.por_risco[r.risk_level] ?? 0) + 1;
    if (r.follow_up_date && r.follow_up_date < today && r.status !== "resolved") triage.followups_vencidos++;
  }

  const flagRows = (flags.data ?? []) as any[];
  const sinaisCriticos = {
    alunos_com_termos_graves: flagRows.filter((f) => f.max_severity === "grave").length,
    alunos_com_termos_moderados: flagRows.filter((f) => f.max_severity !== "grave").length,
  };

  // Comparator: keep only groups with enough respondents
  const pruneSmall = (v: any): any => {
    if (Array.isArray(v)) return v.map(pruneSmall).filter((x) => x !== undefined);
    if (v && typeof v === "object") {
      const n = v.n ?? v.respondents ?? v.respondentes;
      if (typeof n === "number" && n < MIN_GROUP) return undefined;
      const out: Record<string, unknown> = {};
      for (const [k, val] of Object.entries(v)) {
        if (/name|nome|email|patient|profile|journal|text/i.test(k) && k !== "unit_name" && k !== "course_name") continue;
        const p = pruneSmall(val);
        if (p !== undefined) out[k] = p;
      }
      return out;
    }
    return v;
  };
  let comparatorText = JSON.stringify(pruneSmall(comparator.data ?? null));
  if (comparatorText.length > 30000) comparatorText = comparatorText.slice(0, 30000) + "…";

  const context = {
    instituicao: inst?.name ?? "Instituição",
    data_hoje: today,
    bem_estar_ultimos_15_dias: summarize(w15),
    bem_estar_ultimos_30_dias: summarize(w30),
    triagem_ultimo_registro_por_aluno: triage,
    sinais_criticos_30_dias: sinaisCriticos,
    escalas_por_unidade_curso: comparatorText,
  };

  const system = `Você é o Buddy da Rede Bem-Estar, assistente para a equipe da instituição "${context.instituicao}".
Responda em português do Brasil, de forma clara, acolhedora e objetiva, sobre o bem-estar dos alunos da instituição.
Use SOMENTE os dados agregados abaixo. Nunca invente números; se um dado não estiver disponível, diga isso e sugira onde consultar no portal (Triagem, Comparador, Alunos).
Privacidade: nunca identifique alunos. Se precisar citar um aluno, use apenas "Aluno #N" e oriente a abrir a Triagem. Grupos com menos de ${MIN_GROUP} respondentes não são exibidos.
Escalas do diário vão de 1 a 5 (ansiedade alta é pior). Níveis de risco: critical = "Em Risco", alert = "Alerta", attention = "Atenção", stable/healthy = "Estável". Nunca diga "Crítico".
Termine, quando fizer sentido, com uma sugestão prática de ação para a equipe.

DADOS AGREGADOS:
${JSON.stringify(context)}`;

  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey) return json({ error: "IA não configurada" }, 500);

  let runId = req.headers.get(RUN_HEADER)?.trim() || undefined;
  const runFetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const headers = new Headers(init?.headers);
    if (runId && !headers.has(RUN_HEADER)) headers.set(RUN_HEADER, runId);
    const res = await fetch(input, { ...init, headers });
    runId ??= res.headers.get(RUN_HEADER)?.trim() || undefined;
    return res;
  };

  const provider = createOpenAI({
    baseURL: "https://ai.gateway.lovable.dev/v1",
    apiKey,
    headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
    fetch: runFetch,
  });

  let upstreamError: { status: number; message: string } | null = null;
  const result = streamText({
    model: provider.responses("openai/gpt-6-astra"),
    system,
    messages: parsed.data.messages,
    abortSignal: req.signal,
    providerOptions: {
      openai: {
        forceReasoning: true,
        reasoningEffort: "low",
        reasoningSummary: "auto",
        store: false,
        include: ["reasoning.encrypted_content"],
      },
    },
    onError: ({ error }: any) => {
      const status = error?.statusCode ?? error?.status ?? 500;
      upstreamError = { status, message: error?.responseBody ?? error?.message ?? "Erro" };
      console.error("buddy-institution-chat error", status, error?.message);
    },
  });

  // Stream plain text; on upstream failure append a safe message.
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of result.textStream) controller.enqueue(encoder.encode(chunk));
      } catch (_) { /* handled below */ }
      if (upstreamError) {
        const s = (upstreamError as any).status;
        const msg = s === 402 ? "Créditos de IA insuficientes no momento."
          : s === 429 ? "Muitas perguntas em pouco tempo. Tente novamente em instantes."
          : s === 403 ? "Acesso à IA bloqueado para este espaço de trabalho."
          : "Não consegui responder agora. Tente novamente.";
        controller.enqueue(encoder.encode(`\n\n[[ERRO]] ${msg}`));
      }
      controller.close();
    },
  });

  const headers: Record<string, string> = { ...corsHeaders, "Content-Type": "text/plain; charset=utf-8" };
  return new Response(stream, { headers });
});
