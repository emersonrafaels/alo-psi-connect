-- Atualizar meta description do tenant alopsi para Rede Bem Estar
UPDATE tenants 
SET meta_config = jsonb_set(
  meta_config::jsonb,
  '{description}',
  '"Conecte-se com profissionais especializados em saúde mental através da Rede Bem Estar. Psicólogos, psiquiatras e terapeutas qualificados para cuidar do seu bem-estar emocional."'::jsonb
)
WHERE slug = 'alopsi';