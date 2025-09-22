-- Renomear configurações que não têm o prefixo correto para chat
UPDATE system_configurations 
SET key = 'chat_' || key
WHERE category = 'n8n' 
AND key IN ('enabled', 'fallback_openai', 'max_retries', 'retry_backoff_multiplier', 'retry_delay_ms', 'timeout_seconds', 'webhook_url');