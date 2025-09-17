-- Fix security warning by updating function with proper search_path
CREATE OR REPLACE FUNCTION public.clean_old_chat_sessions()
RETURNS void AS $$
BEGIN
  DELETE FROM public.ai_chat_sessions 
  WHERE created_at < now() - interval '30 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;