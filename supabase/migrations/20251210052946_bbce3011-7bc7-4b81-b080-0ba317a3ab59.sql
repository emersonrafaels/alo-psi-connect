-- ============================================
-- MIGRAÇÃO: Padronizar escala 1-5 em todo o diário emocional
-- ============================================

-- 1. Converter mood_score de 1-10 para 1-5
UPDATE mood_entries 
SET mood_score = GREATEST(1, ROUND(mood_score / 2.0))
WHERE mood_score IS NOT NULL AND mood_score > 5;

-- 2. Converter energy_level de 1-10 para 1-5
UPDATE mood_entries 
SET energy_level = GREATEST(1, ROUND(energy_level / 2.0))
WHERE energy_level IS NOT NULL AND energy_level > 5;

-- 3. Converter anxiety_level de 1-10 para 1-5
UPDATE mood_entries 
SET anxiety_level = GREATEST(1, ROUND(anxiety_level / 2.0))
WHERE anxiety_level IS NOT NULL AND anxiety_level > 5;

-- 4. Converter emotion_values JSONB (valores maiores que 5)
UPDATE mood_entries
SET emotion_values = (
  SELECT jsonb_object_agg(key, GREATEST(1, ROUND((value::numeric / 2.0)::numeric)))
  FROM jsonb_each_text(emotion_values)
)
WHERE emotion_values IS NOT NULL 
  AND emotion_values != '{}'::jsonb
  AND EXISTS (
    SELECT 1 FROM jsonb_each_text(emotion_values) 
    WHERE value::numeric > 5
  );

-- 5. Atualizar default_emotion_types para escala 1-5
UPDATE default_emotion_types 
SET 
  default_scale_min = 1, 
  default_scale_max = 5,
  default_emoji_set = '{"1":"😢","2":"😔","3":"😐","4":"😊","5":"🤩"}'::jsonb
WHERE emotion_type = 'mood';

UPDATE default_emotion_types 
SET 
  default_scale_min = 1, 
  default_scale_max = 5,
  default_emoji_set = '{"1":"😌","2":"🙂","3":"😐","4":"😟","5":"😰"}'::jsonb
WHERE emotion_type = 'anxiety';

UPDATE default_emotion_types 
SET 
  default_scale_min = 1, 
  default_scale_max = 5,
  default_emoji_set = '{"1":"😴","2":"🥱","3":"😐","4":"⚡","5":"🔥"}'::jsonb
WHERE emotion_type = 'energy';

UPDATE default_emotion_types 
SET 
  default_scale_min = 1, 
  default_scale_max = 5,
  default_emoji_set = '{"1":"😓","2":"😥","3":"😐","4":"😌","5":"🧘"}'::jsonb
WHERE emotion_type = 'stress';

UPDATE default_emotion_types 
SET 
  default_scale_min = 1, 
  default_scale_max = 5
WHERE default_scale_max = 10;

-- 6. Atualizar emotion_configurations (configurações personalizadas dos usuários)
UPDATE emotion_configurations
SET 
  scale_min = 1, 
  scale_max = 5,
  emoji_set = CASE 
    WHEN emotion_type = 'mood' THEN '{"1":"😢","2":"😔","3":"😐","4":"😊","5":"🤩"}'::jsonb
    WHEN emotion_type = 'anxiety' THEN '{"1":"😌","2":"🙂","3":"😐","4":"😟","5":"😰"}'::jsonb
    WHEN emotion_type = 'energy' THEN '{"1":"😴","2":"🥱","3":"😐","4":"⚡","5":"🔥"}'::jsonb
    WHEN emotion_type = 'stress' THEN '{"1":"😓","2":"😥","3":"😐","4":"😌","5":"🧘"}'::jsonb
    ELSE '{"1":"😢","2":"😔","3":"😐","4":"😊","5":"🤩"}'::jsonb
  END
WHERE scale_max = 10;