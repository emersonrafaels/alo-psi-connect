-- Fix guest booking RLS policy with simpler, more explicit logic
-- Remove the complex policy and create a simpler one
DROP POLICY IF EXISTS "Enable booking creation for all users" ON public.agendamentos;

-- Create a simpler policy that explicitly handles both cases
CREATE POLICY "Allow booking creation" 
ON public.agendamentos
FOR INSERT
WITH CHECK (
  -- Case 1: User is authenticated and user_id matches
  (auth.uid() IS NOT NULL AND auth.uid() = user_id)
  OR
  -- Case 2: Guest booking - no authentication required and user_id must be NULL
  (auth.uid() IS NULL AND user_id IS NULL)
);