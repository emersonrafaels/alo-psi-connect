// Transcreve áudio usando Lovable AI (gpt-4o-mini-transcribe)
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
const MAX_BYTES = 20 * 1024 * 1024; // 20MB

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    if (!LOVABLE_API_KEY) return json({ error: "LOVABLE_API_KEY não configurada" }, 500);
    const auth = req.headers.get("Authorization");
    if (!auth?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);

    const contentType = req.headers.get("content-type") || "";
    if (!contentType.startsWith("multipart/form-data")) {
      return json({ error: "Envie multipart/form-data" }, 400);
    }

    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return json({ error: "Arquivo de áudio ausente" }, 400);
    if (file.size === 0) return json({ error: "Áudio vazio" }, 400);
    if (file.size > MAX_BYTES) return json({ error: "Áudio muito grande (máx 20MB)" }, 413);

    // Nome com extensão coerente com o container
    const type = file.type.split(";")[0];
    const extMap: Record<string, string> = {
      "audio/webm": "webm", "audio/mp4": "mp4", "audio/mpeg": "mp3",
      "audio/wav": "wav", "audio/x-wav": "wav", "audio/ogg": "ogg", "audio/m4a": "m4a",
    };
    const ext = extMap[type] ?? "webm";
    const upstream = new FormData();
    upstream.append("model", "openai/gpt-4o-mini-transcribe");
    upstream.append("language", "pt");
    upstream.append("file", file, `recording.${ext}`);

    const res = await fetch("https://ai.gateway.lovable.dev/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}` },
      body: upstream,
    });

    if (res.status === 429) return json({ error: "rate_limited", message: "Muitas requisições, tente novamente em instantes." }, 429);
    if (res.status === 402) return json({ error: "credits_exhausted", message: "Créditos de IA esgotados." }, 402);
    if (!res.ok) {
      const t = await res.text().catch(() => "");
      console.error("transcribe upstream", res.status, t);
      return json({ error: "ai_error", message: t.slice(0, 400) || `status ${res.status}` }, 500);
    }

    const data = await res.json();
    const text: string = data?.text ?? "";
    return json({ text }, 200);
  } catch (e: any) {
    console.error("buddy-transcribe fatal", e);
    return json({ error: "internal", message: e?.message ?? "erro" }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
