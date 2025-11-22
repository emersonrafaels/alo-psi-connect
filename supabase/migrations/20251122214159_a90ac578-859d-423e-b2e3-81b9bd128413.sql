-- Migration: add_tenant_admin_email
-- Adiciona coluna para email administrativo e configura emails por tenant

-- 1. Adicionar coluna admin_email
ALTER TABLE tenants 
ADD COLUMN IF NOT EXISTS admin_email TEXT;

COMMENT ON COLUMN tenants.admin_email IS 'Email administrativo que receberá notificações do sistema (newsletter, contato, agendamentos)';

-- 2. Configurar email administrativo para Rede Bem Estar (alopsi)
UPDATE tenants 
SET admin_email = 'alopsi.host@gmail.com'
WHERE slug = 'alopsi';

-- 3. Configurar email administrativo para Medcos
UPDATE tenants 
SET admin_email = 'medcos.host@gmail.com'
WHERE slug = 'medcos';