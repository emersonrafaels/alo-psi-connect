-- Create table for email confirmation tokens
CREATE TABLE public.email_confirmation_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  email TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.email_confirmation_tokens ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Tokens are only accessible by system" 
ON public.email_confirmation_tokens 
FOR ALL 
USING (false);

-- Create trigger for timestamps
CREATE TRIGGER update_email_confirmation_tokens_updated_at
BEFORE UPDATE ON public.email_confirmation_tokens
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();