-- Add favicon_url column to tenants table
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS favicon_url TEXT;

-- Update existing tenants with default favicons
UPDATE public.tenants SET favicon_url = 'https://medcos.app.br/wp-content/uploads/elementor/thumbs/LogoMEDCOS-r5pr2yuqprrdwsv0thbrcgimoe2po47c2w2agtjnao.png' WHERE slug = 'medcos';
UPDATE public.tenants SET favicon_url = '/favicon.ico' WHERE slug = 'alopsi';

COMMENT ON COLUMN public.tenants.favicon_url IS 'URL do favicon do tenant';