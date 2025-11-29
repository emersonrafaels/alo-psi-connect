-- Insert N8N chat webhook configuration keys (valores como JSON strings)
INSERT INTO system_configurations (category, key, value, description, tenant_id)
VALUES 
  ('n8n', 'chat_webhook_url_test', '"https://n8n.alopsi.com.br/webhook-test/56ab2ff9-a91c-4f80-9b25-ac74ccba2d88"'::json, 'URL de teste do webhook N8N para chat', NULL),
  ('n8n', 'chat_webhook_url_prod', '"https://n8n.alopsi.com.br/webhook/56ab2ff9-a91c-4f80-9b25-ac74ccba2d88"'::json, 'URL de produção do webhook N8N para chat', NULL),
  ('n8n', 'chat_use_production', '"true"'::json, 'Se deve usar URL de produção (true) ou teste (false)', NULL)
ON CONFLICT (category, key, tenant_id) DO UPDATE SET value = EXCLUDED.value;

-- Create RLS policy allowing public read access to N8N chat configurations
CREATE POLICY "Allow public read access to n8n chat configurations"
ON public.system_configurations
FOR SELECT
TO public
USING (
  category = 'n8n' AND 
  key IN ('chat_enabled', 'chat_webhook_url_test', 'chat_webhook_url_prod', 'chat_use_production')
);