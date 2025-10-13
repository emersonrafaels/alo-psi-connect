-- Adicionar campos de contato e redes sociais à tabela tenants

-- Informações de contato
ALTER TABLE public.tenants 
ADD COLUMN IF NOT EXISTS contact_phone text DEFAULT NULL;

COMMENT ON COLUMN public.tenants.contact_phone IS 'Telefone exibido no rodapé e página de contato. Formato: (11) 99999-9999';

ALTER TABLE public.tenants 
ADD COLUMN IF NOT EXISTS contact_whatsapp text DEFAULT NULL;

COMMENT ON COLUMN public.tenants.contact_whatsapp IS 'Número para botão flutuante de WhatsApp. Formato: 5511999999999 (código país + DDD + número)';

ALTER TABLE public.tenants 
ADD COLUMN IF NOT EXISTS contact_email text DEFAULT NULL;

COMMENT ON COLUMN public.tenants.contact_email IS 'Email exibido no rodapé e usado em formulários de contato';

ALTER TABLE public.tenants 
ADD COLUMN IF NOT EXISTS contact_address text DEFAULT NULL;

COMMENT ON COLUMN public.tenants.contact_address IS 'Endereço completo exibido no rodapé do site';

ALTER TABLE public.tenants 
ADD COLUMN IF NOT EXISTS cnpj text DEFAULT NULL;

COMMENT ON COLUMN public.tenants.cnpj IS 'CNPJ da empresa exibido no rodapé (apenas informativo)';

ALTER TABLE public.tenants 
ADD COLUMN IF NOT EXISTS razao_social text DEFAULT NULL;

COMMENT ON COLUMN public.tenants.razao_social IS 'Nome legal da empresa exibido no rodapé';

-- Redes sociais
ALTER TABLE public.tenants 
ADD COLUMN IF NOT EXISTS social_instagram text DEFAULT NULL;

COMMENT ON COLUMN public.tenants.social_instagram IS 'URL do perfil no Instagram. Aparece como ícone no rodapé';

ALTER TABLE public.tenants 
ADD COLUMN IF NOT EXISTS social_facebook text DEFAULT NULL;

COMMENT ON COLUMN public.tenants.social_facebook IS 'URL da página no Facebook. Aparece como ícone no rodapé';

ALTER TABLE public.tenants 
ADD COLUMN IF NOT EXISTS social_linkedin text DEFAULT NULL;

COMMENT ON COLUMN public.tenants.social_linkedin IS 'URL da página no LinkedIn. Aparece como ícone no rodapé';