-- Atualizar admin_email do tenant Rede Bem Estar (alopsi)
UPDATE tenants 
SET admin_email = 'redebemestar1@gmail.com' 
WHERE slug = 'alopsi';