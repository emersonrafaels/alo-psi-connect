-- Add payment_status enum and field to agendamentos table
CREATE TYPE payment_status AS ENUM ('pending_payment', 'paid', 'failed');

-- Add payment_status column to agendamentos table
ALTER TABLE public.agendamentos 
ADD COLUMN payment_status payment_status DEFAULT 'pending_payment';

-- Update existing records based on current logic
-- If has mercado_pago_preference_id and status is 'pendente', it's pending_payment
-- If status is 'confirmado', it's paid
UPDATE public.agendamentos 
SET payment_status = CASE 
  WHEN status = 'confirmado' THEN 'paid'::payment_status
  WHEN status = 'pendente' AND mercado_pago_preference_id IS NOT NULL THEN 'pending_payment'::payment_status
  WHEN status = 'pendente' AND mercado_pago_preference_id IS NULL THEN 'paid'::payment_status
  ELSE 'pending_payment'::payment_status
END;

-- Create index for better performance on payment_status queries
CREATE INDEX idx_agendamentos_payment_status ON public.agendamentos(payment_status);

-- Create index for auto-cancellation queries (status + created_at)
CREATE INDEX idx_agendamentos_auto_cancel ON public.agendamentos(status, created_at) 
WHERE status = 'pendente';