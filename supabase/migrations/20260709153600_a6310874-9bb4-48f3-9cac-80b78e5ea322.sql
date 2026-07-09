ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS diary_whatsapp_number text,
  ADD COLUMN IF NOT EXISTS diary_whatsapp_message text DEFAULT 'Olá, quero registrar meu diário emocional';

COMMENT ON COLUMN public.tenants.diary_whatsapp_number IS 'Número do bot de WhatsApp que recebe registros do diário emocional. Formato: 5511999999999';
COMMENT ON COLUMN public.tenants.diary_whatsapp_message IS 'Mensagem pré-preenchida do botão "Registrar pelo WhatsApp" no diário emocional.';