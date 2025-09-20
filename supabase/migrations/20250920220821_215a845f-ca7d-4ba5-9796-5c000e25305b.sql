-- Add system configuration for guest diary limit
INSERT INTO public.system_configs (category, key, value, description)
VALUES (
  'system',
  'guest_diary_limit',
  '3',
  'Número máximo de entradas que usuários não autenticados podem fazer no diário emocional'
)
ON CONFLICT (category, key) DO NOTHING;