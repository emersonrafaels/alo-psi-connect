# Plano: Padronizar transcrição de áudio com Lovable AI (Gemini)

## Objetivo
Substituir a integração direta com OpenAI (Whisper + GPT) na edge function `transcribe-audio` — usada pelo Diário Emocional — pelo Lovable AI Gateway com Gemini, tornando-o o padrão da plataforma (como já é em `buddy-transcribe-audio`).

## Escopo
Somente a edge function `supabase/functions/transcribe-audio/index.ts`. O contrato de entrada/saída fica idêntico, então nada muda no frontend (`audio-recorder.tsx`, `MoodEntry.tsx`).

- Entrada: `{ audio: base64, tenant_id?: string }`
- Saída: `{ transcription: string, reflection: string }`

## Mudanças técnicas

1. **Transcrição via Gemini multimodal** no endpoint `https://ai.gateway.lovable.dev/v1/chat/completions`:
   - Modelo: `google/gemini-2.5-flash` (custo/latência baixos, aceita áudio).
   - Mensagem `user` com bloco `input_audio` (base64 + formato `webm`) pedindo transcrição literal em PT-BR.
2. **Reflexão empática** numa segunda chamada ao mesmo gateway com `google/gemini-2.5-flash`, mantendo:
   - `system_prompt`, `model`, `temperature`, `max_tokens` carregados de `system_configurations` (categoria `audio_transcription`, com fallback tenant → global → defaults) — preserva a página admin `AudioTranscriptionConfig`.
   - Default do modelo passa de `gpt-4o-mini` para `google/gemini-2.5-flash`. Se o admin tiver configurado um modelo OpenAI antigo, será ignorado e usado o default Gemini (log de aviso).
3. **Auth**: usar `LOVABLE_API_KEY` (secret já existente no projeto). Remover dependência de `OPENAI_API_KEY` nesta função.
4. **Tratamento de erros**: mapear 429 (rate limit) e 402 (créditos) do gateway em respostas HTTP claras para o cliente.
5. Manter `processBase64Chunks`, CORS e logs atuais.

## Validação
- Deploy da função e chamada de teste via `supabase--curl_edge_functions` com um payload de áudio curto (base64 de um WAV/WEBM mínimo gerado no sandbox) para confirmar que retorna `transcription` + `reflection` sem erro.
- Checar logs (`supabase--edge_function_logs`) para confirmar que ambas as requisições ao gateway retornam 200.
- Verificar que o fluxo do Diário (`/diario-emocional/nova-entrada`) continua funcional pelo mesmo contrato (sem mudanças de código no frontend).

## Fora de escopo
- `buddy-transcribe-audio` já usa Lovable AI — não será alterada.
- UI do Diário e configurações admin permanecem como estão (apenas o default do modelo muda no backend).
