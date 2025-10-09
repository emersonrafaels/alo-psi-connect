-- Add advanced branding fields to tenants table

-- Header text colors (light/dark mode)
ALTER TABLE tenants
ADD COLUMN IF NOT EXISTS header_text_color_light TEXT DEFAULT '#ffffff',
ADD COLUMN IF NOT EXISTS header_text_color_dark TEXT DEFAULT '#ffffff',
ADD COLUMN IF NOT EXISTS logo_size INTEGER DEFAULT 40;

-- Button colors (light/dark mode)
ALTER TABLE tenants
ADD COLUMN IF NOT EXISTS button_bg_color_light TEXT DEFAULT '#0ea5e9',
ADD COLUMN IF NOT EXISTS button_bg_color_dark TEXT DEFAULT '#0ea5e9',
ADD COLUMN IF NOT EXISTS button_text_color_light TEXT DEFAULT '#ffffff',
ADD COLUMN IF NOT EXISTS button_text_color_dark TEXT DEFAULT '#ffffff';

-- Add comments for documentation
COMMENT ON COLUMN tenants.header_text_color_light IS 'Cor dos textos/links do header em light mode';
COMMENT ON COLUMN tenants.header_text_color_dark IS 'Cor dos textos/links do header em dark mode';
COMMENT ON COLUMN tenants.logo_size IS 'Tamanho do logo em pixels (altura)';
COMMENT ON COLUMN tenants.button_bg_color_light IS 'Cor de fundo dos botões em light mode';
COMMENT ON COLUMN tenants.button_bg_color_dark IS 'Cor de fundo dos botões em dark mode';
COMMENT ON COLUMN tenants.button_text_color_light IS 'Cor do texto dos botões em light mode';
COMMENT ON COLUMN tenants.button_text_color_dark IS 'Cor do texto dos botões em dark mode';