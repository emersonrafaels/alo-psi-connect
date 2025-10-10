-- Fase 1: Contato e Footer
ALTER TABLE public.tenants
ADD COLUMN IF NOT EXISTS contact_phone text,
ADD COLUMN IF NOT EXISTS contact_email text,
ADD COLUMN IF NOT EXISTS contact_address text,
ADD COLUMN IF NOT EXISTS contact_whatsapp text,
ADD COLUMN IF NOT EXISTS social_instagram text,
ADD COLUMN IF NOT EXISTS social_facebook text,
ADD COLUMN IF NOT EXISTS social_linkedin text,
ADD COLUMN IF NOT EXISTS cnpj text,
ADD COLUMN IF NOT EXISTS razao_social text,
ADD COLUMN IF NOT EXISTS footer_bg_color_light text,
ADD COLUMN IF NOT EXISTS footer_bg_color_dark text,
ADD COLUMN IF NOT EXISTS footer_text_color_light text,
ADD COLUMN IF NOT EXISTS footer_text_color_dark text;

-- Fase 2: Módulos, CTAs e Tipografia
ALTER TABLE public.tenants
ADD COLUMN IF NOT EXISTS modules_enabled jsonb DEFAULT '{"blog": true, "mood_diary": true, "ai_assistant": true, "professionals": true, "appointments": true}'::jsonb,
ADD COLUMN IF NOT EXISTS cta_primary_text text,
ADD COLUMN IF NOT EXISTS cta_secondary_text text,
ADD COLUMN IF NOT EXISTS hero_cta_text text,
ADD COLUMN IF NOT EXISTS font_family_headings text,
ADD COLUMN IF NOT EXISTS font_family_body text;

-- Fase 3: SEO, Email e Agendamento
ALTER TABLE public.tenants
ADD COLUMN IF NOT EXISTS meta_keywords text[],
ADD COLUMN IF NOT EXISTS social_share_image text,
ADD COLUMN IF NOT EXISTS google_analytics_id text,
ADD COLUMN IF NOT EXISTS google_tag_manager_id text,
ADD COLUMN IF NOT EXISTS email_sender_name text,
ADD COLUMN IF NOT EXISTS email_sender_email text,
ADD COLUMN IF NOT EXISTS email_support_email text,
ADD COLUMN IF NOT EXISTS booking_min_hours_notice integer DEFAULT 24,
ADD COLUMN IF NOT EXISTS booking_max_days_ahead integer DEFAULT 30,
ADD COLUMN IF NOT EXISTS payment_methods jsonb DEFAULT '{"mercadopago": true, "stripe": false}'::jsonb,
ADD COLUMN IF NOT EXISTS welcome_message text,
ADD COLUMN IF NOT EXISTS empty_state_message text,
ADD COLUMN IF NOT EXISTS fallback_professional_image text,
ADD COLUMN IF NOT EXISTS terms_url text,
ADD COLUMN IF NOT EXISTS privacy_url text;

-- Atualizar valores padrão para AloPsi
UPDATE public.tenants
SET 
  contact_email = 'contato@alopsi.com.br',
  contact_whatsapp = '5511999999999',
  razao_social = 'AloPsi Psicologia Online',
  email_sender_name = 'AloPsi',
  email_sender_email = 'contato@alopsi.com.br',
  cta_primary_text = 'Encontrar Psicólogo',
  hero_cta_text = 'Comece Agora'
WHERE slug = 'alopsi';

-- Atualizar valores padrão para Medcos
UPDATE public.tenants
SET 
  contact_email = 'contato@medcos.com.br',
  contact_whatsapp = '5511888888888',
  razao_social = 'Medcos Saúde Mental',
  email_sender_name = 'Medcos',
  email_sender_email = 'contato@medcos.com.br',
  cta_primary_text = 'Agendar Consulta',
  hero_cta_text = 'Comece Sua Jornada'
WHERE slug = 'medcos';