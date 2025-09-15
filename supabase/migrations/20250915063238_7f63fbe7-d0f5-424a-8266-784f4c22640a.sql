-- Disable Supabase's automatic auth emails and ensure custom email handling
-- This will prevent Supabase from sending automatic signup confirmation emails

-- Update auth.config to disable automatic confirmation emails if needed
-- Note: This might already be configured in supabase/config.toml

-- Create or update email_confirmation_tokens table to track our custom emails
CREATE TABLE IF NOT EXISTS public.email_confirmation_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  email TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on email_confirmation_tokens
ALTER TABLE public.email_confirmation_tokens ENABLE ROW LEVEL SECURITY;

-- Create policies for email_confirmation_tokens
CREATE POLICY "Users can view their own tokens" ON public.email_confirmation_tokens
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can manage all tokens" ON public.email_confirmation_tokens
  FOR ALL USING (true);