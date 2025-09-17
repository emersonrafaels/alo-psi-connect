-- Fix RLS policy for professional_unavailability table
-- The current policy has a type mismatch issue

-- Drop the existing problematic policy
DROP POLICY IF EXISTS "Professionals can manage their own unavailability" ON public.professional_unavailability;

-- Create corrected policy that properly matches professional_id with the profissionais table
CREATE POLICY "Professionals can manage their own unavailability" 
ON public.professional_unavailability 
FOR ALL 
USING (
  professional_id IN (
    SELECT p.user_id
    FROM profissionais p
    JOIN profiles pr ON p.profile_id = pr.id
    WHERE pr.user_id = auth.uid()
  )
);