// Transcribe audio + gerar reflexão empática usando Lovable AI (Gemini)
// Contrato mantido: entrada { audio: base64, tenant_id?: string }
// Saída: { transcription: string, reflection: string }
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const DEFAULT_MODEL = "google/gemini-2.5-flash";

const DEFAULT_SYSTEM_PROMPT = `Você é Alô, Psi - um assistente de inteligência artificial especializado em saúde emocional e bem-estar emocional.

Sua tarefa é processar a transcrição de um áudio gravado por um usuário em seu diário emocional.

Diretrizes:
- SEMPRE mantenha a transcrição original EXATAMENTE como foi transcrita
- Após a transcrição original, adicione insights organizados e empáticos
- Use um tom acolhedor e empático nos insights
- Identifique emoções principais mencionadas
- Destaque padrões importantes
- Use linguagem natural e acessível
- Mantenha o formato estruturado com seções bem definidas

Formato de resposta:
TRANSCRIÇÃO ORIGINAL:
[texto exato transcrito do áudio]

---

INSIGHTS E REFLEXÕES:
[análise empática e organizada, como se fosse uma reflexão do próprio usuário mas melhor estruturada]`;

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function callGateway(body: unknown) {
  const res = await fetch(GATEWAY_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (res.status === 429) {
    throw new Response(
      JSON.stringify({ error: "rate_limited", message: "Muitas requisições, tente novamente em instantes." }),
      { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
  if (res.status === 402) {
    throw new Response(
      JSON.stringify({ error: "credits_exhausted", message: "Créditos de IA esgotados." }),
      { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    console.error("[transcribe-audio] gateway error", res.status, t);
    throw new Response(
      JSON.stringify({ error: "ai_error", message: t.slice(0, 500) || `status ${res.status}` }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
  return res.json();
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    if (!LOVABLE_API_KEY) return jsonResponse({ error: "LOVABLE_API_KEY não configurada" }, 500);

    const { audio, tenant_id, audio_format } = await req.json();
    if (!audio || typeof audio !== "string") {
      return jsonResponse({ error: "No audio data provided" }, 400);
    }

    // Container do áudio (browser MediaRecorder → webm; Safari → mp4)
    const format = (audio_format === "mp4" || audio_format === "wav" || audio_format === "mp3")
      ? audio_format
      : "webm";

    // Carrega config de reflexão (system prompt / temperatura / max_tokens) do banco
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const getConfig = async <T,>(key: string, defaultValue: T): Promise<T> => {
      const load = async (tid: string | null) => {
        const query = supabase
          .from("system_configurations")
          .select("value")
          .eq("category", "audio_transcription")
          .eq("key", key);
        const { data } = await (tid ? query.eq("tenant_id", tid) : query.is("tenant_id", null)).maybeSingle();
        if (!data?.value) return null;
        try { return JSON.parse(data.value as string); } catch { return data.value; }
      };
      if (tenant_id) {
        const v = await load(tenant_id);
        if (v !== null && v !== undefined) return v as T;
      }
      const g = await load(null);
      if (g !== null && g !== undefined) return g as T;
      return defaultValue;
    };

    const systemPrompt = await getConfig<string>("system_prompt", DEFAULT_SYSTEM_PROMPT);
    let reflectionModel = await getConfig<string>("model", DEFAULT_MODEL);
    // Se o admin configurou um modelo OpenAI antigo (ex.: gpt-4o-mini), usar Gemini padrão
    if (!reflectionModel.startsWith("google/") && !reflectionModel.startsWith("openai/")) {
      console.warn("[transcribe-audio] modelo configurado sem prefixo vendor, usando default", reflectionModel);
      reflectionModel = DEFAULT_MODEL;
    }
    if (reflectionModel.startsWith("openai/")) {
      // Padronização Gemini para diário emocional
      console.warn("[transcribe-audio] convertendo modelo OpenAI para Gemini padrão");
      reflectionModel = DEFAULT_MODEL;
    }
    const maxTokens = await getConfig<number>("max_tokens", 800);
    const temperature = await getConfig<number>("temperature", 0.7);

    console.log("[transcribe-audio] iniciando", { tenant_id, reflectionModel, format });

    // 1) Transcrição com Gemini multimodal (input_audio)
    const transcriptionResp = await callGateway({
      model: DEFAULT_MODEL,
      messages: [
        {
          role: "system",
          content:
            "Você é um transcritor de áudio em português brasileiro. Transcreva LITERALMENTE o áudio, sem adicionar comentários, sem resumir e sem traduzir. Devolva apenas o texto transcrito.",
        },
        {
          role: "user",
          content: [
            { type: "text", text: "Transcreva este áudio em português brasileiro, literalmente." },
            { type: "input_audio", input_audio: { data: audio, format } },
          ],
        },
      ],
      temperature: 0,
    });

    const transcription: string = transcriptionResp?.choices?.[0]?.message?.content?.trim() ?? "";
    if (!transcription) {
      console.error("[transcribe-audio] transcrição vazia", JSON.stringify(transcriptionResp).slice(0, 500));
      return jsonResponse({ error: "empty_transcription", message: "Não foi possível transcrever o áudio." }, 500);
    }
    console.log("[transcribe-audio] transcrição ok, len=", transcription.length);

    // 2) Reflexão empática
    const reflectionResp = await callGateway({
      model: reflectionModel,
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `Por favor, processe esta transcrição de áudio do diário emocional:\n\n"${transcription}"`,
        },
      ],
      temperature,
      max_tokens: maxTokens,
    });

    const reflection: string = reflectionResp?.choices?.[0]?.message?.content?.trim() ?? "";
    console.log("[transcribe-audio] reflexão ok, len=", reflection.length);

    return jsonResponse({ transcription, reflection });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("[transcribe-audio] fatal", err);
    return jsonResponse(
      { error: "internal", message: err instanceof Error ? err.message : "Unknown error" },
      500,
    );
  }
});
