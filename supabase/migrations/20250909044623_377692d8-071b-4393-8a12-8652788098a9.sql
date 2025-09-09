-- Adicionar configurações N8N para o chat AI
INSERT INTO system_configurations (category, key, value, description) VALUES
  ('n8n_chat', 'webhook_url', '""', 'URL do webhook N8N para o assistente de IA'),
  ('n8n_chat', 'enabled', 'false', 'Habilitar uso do N8N para chat AI'),
  ('n8n_chat', 'timeout_seconds', '30', 'Timeout em segundos para resposta do N8N'),
  ('n8n_chat', 'fallback_openai', 'true', 'Usar OpenAI como fallback se N8N falhar'),
  ('n8n_chat', 'payload_template', '{"event": "ai_chat_message", "timestamp": "{{timestamp}}", "session_id": "{{session_id}}", "user": {"message": "{{user_message}}", "context": "{{context}}", "page": "{{page}}", "filters": "{{filters}}"}, "professionals": "{{professionals}}", "platform": "alopsi"}', 'Template do payload enviado para N8N')
ON CONFLICT (category, key) DO NOTHING;