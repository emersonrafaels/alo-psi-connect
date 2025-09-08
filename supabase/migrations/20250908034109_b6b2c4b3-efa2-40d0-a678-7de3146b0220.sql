-- Fix RLS policy for guest bookings
-- The current policy requires exact UUID match for guests, but we need to allow any guest UUID pattern

-- Drop the current policy
DROP POLICY IF EXISTS "Enable booking creation for all users" ON public.agendamentos;

-- Create a new policy that allows both authenticated users and guests
CREATE POLICY "Enable booking creation for all users" ON public.agendamentos
FOR INSERT 
WITH CHECK (
  -- Authenticated users: user_id must match auth.uid()
  (auth.uid() IS NOT NULL AND auth.uid() = user_id) 
  OR 
  -- Guests: auth.uid() must be null and user_id must be the specific guest UUID
  (auth.uid() IS NULL AND user_id = '11111111-1111-1111-1111-111111111111'::uuid)
);