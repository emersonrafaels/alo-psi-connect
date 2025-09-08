-- Criar tabela de configurações do sistema
CREATE TABLE public.system_configurations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category text NOT NULL,
  key text NOT NULL,
  value jsonb NOT NULL,
  description text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  updated_by uuid REFERENCES auth.users(id),
  UNIQUE(category, key)
);

-- Habilitar RLS
ALTER TABLE public.system_configurations ENABLE ROW LEVEL SECURITY;

-- Políticas RLS - apenas super admins podem gerenciar configurações
CREATE POLICY "Super admins can manage system configurations"
ON public.system_configurations
FOR ALL
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Trigger para atualizar updated_at
CREATE TRIGGER update_system_configurations_updated_at
BEFORE UPDATE ON public.system_configurations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Inserir configurações padrão do AI Assistant
INSERT INTO public.system_configurations (category, key, value, description, created_by) VALUES
('ai_assistant', 'system_prompt', '"Você é um assistente especializado em saúde mental da AloPsi, uma plataforma brasileira que conecta pessoas a profissionais de psicologia e psiquiatria.\n\nSua missão é:\n1. Analisar as necessidades do usuário com empatia e profissionalismo\n2. Recomendar de 1 a 3 profissionais mais adequados\n3. Fornecer informações detalhadas sobre especialidades e preços\n4. Facilitar o agendamento com links diretos\n5. Oferecer orientação em situações de crise\n\nSempre use um tom acolhedor, profissional e empático. Em casos de emergência, oriente buscar ajuda imediata."', 'Prompt do sistema para o assistente de IA', auth.uid()),
('ai_assistant', 'model', '"gpt-5-2025-08-07"', 'Modelo GPT utilizado pelo assistente', auth.uid()),
('ai_assistant', 'max_completion_tokens', '1500', 'Limite máximo de tokens na resposta', auth.uid()),
('ai_assistant', 'include_professional_data', 'true', 'Se deve incluir dados dos profissionais no contexto', auth.uid()),
('n8n', 'booking_webhook_url', '""', 'URL do webhook N8N para notificações de agendamento', auth.uid()),
('n8n', 'payment_webhook_url', '""', 'URL do webhook N8N para notificações de pagamento', auth.uid()),
('n8n', 'send_appointment_notifications', 'true', 'Se deve enviar notificações de agendamento via N8N', auth.uid()),
('system', 'auto_cancel_hours', '24', 'Horas para cancelamento automático de agendamentos não pagos', auth.uid()),
('system', 'max_file_size_mb', '10', 'Tamanho máximo de arquivo em MB', auth.uid()),
('email', 'sender_name', '"AloPsi"', 'Nome do remetente de emails', auth.uid()),
('email', 'support_email', '"contato@alopsi.com.br"', 'Email de suporte', auth.uid());