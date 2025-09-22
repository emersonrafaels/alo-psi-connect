-- Adicionar configuração para controlar visibilidade do assistente IA
INSERT INTO public.system_configurations (category, key, value, description, created_by)
VALUES 
  ('ai_assistant', 'enabled', 'true', 'Controla se o assistente IA deve aparecer para todos os usuários', '94d0ab31-07a9-4817-b21e-754653c2dc92')
ON CONFLICT (category, key) 
DO UPDATE SET 
  value = EXCLUDED.value,
  description = EXCLUDED.description,
  updated_at = now(),
  updated_by = EXCLUDED.created_by;