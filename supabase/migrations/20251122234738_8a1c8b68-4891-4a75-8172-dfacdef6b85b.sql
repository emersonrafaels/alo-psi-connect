-- Centralizar todos os emails no domínio verificado redebemestar.com.br
-- mantendo a personalização por tenant no nome do remetente

UPDATE tenants 
SET admin_email = 'noreply@redebemestar.com.br' 
WHERE slug = 'alopsi';

UPDATE tenants 
SET admin_email = 'noreply@redebemestar.com.br' 
WHERE slug = 'medcos';