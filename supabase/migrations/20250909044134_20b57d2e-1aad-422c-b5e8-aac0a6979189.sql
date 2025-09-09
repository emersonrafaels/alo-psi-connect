-- Migrar configurações que não estão em formato JSON válido
UPDATE system_configurations 
SET value = jsonb_build_object('text', value::text)
WHERE category = 'ai_assistant' 
  AND key = 'system_prompt' 
  AND jsonb_typeof(value) = 'string'
  AND value::text NOT LIKE '{%';