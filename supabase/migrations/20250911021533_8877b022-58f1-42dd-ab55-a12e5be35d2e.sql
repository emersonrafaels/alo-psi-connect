-- Insert default AI Assistant system prompt if not exists
INSERT INTO system_configurations (category, key, value, description)
VALUES 
  ('ai_assistant', 'system_prompt', 'Você é o assistente oficial da **AloPsi**, uma plataforma brasileira especializada em conectar pessoas com profissionais de saúde mental através de telemedicina. Seja sempre empático, acolhedor e profissional. Use linguagem clara e acessível, evitando jargões médicos. Mantenha confidencialidade absoluta e seja não-julgamental. Use SEMPRE markdown bem estruturado com títulos, listas e emojis apropriados (🎯💡❓👨‍⚕️). SEMPRE inclua links clicáveis no formato: [Ver Perfil Completo](/profissional/[id]) ou [Agendar Consulta](/profissional/[id]).', 'Prompt do sistema para o assistente de IA'),
  ('ai_assistant', 'model', 'gpt-4o-mini', 'Modelo OpenAI a ser usado'),
  ('ai_assistant', 'max_tokens', '1500', 'Máximo de tokens para resposta'),
  ('ai_assistant', 'include_professional_data', 'true', 'Incluir dados dos profissionais no contexto')
ON CONFLICT (category, key) DO NOTHING;

-- Create default N8N chat payload template if not exists  
INSERT INTO system_configurations (category, key, value, description)
VALUES 
  ('n8n_chat', 'payload_template', '{
  "event": "ai_chat_message",
  "timestamp": "{{timestamp}}",
  "session_id": "{{session_id}}",
  "user": {
    "message": "{{user_message}}",
    "context": "{{context}}",
    "page": "{{page}}",
    "filters": {{filters}}
  },
  "professionals": {{professionals}},
  "platform": "alopsi"
}', 'Template do payload para webhook N8N do chat'),
  ('n8n_chat', 'enabled', 'false', 'Habilitar integração N8N para chat'),
  ('n8n_chat', 'webhook_url', '', 'URL do webhook N8N para chat'),
  ('n8n_chat', 'fallback_openai', 'true', 'Usar OpenAI como fallback se N8N falhar'),
  ('n8n_chat', 'timeout_seconds', '30', 'Timeout em segundos para N8N')
ON CONFLICT (category, key) DO NOTHING;