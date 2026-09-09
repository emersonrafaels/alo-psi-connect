-- Atualizar telefones administrativos do Alopsi
UPDATE tenants 
SET 
  contact_phone = '(11) 97587-2447',
  contact_whatsapp = '5511956850046'
WHERE slug = 'alopsi';

-- Atualizar telefones administrativos do Medcos
UPDATE tenants 
SET 
  contact_phone = '(11) 97587-2447',
  contact_whatsapp = '5511956850046'
WHERE slug = 'medcos';