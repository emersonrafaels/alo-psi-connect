-- Fix RLS policies for agendamentos table to allow guest bookings
-- Drop existing INSERT policies that are conflicting
DROP POLICY IF EXISTS "Allow authenticated user appointments" ON public.agendamentos;
DROP POLICY IF EXISTS "Allow guest appointments" ON public.agendamentos;

-- Create a single comprehensive INSERT policy that handles both authenticated and guest users
CREATE POLICY "Allow booking creation for authenticated users and guests"
ON public.agendamentos
FOR INSERT
WITH CHECK (
  -- Allow if user is authenticated and user_id matches auth.uid()
  (auth.uid() IS NOT NULL AND auth.uid() = user_id)
  OR
  -- Allow if it's a guest booking (user_id is NULL and no auth.uid())
  (user_id IS NULL)
);