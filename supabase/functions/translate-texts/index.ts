import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createOpenAI } from "npm:@ai-sdk/openai@2";
import { streamText } from "npm:ai@5";
import { z } from "npm:zod@3";

const Body = z.object({
  lang: z.enum(["en", "es"]),
  texts: z.array(z.string().max(2000)).min(1).max(60),
  page: z.string().max(300).optional(),
});

const LANG = { en: "English", es: "Spanish (neutral Latin American)" };

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return json({ error: "Requisição inválida" }, 400);
  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey) return json({ error: "LOVABLE_API_KEY ausente" }, 500);
  const { lang, texts } = parsed.data;
  const page = (parsed.data.page ?? "/").split("?")[0];

  const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const [{ data: existing }, { data: glossary }] = await Promise.all([
    db.from("translations").select("id,source_text,auto_text,human_text,pages").eq("lang", lang).in("source_text", texts),
    db.from("translation_glossary").select("term_pt,term_target").eq("lang", lang),
  ]);
  const known = new Map((existing ?? []).map((r) => [r.source_text, r]));
  const result: Record<string, string> = {};

  // Record the page where each known text appears.
  for (const r of existing ?? []) {
    const t = r.human_text || r.auto_text;
    if (t) result[r.source_text] = t;
    if (!r.pages?.includes(page) && (r.pages?.length ?? 0) < 30) {
      await db.from("translations").update({ pages: [...(r.pages ?? []), page] }).eq("id", r.id);
    }
  }

  const missing = texts.filter((t) => !result[t]);
  if (missing.length) {
    const gloss = (glossary ?? []).map((g) => `"${g.term_pt}" -> "${g.term_target}"`).join("; ");
    const provider = createOpenAI({
      baseURL: "https://ai.gateway.lovable.dev/v1",
      apiKey,
      headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
    });
    let upstream: { status: number; message: string } | null = null;
    const ai = streamText({
      model: provider.responses("openai/gpt-6-astra"),
      system:
        `You translate Brazilian Portuguese UI strings of a student wellbeing platform into ${LANG[lang]}. ` +
        `Return ONLY a JSON array of strings with exactly ${missing.length} items, same order. ` +
        `Keep brand names unchanged (Rede Bem-Estar, Rede Bem Estar, Buddy, Alo Psi, Afya, Medcos); translate "Aluno #N" as "Student #N"/"Estudiante #N"; keep numbers, emojis, emails and URLs. ` +
        `Mandatory glossary (always use these): ${gloss || "none"}. ` +
        `If a string is not Portuguese or is untranslatable, return it unchanged.`,
      prompt: JSON.stringify(missing),
      abortSignal: req.signal,
      providerOptions: { openai: { forceReasoning: true, reasoningEffort: "low", store: false } },
      onError: ({ error }: any) => {
        upstream = { status: error?.statusCode ?? error?.status ?? 500, message: error?.message ?? "Erro" };
      },
    });
    let out = "";
    for await (const d of ai.textStream) out += d;
    if (upstream) return json({ error: (upstream as any).message }, (upstream as any).status);
    let arr: unknown[];
    try {
      const m = out.match(/\[[\s\S]*\]/);
      arr = JSON.parse(m ? m[0] : out);
      if (!Array.isArray(arr) || arr.length !== missing.length) throw new Error("tamanho");
    } catch {
      return json({ error: "Resposta inválida do tradutor" }, 502);
    }
    const rows = missing.map((s, i) => {
      const t = typeof arr[i] === "string" ? (arr[i] as string) : s;
      result[s] = t;
      return { source_text: s, lang, auto_text: t, pages: [page] };
    });
    await db.from("translations").upsert(rows, { onConflict: "source_text,lang", ignoreDuplicates: true });
  }

  void known;
  return json({ translations: texts.map((t) => result[t] ?? t) });
});
