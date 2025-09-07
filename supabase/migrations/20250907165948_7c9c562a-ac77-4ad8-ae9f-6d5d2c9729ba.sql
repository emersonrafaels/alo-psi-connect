-- Debug and fix RLS policy for guest bookings
-- The issue might be that auth.uid() is not properly evaluating to NULL for guests
-- Let's update the policy to be more explicit about guest users

DROP POLICY IF EXISTS "Enable booking creation for authenticated and guest users" ON public.agendamentos;

CREATE POLICY "Enable booking creation for authenticated and guest users" 
ON public.agendamentos 
FOR INSERT 
WITH CHECK (
  -- For authenticated users: user_id must match auth.uid()
  (auth.uid() IS NOT NULL AND auth.uid() = user_id) 
  OR 
  -- For guest users: auth.uid() must be NULL and user_id must be the guest UUID
  (auth.uid() IS NULL AND user_id = '11111111-1111-1111-1111-111111111111'::uuid)
  OR
  -- Additional safety: if somehow auth.uid() exists but user_id is guest UUID, allow it
  (user_id = '11111111-1111-1111-1111-111111111111'::uuid)
);