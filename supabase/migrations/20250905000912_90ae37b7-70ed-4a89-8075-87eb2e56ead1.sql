-- Simply add the missing mercado_pago_preference_id column
ALTER TABLE public.agendamentos 
ADD COLUMN IF NOT EXISTS mercado_pago_preference_id text;