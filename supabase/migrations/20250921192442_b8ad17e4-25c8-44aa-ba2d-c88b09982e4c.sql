-- Criar tabela para controlar uso de insights de IA
CREATE TABLE public.ai_insights_usage (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT,
  insights_count INTEGER NOT NULL DEFAULT 0,
  month_year TEXT NOT NULL, -- Format: "2025-01"
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ai_insights_usage ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own insights usage" 
ON public.ai_insights_usage 
FOR SELECT 
USING (auth.uid() = user_id OR (user_id IS NULL AND session_id IS NOT NULL));

CREATE POLICY "Users can insert their own insights usage" 
ON public.ai_insights_usage 
FOR INSERT 
WITH CHECK (auth.uid() = user_id OR (user_id IS NULL AND session_id IS NOT NULL));

CREATE POLICY "Users can update their own insights usage" 
ON public.ai_insights_usage 
FOR UPDATE 
USING (auth.uid() = user_id OR (user_id IS NULL AND session_id IS NOT NULL));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_ai_insights_usage_updated_at
BEFORE UPDATE ON public.ai_insights_usage
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for better performance
CREATE INDEX idx_ai_insights_usage_user_month ON public.ai_insights_usage(user_id, month_year);
CREATE INDEX idx_ai_insights_usage_session_month ON public.ai_insights_usage(session_id, month_year);

-- Inserir configurações do sistema para limites de insights
INSERT INTO public.system_configurations (category, key, value, description, created_by)
VALUES 
  ('system', 'guest_insights_limit', '3', 'Limite de insights de IA para usuários guest por sessão', NULL),
  ('system', 'user_insights_limit', '6', 'Limite de insights de IA para usuários autenticados por mês', NULL);