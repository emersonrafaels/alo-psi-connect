-- Adicionar campos de branding na tabela tenants
ALTER TABLE tenants 
ADD COLUMN IF NOT EXISTS hero_title TEXT,
ADD COLUMN IF NOT EXISTS hero_subtitle TEXT,
ADD COLUMN IF NOT EXISTS hero_images TEXT[],
ADD COLUMN IF NOT EXISTS hero_autoplay BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS hero_autoplay_delay INTEGER DEFAULT 3000;

-- Comentários das colunas
COMMENT ON COLUMN tenants.hero_title IS 'Título principal do hero/banner';
COMMENT ON COLUMN tenants.hero_subtitle IS 'Subtítulo do hero/banner';
COMMENT ON COLUMN tenants.hero_images IS 'Array de URLs das imagens do carrossel';
COMMENT ON COLUMN tenants.hero_autoplay IS 'Se o carrossel deve rodar automaticamente';
COMMENT ON COLUMN tenants.hero_autoplay_delay IS 'Delay em milissegundos entre slides do carrossel';