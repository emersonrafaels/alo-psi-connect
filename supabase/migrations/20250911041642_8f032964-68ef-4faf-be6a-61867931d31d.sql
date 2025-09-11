-- Fix the N8N chat payload template to remove double quotes from object/array variables
UPDATE system_configurations 
SET value = '{"event": "ai_chat_message", "timestamp": "{{timestamp}}", "session_id": "{{session_id}}", "user": {"message": "{{user_message}}", "context": "{{context}}", "page": "{{page}}", "filters": {{filters}}}, "professionals": {{professionals}}, "platform": "alopsi"}'
WHERE category = 'n8n_chat' AND key = 'payload_template';

-- Add retry configuration for N8N
INSERT INTO system_configurations (category, key, value, description)
VALUES 
  ('n8n_chat', 'max_retries', '3', 'Número máximo de tentativas para N8N'),
  ('n8n_chat', 'retry_delay_ms', '1000', 'Delay inicial entre tentativas em ms'),
  ('n8n_chat', 'retry_backoff_multiplier', '2', 'Multiplicador para backoff exponencial')
ON CONFLICT (category, key) DO UPDATE SET 
  value = EXCLUDED.value,
  description = EXCLUDED.description;