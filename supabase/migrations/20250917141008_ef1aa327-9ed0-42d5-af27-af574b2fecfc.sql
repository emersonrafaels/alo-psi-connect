-- Create a function to sync photo URLs between profiles and profissionais tables
CREATE OR REPLACE FUNCTION public.sync_photo_urls()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- When a professional's photo is updated, sync to profiles
  IF TG_OP = 'UPDATE' AND OLD.foto_perfil_url IS DISTINCT FROM NEW.foto_perfil_url THEN
    UPDATE public.profiles 
    SET foto_perfil_url = NEW.foto_perfil_url
    WHERE id = NEW.profile_id;
  END IF;
  
  -- When a professional is created with a photo, sync to profiles
  IF TG_OP = 'INSERT' AND NEW.foto_perfil_url IS NOT NULL THEN
    UPDATE public.profiles 
    SET foto_perfil_url = NEW.foto_perfil_url
    WHERE id = NEW.profile_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to automatically sync photo URLs
CREATE TRIGGER sync_professional_photo_urls
  AFTER INSERT OR UPDATE ON public.profissionais
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_photo_urls();

-- Also create reverse sync from profiles to profissionais for professionals
CREATE OR REPLACE FUNCTION public.sync_profile_photo_to_professional()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- When a profile photo is updated and the user is a professional, sync to profissionais
  IF TG_OP = 'UPDATE' AND OLD.foto_perfil_url IS DISTINCT FROM NEW.foto_perfil_url AND NEW.tipo_usuario = 'profissional' THEN
    UPDATE public.profissionais 
    SET foto_perfil_url = NEW.foto_perfil_url
    WHERE profile_id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for profile photo sync
CREATE TRIGGER sync_profile_photo_to_professional
  AFTER UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_profile_photo_to_professional();