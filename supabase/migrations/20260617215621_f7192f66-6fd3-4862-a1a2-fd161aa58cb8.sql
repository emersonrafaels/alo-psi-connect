
-- 1) New columns
ALTER TABLE public.emotional_scales
  ADD COLUMN IF NOT EXISTS subscales jsonb;

ALTER TABLE public.emotional_scale_responses
  ADD COLUMN IF NOT EXISTS subscale_scores jsonb;

-- 2) Rebalance ISEU weights
UPDATE public.emotional_scales SET iseu_weight = 0.180 WHERE code = 'WHO5';
UPDATE public.emotional_scales SET iseu_weight = 0.160 WHERE code = 'PHQ9';
UPDATE public.emotional_scales SET iseu_weight = 0.125 WHERE code = 'GAD7';
UPDATE public.emotional_scales SET iseu_weight = 0.125 WHERE code = 'PSS10';
UPDATE public.emotional_scales SET iseu_weight = 0.100 WHERE code = 'ISI';

-- 3) Insert MHC-SF scale
INSERT INTO public.emotional_scales (
  code, name, short_description, description, instructions,
  item_min, item_max, reverse_items, iseu_weight, iseu_direction,
  frequency_days, estimated_minutes, active, display_order, subscales
) VALUES (
  'MHCSF',
  'MHC-SF — Saúde Mental Positiva',
  'Mede florescimento, bem-estar emocional, social e psicológico.',
  'O Mental Health Continuum – Short Form (Keyes) avalia a presença de saúde mental positiva em três dimensões: emocional, social e psicológica. Complementa instrumentos que medem sintomas, oferecendo uma leitura integral do bem-estar.',
  'Pense nas últimas 4 semanas. Para cada afirmação, indique com que frequência você se sentiu assim.',
  0, 5, ARRAY[]::int[], 0.150, 'positive',
  30, 3, true, 6,
  jsonb_build_object(
    'emotional',     jsonb_build_object('label', 'Bem-estar emocional',     'items', ARRAY[1,2,3]),
    'social',        jsonb_build_object('label', 'Bem-estar social',        'items', ARRAY[4,5,6,7,8]),
    'psychological', jsonb_build_object('label', 'Bem-estar psicológico',   'items', ARRAY[9,10,11,12,13,14])
  )
)
ON CONFLICT (code) DO UPDATE SET
  subscales = EXCLUDED.subscales,
  iseu_weight = EXCLUDED.iseu_weight,
  display_order = EXCLUDED.display_order;

-- 4) Insert items
WITH s AS (SELECT id FROM public.emotional_scales WHERE code = 'MHCSF')
INSERT INTO public.emotional_scale_items (scale_id, position, text, option_labels)
SELECT s.id, v.position, v.text, jsonb_build_object(
  '0','Nunca',
  '1','Uma ou duas vezes',
  '2','Cerca de uma vez por semana',
  '3','Cerca de 2 ou 3 vezes por semana',
  '4','Quase todos os dias',
  '5','Todos os dias'
)
FROM s, (VALUES
  (1, 'feliz'),
  (2, 'interessado(a) pela vida'),
  (3, 'satisfeito(a) com a vida'),
  (4, 'que você tinha algo importante a contribuir para a sociedade'),
  (5, 'que pertencia a uma comunidade (como um grupo social, sua vizinhança, sua cidade)'),
  (6, 'que nossa sociedade está se tornando um lugar melhor para pessoas como você'),
  (7, 'que as pessoas são basicamente boas'),
  (8, 'que a maneira como nossa sociedade funciona faz sentido para você'),
  (9, 'que você gostou da maior parte da sua personalidade'),
  (10, 'bom(boa) em gerenciar as responsabilidades do seu dia a dia'),
  (11, 'que tinha relações calorosas e de confiança com outras pessoas'),
  (12, 'que teve experiências que desafiaram você a crescer e se tornar uma pessoa melhor'),
  (13, 'confiante para pensar ou expressar suas próprias ideias e opiniões'),
  (14, 'que sua vida tem um senso de direção ou significado')
) AS v(position, text)
ON CONFLICT DO NOTHING;
