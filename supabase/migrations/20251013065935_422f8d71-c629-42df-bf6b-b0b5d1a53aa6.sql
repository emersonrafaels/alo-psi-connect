-- Adicionar campos de configuração da página "Sobre" à tabela tenants

-- Array de URLs das imagens da página sobre
ALTER TABLE public.tenants 
ADD COLUMN IF NOT EXISTS about_images text[] DEFAULT NULL;

COMMENT ON COLUMN public.tenants.about_images IS 'Array de URLs das imagens exibidas na página Sobre. Se tiver apenas 1 imagem, exibe estática. Se tiver 2+, cria carrossel.';

-- Controle de autoplay do carrossel
ALTER TABLE public.tenants 
ADD COLUMN IF NOT EXISTS about_autoplay boolean DEFAULT true;

COMMENT ON COLUMN public.tenants.about_autoplay IS 'Define se o carrossel de imagens da página Sobre deve rodar automaticamente (apenas quando há 2+ imagens)';

-- Intervalo de rotação do carrossel
ALTER TABLE public.tenants 
ADD COLUMN IF NOT EXISTS about_autoplay_delay integer DEFAULT 5000;

COMMENT ON COLUMN public.tenants.about_autoplay_delay IS 'Intervalo em milissegundos entre cada transição do carrossel da página Sobre (padrão: 5000ms = 5 segundos)';

-- Adicionar índice para melhorar performance em queries que filtram por tenant
CREATE INDEX IF NOT EXISTS idx_tenants_about_images 
ON public.tenants USING GIN (about_images)
WHERE about_images IS NOT NULL;