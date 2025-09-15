-- Fix the security policies for email_confirmation_tokens
-- Drop the overly restrictive policy and create proper ones

DROP POLICY IF EXISTS "Tokens are only accessible by system" ON public.email_confirmation_tokens;
DROP POLICY IF EXISTS "Users can view their own tokens" ON public.email_confirmation_tokens;
DROP POLICY IF EXISTS "System can manage all tokens" ON public.email_confirmation_tokens;

-- Create proper policies for email confirmation tokens
CREATE POLICY "Allow edge functions to manage tokens" ON public.email_confirmation_tokens
  FOR ALL USING (true);

-- Allow users to view only their own unexpired, unused tokens
CREATE POLICY "Users can view their own valid tokens" ON public.email_confirmation_tokens
  FOR SELECT USING (
    auth.uid() = user_id 
    AND used = false 
    AND expires_at > NOW()
  );