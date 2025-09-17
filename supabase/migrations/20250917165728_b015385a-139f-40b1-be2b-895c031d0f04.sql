-- Fix the RLS policy for professionals updating their own profile
-- The current policy uses profile_id but we need to ensure it works correctly

DROP POLICY IF EXISTS "Professionals can update their own profile" ON public.profissionais;

CREATE POLICY "Professionals can update their own profile" 
ON public.profissionais 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = profissionais.profile_id 
    AND profiles.user_id = auth.uid()
  )
);