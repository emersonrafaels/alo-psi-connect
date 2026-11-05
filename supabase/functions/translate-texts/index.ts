import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createOpenAI } from "npm:@ai-sdk/openai@2";
import { streamText } from "npm:ai@5";
import { z } from "npm:zod@3";

const Body = z.object({
  lang: z.enum(["en", "es"]),
  texts: z.array(z.string().max(2000)).min(1).max(60),
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

  const provider = createOpenAI({
    baseURL: "https://ai.gateway.lovable.dev/v1",
    apiKey,
    headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
  });

  let upstream: { status: number; message: string } | null = null;
  const result = streamText({
    model: provider.responses("openai/gpt-6-astra"),
    system:
      `You translate Brazilian Portuguese UI strings of a student wellbeing platform into ${LANG[lang]}. ` +
      `Return ONLY a JSON array of strings with exactly ${texts.length} items, same order. ` +
      `Keep brand names unchanged (Rede Bem-Estar, Rede Bem Estar, Buddy, Alo Psi, Afya, Medcos), keep "Aluno #N" pattern translated as "Student #N"/"Estudiante #N", keep numbers, emojis, emails, URLs and leading/trailing spaces. ` +
      `Glossary: "Sinal elevado" -> "Elevated signal"/"Señal elevada"; "Sem sinais prioritários" -> "No priority signals"/"Sin señales prioritarias"; "cuidado" -> "care"/"cuidado"; "Diário emocional" -> "Emotional diary"/"Diario emocional". ` +
      `If a string is already not Portuguese or is untranslatable, return it unchanged.`,
    prompt: JSON.stringify(texts),
    abortSignal: req.signal,
    providerOptions: { openai: { forceReasoning: true, reasoningEffort: "low", store: false } },
    onError: ({ error }: any) => {
      upstream = { status: error?.statusCode ?? error?.status ?? 500, message: error?.message ?? "Erro" };
    },
  });

  let out = "";
  for await (const d of result.textStream) out += d;
  if (upstream) return json({ error: (upstream as any).message }, (upstream as any).status);

  try {
    const m = out.match(/\[[\s\S]*\]/);
    const arr = JSON.parse(m ? m[0] : out);
    if (!Array.isArray(arr) || arr.length !== texts.length) throw new Error("tamanho");
    return json({ translations: arr.map((t: unknown, i: number) => (typeof t === "string" ? t : texts[i])) });
  } catch {
    return json({ error: "Resposta inválida do tradutor" }, 502);
  }
});
