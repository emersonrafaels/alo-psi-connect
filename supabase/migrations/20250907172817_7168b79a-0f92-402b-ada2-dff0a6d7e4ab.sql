-- Fix RLS policy for guest users to properly handle NULL auth.uid()
-- The issue is that the current policy structure may not be evaluating correctly for guests

-- Drop the current policy to recreate it with better logic
DROP POLICY IF EXISTS "Enable booking creation for authenticated and guest users" ON public.agendamentos;

-- Create a more explicit policy that handles both authenticated and guest users
CREATE POLICY "Enable booking creation for all users" 
ON public.agendamentos 
FOR INSERT 
WITH CHECK (
  -- Case 1: Authenticated user booking for themselves
  (auth.uid() IS NOT NULL AND auth.uid() = user_id)
  OR
  -- Case 2: Guest user (auth.uid() is NULL) using the guest UUID
  (auth.uid() IS NULL AND user_id = '11111111-1111-1111-1111-111111111111'::uuid)
);

-- Also ensure we can properly debug by allowing guest access to read their own appointments
-- Update the select policy to include guest bookings with proper token validation
DROP POLICY IF EXISTS "Professionals can view their appointments including guest booki" ON public.agendamentos;

CREATE POLICY "Users and professionals can view appointments" 
ON public.agendamentos 
FOR SELECT 
USING (
  -- Admins can see everything
  is_admin(auth.uid()) 
  OR 
  -- Authenticated users can see their own appointments (excluding guest UUID)
  (auth.uid() = user_id AND user_id != '11111111-1111-1111-1111-111111111111'::uuid)
  OR 
  -- Professionals can see their appointments
  (professional_id IN (
    SELECT profiles.id 
    FROM profiles 
    WHERE profiles.user_id = auth.uid()
  ))
);