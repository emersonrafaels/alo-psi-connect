-- Fix professional_id type incompatibility and add missing mercado_pago_preference_id column
ALTER TABLE public.agendamentos 
ALTER COLUMN professional_id TYPE bigint USING professional_id::text::bigint;

-- Add missing mercado_pago_preference_id column
ALTER TABLE public.agendamentos 
ADD COLUMN IF NOT EXISTS mercado_pago_preference_id text;

-- Update RLS policies to work with bigint professional_id
DROP POLICY IF EXISTS "Professionals can update their appointments" ON public.agendamentos;
DROP POLICY IF EXISTS "Professionals can view their appointments" ON public.agendamentos;

CREATE POLICY "Professionals can update their appointments" 
ON public.agendamentos 
FOR UPDATE 
USING (professional_id IN (
  SELECT p.id 
  FROM profissionais p 
  JOIN profiles pr ON p.profile_id = pr.id 
  WHERE pr.user_id = auth.uid()
));

CREATE POLICY "Professionals can view their appointments" 
ON public.agendamentos 
FOR SELECT 
USING (professional_id IN (
  SELECT p.id 
  FROM profissionais p 
  JOIN profiles pr ON p.profile_id = pr.id 
  WHERE pr.user_id = auth.uid()
));