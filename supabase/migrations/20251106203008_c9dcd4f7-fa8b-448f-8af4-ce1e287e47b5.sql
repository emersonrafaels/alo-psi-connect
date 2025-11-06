-- Adicionar campos de configuração de redirecionamento de domínio na tabela tenants
ALTER TABLE tenants
ADD COLUMN IF NOT EXISTS domain_redirect_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS domain_redirect_from TEXT[],
ADD COLUMN IF NOT EXISTS domain_redirect_to TEXT;

-- Comentários explicativos
COMMENT ON COLUMN tenants.domain_redirect_enabled IS 'Habilita redirecionamento automático de domínios alternativos';
COMMENT ON COLUMN tenants.domain_redirect_from IS 'Array de domínios de origem que serão redirecionados (ex: ["alopsi.com.br", "www.alopsi.com.br"])';
COMMENT ON COLUMN tenants.domain_redirect_to IS 'Domínio de destino para redirecionamento (ex: "redebemestar.com.br")';