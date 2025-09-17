-- Fix the search_path issue for the sync_professional_status function
CREATE OR REPLACE FUNCTION sync_professional_status()
RETURNS TRIGGER AS $$
BEGIN
  -- When a professional is created, update the profile tipo_usuario
  IF TG_OP = 'INSERT' THEN
    UPDATE public.profiles 
    SET tipo_usuario = 'profissional'
    WHERE id = NEW.profile_id;
    RETURN NEW;
  END IF;
  
  -- When a professional is deleted, update the profile tipo_usuario back to paciente
  IF TG_OP = 'DELETE' THEN
    UPDATE public.profiles 
    SET tipo_usuario = 'paciente'
    WHERE id = OLD.profile_id;
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql
   SECURITY DEFINER
   SET search_path = public;