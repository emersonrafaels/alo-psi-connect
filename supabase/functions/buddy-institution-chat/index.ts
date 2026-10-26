import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createOpenAI } from "npm:@ai-sdk/openai@2";
import { stepCountIs, streamText, tool } from "npm:ai@5";
import { z } from "npm:zod@3";
import { baseRisk, escalateRisk, queueBucket, type MoodRow, type Risk, type Severity } from "./triageRules.ts";

const RUN_HEADER = "X-Lovable-AIG-Run-ID";
const MIN_GROUP = 10;
const TOOL_MARK = "[[CONSULTANDO]]";

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
const RISK_LABEL: Record<Risk, string> = {
  critical: "Em Risco", alert: "Alerta", attention: "Atenção", healthy: "Estável", no_data: "Sem dados",
};

async function paged<T>(q: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: unknown }>, max = 50000) {
  const out: T[] = [];
  for (let from = 0; from < max; from += 1000) {
    const { data, error } = await q(from, from + 999);
    if (error) throw error;
    if (!data?.length) break;
    out.push(...data);
    if (data.length < 1000) break;
  }
  return out;
}

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
  const { data: inst } = await supabase.from("educational_institutions").select("name").eq("id", institutionId).maybeSingle();
  const today = isoDaysAgo(0);

  // ---- Per-student risk computed exactly like the portal triage (never leaves the function) ----
  const studentCache = new Map<number, Promise<any[]>>();
  const loadStudents = (periodDays: number) => {
    if (!studentCache.has(periodDays)) studentCache.set(periodDays, (async () => {
      const cutoff = isoDaysAgo(periodDays);
      const studs = await paged<any>((f, t) => supabase.from("patient_institutions")
        .select("patient_id, pacientes!inner(profile_id)")
        .eq("institution_id", institutionId).eq("enrollment_status", "enrolled")
        .order("patient_id").range(f, t) as any);
      const profileIds = studs.map((s) => s.pacientes?.profile_id).filter(Boolean);
      const byProfile = new Map<string, MoodRow[]>();
      for (let i = 0; i < profileIds.length; i += 300) {
        const chunk = profileIds.slice(i, i + 300);
        const rows = await paged<any>((f, t) => supabase.from("mood_entries")
          .select("profile_id, mood_score, anxiety_level, energy_level, sleep_quality, sleep_hours, date")
          .in("profile_id", chunk).gte("date", cutoff).order("date").order("id").range(f, t) as any);
        for (const r of rows) {
          const a = byProfile.get(r.profile_id) ?? [];
          a.push(r);
          byProfile.set(r.profile_id, a);
        }
      }
      const triRows = await paged<any>((f, t) => supabase.from("student_triage")
        .select("patient_id, status, follow_up_date, created_at")
        .eq("institution_id", institutionId).order("created_at", { ascending: false }).range(f, t) as any);
      const latest = new Map<string, any>();
      for (const r of triRows) if (!latest.has(r.patient_id)) latest.set(r.patient_id, r);
      const { data: flags } = await supabase.rpc("get_institution_critical_flags", { p_institution_id: institutionId, p_since: cutoff });
      const sev = new Map<string, Severity>(((flags ?? []) as any[]).map((f) => [f.patient_id, f.max_severity]));
      const places = await paged<any>((f, t) => supabase.from("patient_institution_placements")
        .select("patient_id, class_unit_id").eq("institution_id", institutionId).order("patient_id").range(f, t) as any);
      const { data: units } = await supabase.from("institution_academic_units").select("id, parent_id, level, name").eq("institution_id", institutionId);
      const unitById = new Map<string, any>(((units ?? []) as any[]).map((u) => [u.id, u]));
      const pathOf = (id: string | null) => {
        const p: Record<string, string> = {};
        let cur = id ? unitById.get(id) : null;
        for (let g = 0; cur && g < 10; g++) { p[cur.level] = cur.name; cur = cur.parent_id ? unitById.get(cur.parent_id) : null; }
        return p;
      };
      const placeBy = new Map<string, Record<string, string>>(places.map((p) => [p.patient_id, pathOf(p.class_unit_id)]));
      return studs.map((s) => {
        const rows = byProfile.get(s.pacientes?.profile_id) ?? [];
        const risk = escalateRisk(baseRisk(rows), sev.get(s.patient_id));
        const tri = latest.get(s.patient_id);
        const path = placeBy.get(s.patient_id) ?? {};
        return {
          risk, status: tri?.status ?? null, bucket: queueBucket(risk, tri?.status ?? null),
          overdue: !!(tri?.follow_up_date && tri.follow_up_date < today && tri.status !== "resolved"),
          hasEntries: rows.length > 0, severity: sev.get(s.patient_id) ?? null,
          unit: path.unit ?? "Sem unidade", course: path.course ?? "Sem curso", shift: path.shift ?? "Sem turno",
        };
      });
    })());
    return studentCache.get(periodDays)!;
  };

  const tally = (list: any[]) => {
    const por_risco: Record<string, number> = {};
    const risco_x_fila: Record<string, Record<string, number>> = {};
    for (const s of list) {
      const r = RISK_LABEL[s.risk as Risk];
      por_risco[r] = (por_risco[r] ?? 0) + 1;
      risco_x_fila[r] ??= {};
      risco_x_fila[r][s.bucket] = (risco_x_fila[r][s.bucket] ?? 0) + 1;
    }
    return {
      total_alunos: list.length,
      alunos_com_registro_no_periodo: list.filter((s) => s.hasEntries).length,
      para_triar: list.filter((s) => s.bucket === "para_triar").length,
      por_risco, risco_x_fila,
      followups_vencidos: list.filter((s) => s.overdue).length,
      alunos_com_termos_graves: list.filter((s) => s.severity === "grave").length,
      alunos_com_termos_moderados: list.filter((s) => s.severity === "moderate").length,
    };
  };

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

  const tools = {
    triage_overview: tool({
      description: "Números da triagem iguais aos do portal: alunos por nível de risco, cruzamento risco × fila (para_triar, em_andamento, concluido, fora_da_fila), follow-ups vencidos e termos críticos. Pode agrupar por unidade, curso ou turno e filtrar por nome de unidade/curso.",
      inputSchema: z.object({
        period_days: z.number().int().min(7).max(90).nullable().describe("Período de análise; padrão do portal = 15"),
        group_by: z.enum(["none", "unit", "course", "shift"]).nullable(),
        unit: z.string().nullable(),
        course: z.string().nullable(),
      }).strict(),
      execute: async ({ period_days, group_by, unit, course }) => {
        let list = await loadStudents(period_days ?? 15);
        const norm = (x: string) => x.toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");
        if (unit) list = list.filter((s) => norm(s.unit).includes(norm(unit)));
        if (course) list = list.filter((s) => norm(s.course).includes(norm(course)));
        const base = { periodo_dias: period_days ?? 15, data: today, filtros: { unit, course } };
        if (!group_by || group_by === "none") return { ...base, ...(list.length < MIN_GROUP && (unit || course) ? { oculto: "menos de 10 alunos" } : tally(list)) };
        const groups = new Map<string, any[]>();
        for (const s of list) { const k = s[group_by]; groups.set(k, [...(groups.get(k) ?? []), s]); }
        const grupos = [...groups.entries()].filter(([, g]) => g.length >= MIN_GROUP).map(([k, g]) => ({ grupo: k, ...tally(g) }));
        return { ...base, agrupado_por: group_by, grupos, grupos_ocultos_por_n_menor_que_10: groups.size - grupos.length };
      },
    }),
    diary_metrics: tool({
      description: "Médias agregadas do diário emocional (humor, ansiedade, sono, energia de 1 a 5) no período e no período anterior de mesma duração.",
      inputSchema: z.object({ days: z.number().int().min(1).max(180) }).strict(),
      execute: async ({ days }) => {
        const { data, error } = await supabase.rpc("get_institution_wellbeing_summary", {
          p_institution_id: institutionId, p_start: isoDaysAgo(days), p_end: today, p_prev_start: isoDaysAgo(days * 2),
        });
        if (error || !data) return { indisponivel: true };
        const d: any = data;
        return {
          periodo_dias: days, total_alunos: d.total_students, alunos_com_registro: d.students_with_entries, registros: d.total_entries,
          alunos_humor_baixo: d.low_mood_students, humor_medio: round(d.avg_mood), ansiedade_media: round(d.avg_anxiety),
          sono_medio: round(d.avg_sleep), energia_media: round(d.avg_energy), humor_medio_periodo_anterior: round(d.prev_avg_mood),
          ansiedade_media_periodo_anterior: round(d.prev_avg_anxiety), sono_medio_periodo_anterior: round(d.prev_avg_sleep),
          energia_media_periodo_anterior: round(d.prev_avg_energy),
        };
      },
    }),
    scale_results: tool({
      description: "Resultados agregados das escalas (WHO-5, PSS-10, GAD-7, PHQ-9, ISI, MHC-SF) e do diário por coleta semestral, unidade e curso. Grupos com n<10 já vêm ocultos.",
      inputSchema: z.object({ scale: z.string().nullable().describe("Código da escala, ex.: WHO5, PSS10, GAD7") }).strict(),
      execute: async ({ scale }) => {
        const { data } = await supabase.rpc("get_institution_comparator", { p_institution_id: institutionId });
        let pruned = pruneSmall(data ?? null);
        if (scale) {
          const code = scale.replace(/[^a-z0-9]/gi, "").toLowerCase();
          const keep = (v: any): any => {
            if (Array.isArray(v)) return v.map(keep).filter((x) => x !== undefined);
            if (v && typeof v === "object") {
              if (typeof v.scale_code === "string" && v.scale_code.replace(/[^a-z0-9]/gi, "").toLowerCase() !== code) return undefined;
              return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, keep(x)]).filter(([, x]) => x !== undefined));
            }
            return v;
          };
          pruned = keep(pruned);
        }
        let text = JSON.stringify(pruned);
        if (text.length > 40000) text = text.slice(0, 40000) + "…";
        return { dados: text, observacao: "IQoL ainda não está disponível." };
      },
    }),
  };

  const system = `Você é o Buddy da Rede Bem-Estar, analista de bem-estar para a equipe da instituição "${inst?.name ?? "Instituição"}". Hoje é ${today}.
Responda em português do Brasil, com clareza e acolhimento.

Como trabalhar:
- Para QUALQUER número, consulte as ferramentas antes de responder. Nunca invente ou estime números. Use os mesmos números do portal.
- Perguntas de acompanhamento ("e desses...", "e no curso X?") devem ser respondidas cruzando dados com as ferramentas (ex.: risco_x_fila, filtros por unidade/curso, group_by).
- "Em Risco hoje" e "precisam ser triados" usam o período padrão do portal (15 dias). "Para triar" = Em Risco sem triagem ou com triagem pendente (campo para_triar e risco_x_fila["Em Risco"].para_triar).
- Níveis: Em Risco, Alerta, Atenção, Estável, Sem dados. Nunca diga "Crítico". Escalas do diário vão de 1 a 5 (ansiedade alta é pior).
- Privacidade: nunca identifique alunos, nunca cite textos dos diários. Grupos com menos de ${MIN_GROUP} alunos ficam ocultos; diga isso quando ocorrer.

Formato da resposta (markdown curto):
1. Primeiro o número direto, em negrito.
2. Depois 1–3 linhas de contexto (comparação com período anterior, unidade/curso de destaque, distribuição).
3. Por fim, uma ação concreta com link markdown para a tela certa, usando apenas estes caminhos:
   [Triagem → Para Triar](/portal-institucional/triagem?view=fila&risk=critical&tab=para_triar),
   [Triagem → Follow-ups](/portal-institucional/triagem?view=followups),
   [Todos os alunos](/portal-institucional/triagem?view=todos),
   [Comparador](/portal-institucional/comparador),
   [Alunos](/portal-institucional?tab=alunos).`;

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
    tools,
    stopWhen: stepCountIs(6),
    abortSignal: req.signal,
    providerOptions: {
      openai: {
        forceReasoning: true,
        reasoningEffort: "high",
        reasoningSummary: "auto",
        store: false,
        include: ["reasoning.encrypted_content"],
        strictJsonSchema: true,
      },
    },
    onError: ({ error }: any) => {
      const status = error?.statusCode ?? error?.status ?? 500;
      upstreamError = { status, message: error?.responseBody ?? error?.message ?? "Erro" };
      console.error("buddy-institution-chat error", status, error?.message);
    },
  });

  // Stream plain text; tool calls emit a marker the UI turns into "Consultando dados…".
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const part of result.fullStream) {
          if (part.type === "text-delta") controller.enqueue(encoder.encode((part as any).text ?? (part as any).delta ?? ""));
          else if (part.type === "tool-call") controller.enqueue(encoder.encode(TOOL_MARK));
          else if (part.type === "tool-error") console.error("tool error", (part as any).error);
        }
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
  if (runId) headers[RUN_HEADER] = runId;
  return new Response(stream, { headers });
});
