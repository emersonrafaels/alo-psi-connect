-- Criar tabela para tokens de acesso de agendamentos
CREATE TABLE public.agendamento_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  token UUID NOT NULL UNIQUE,
  agendamento_id UUID NOT NULL,
  email TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.agendamento_tokens ENABLE ROW LEVEL SECURITY;

-- Políticas para os tokens
CREATE POLICY "Tokens are accessible by token value" 
ON public.agendamento_tokens 
FOR SELECT 
USING (true);  -- Tokens são validados no código, não no RLS

CREATE POLICY "Anyone can create tokens" 
ON public.agendamento_tokens 
FOR INSERT 
WITH CHECK (true);

-- Trigger para updated_at
CREATE TRIGGER update_agendamento_tokens_updated_at
BEFORE UPDATE ON public.agendamento_tokens
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Índices para performance
CREATE INDEX idx_agendamento_tokens_token ON public.agendamento_tokens(token);
CREATE INDEX idx_agendamento_tokens_agendamento_id ON public.agendamento_tokens(agendamento_id);
CREATE INDEX idx_agendamento_tokens_expires_at ON public.agendamento_tokens(expires_at);