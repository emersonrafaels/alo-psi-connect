-- Criar tabela para tracking de usuários no processo de agendamento
CREATE TABLE public.user_booking_tracking (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  session_id TEXT NOT NULL,
  event_name TEXT NOT NULL,
  event_data JSONB,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  professional_id UUID,
  booking_data JSONB
);

-- Habilitar RLS
ALTER TABLE public.user_booking_tracking ENABLE ROW LEVEL SECURITY;

-- Política para permitir inserção de qualquer usuário (logado ou visitante)
CREATE POLICY "Anyone can insert tracking events"
ON public.user_booking_tracking
FOR INSERT
TO public
WITH CHECK (true);

-- Política para admins visualizarem todos os dados
CREATE POLICY "Admins can view all tracking"
ON public.user_booking_tracking
FOR SELECT
TO authenticated
USING (is_admin(auth.uid()));

-- Política para usuários logados visualizarem seus próprios dados
CREATE POLICY "Users can view their own tracking"
ON public.user_booking_tracking
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Índices para melhor performance
CREATE INDEX idx_user_booking_tracking_user_id ON public.user_booking_tracking(user_id);
CREATE INDEX idx_user_booking_tracking_session_id ON public.user_booking_tracking(session_id);
CREATE INDEX idx_user_booking_tracking_timestamp ON public.user_booking_tracking(timestamp);
CREATE INDEX idx_user_booking_tracking_event_name ON public.user_booking_tracking(event_name);