-- Fix RLS policy for professional_unavailability table
-- The issue is that the policy was using profissionais.user_id but the component passes profissionais.id

-- Drop the existing policy
DROP POLICY IF EXISTS "Professionals can manage their own unavailability" ON public.professional_unavailability;

-- Create the corrected policy using profissionais.id instead of profissionais.user_id
CREATE POLICY "Professionals can manage their own unavailability" 
ON public.professional_unavailability 
FOR ALL 
USING (
  professional_id IN (
    SELECT p.id
    FROM profissionais p
    JOIN profiles pr ON p.profile_id = pr.id
    WHERE pr.user_id = auth.uid()
  )
);