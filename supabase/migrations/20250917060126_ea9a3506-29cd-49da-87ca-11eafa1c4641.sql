-- Fix inconsistent tipo_usuario for professionals
UPDATE public.profiles 
SET tipo_usuario = 'profissional'
WHERE id IN (
  SELECT DISTINCT profile_id 
  FROM public.profissionais 
  WHERE profile_id IS NOT NULL
) AND tipo_usuario != 'profissional';

-- Create function to sync professional status
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
$$ LANGUAGE plpgsql;

-- Create trigger to keep data synchronized
DROP TRIGGER IF EXISTS sync_professional_status_trigger ON public.profissionais;
CREATE TRIGGER sync_professional_status_trigger
  AFTER INSERT OR DELETE ON public.profissionais
  FOR EACH ROW
  EXECUTE FUNCTION sync_professional_status();