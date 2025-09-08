-- Update RLS policy to support authenticated users only
-- Remove the guest user system and require proper authentication

-- Drop the current policy that allows guest users
DROP POLICY IF EXISTS "Enable booking creation for all users" ON public.agendamentos;

-- Create a new policy that only allows authenticated users to create bookings
CREATE POLICY "Authenticated users can create bookings" ON public.agendamentos
FOR INSERT 
WITH CHECK (
  -- Only authenticated users can create bookings
  auth.uid() IS NOT NULL AND auth.uid() = user_id
);

-- Update the user_id column to be NOT NULL to enforce proper user relationships
-- First, clean up any existing guest bookings if needed
UPDATE public.agendamentos 
SET user_id = NULL 
WHERE user_id = '11111111-1111-1111-1111-111111111111'::uuid;

-- Make user_id required for new bookings
ALTER TABLE public.agendamentos 
ALTER COLUMN user_id SET NOT NULL;