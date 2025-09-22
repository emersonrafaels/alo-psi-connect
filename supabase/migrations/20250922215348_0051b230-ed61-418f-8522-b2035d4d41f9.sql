-- Atualizar políticas RLS para permitir acesso público às configurações do assistente IA
DROP POLICY IF EXISTS "Allow public read access to AI assistant configurations" ON public.system_configurations;

CREATE POLICY "Allow public read access to AI assistant configurations" 
ON public.system_configurations 
FOR SELECT 
USING (
  category = 'ai_assistant' AND 
  key IN ('enabled', 'title', 'subtitle', 'initial_message')
);