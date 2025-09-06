-- Fix RLS policies for agendamentos table - more robust approach
-- First, drop all existing INSERT policies to ensure clean slate
DROP POLICY IF EXISTS "Allow booking creation for authenticated users and guests" ON public.agendamentos;
DROP POLICY IF EXISTS "Allow authenticated user appointments" ON public.agendamentos;
DROP POLICY IF EXISTS "Allow guest appointments" ON public.agendamentos;

-- Create a new, more robust INSERT policy using COALESCE for better NULL handling
CREATE POLICY "Enable booking creation for all users"
ON public.agendamentos
FOR INSERT
WITH CHECK (
  -- Use COALESCE to handle NULL values more reliably
  -- This returns true if: 
  -- 1. User is authenticated AND user_id matches auth.uid()
  -- 2. OR user_id IS NULL (guest booking)
  COALESCE(auth.uid() = user_id, user_id IS NULL)
);