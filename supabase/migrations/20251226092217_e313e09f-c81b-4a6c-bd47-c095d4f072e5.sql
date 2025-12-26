-- Atualizar admin_email do tenant MEDCOS para medcos.host@gmail.com
UPDATE tenants 
SET admin_email = 'medcos.host@gmail.com' 
WHERE slug = 'medcos';