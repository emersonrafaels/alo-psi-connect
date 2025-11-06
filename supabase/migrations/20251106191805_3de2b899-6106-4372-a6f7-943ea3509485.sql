-- Atualizar título do tenant alopsi para Rede Bem Estar
UPDATE tenants 
SET meta_config = jsonb_set(
  meta_config::jsonb,
  '{title}',
  '"Rede Bem Estar - Plataforma de Saúde Mental"'::jsonb
)
WHERE slug = 'alopsi';