-- Fix permissions for anonymous users to create appointments
-- Grant INSERT permission to anon role on agendamentos table
GRANT INSERT ON public.agendamentos TO anon;
GRANT SELECT ON public.agendamentos TO anon;

-- Also ensure anon can access profiles table for professional data
GRANT SELECT ON public.profiles TO anon;

-- Ensure the policies are correctly set for anonymous access
-- Drop and recreate the INSERT policy with simpler logic
DROP POLICY IF EXISTS "Enable booking creation for all users" ON public.agendamentos;

CREATE POLICY "Enable booking creation for all users" 
ON public.agendamentos 
FOR INSERT 
WITH CHECK (
  -- Authenticated users: must match their user_id
  (auth.uid() IS NOT NULL AND auth.uid() = user_id)
  OR
  -- Anonymous users: must use the guest UUID
  (auth.uid() IS NULL AND user_id = '11111111-1111-1111-1111-111111111111'::uuid)
);

-- Simplify the SELECT policy as well
DROP POLICY IF EXISTS "Users and professionals can view appointments" ON public.agendamentos;

CREATE POLICY "Users and professionals can view appointments" 
ON public.agendamentos 
FOR SELECT 
USING (
  -- Admins can see everything
  is_admin(auth.uid()) 
  OR 
  -- Authenticated users can see their own appointments (not guest bookings)
  (auth.uid() IS NOT NULL AND auth.uid() = user_id AND user_id != '11111111-1111-1111-1111-111111111111'::uuid)
  OR 
  -- Professionals can see appointments for their profile
  (professional_id IN (
    SELECT profiles.id 
    FROM profiles 
    WHERE profiles.user_id = auth.uid()
  ))
);