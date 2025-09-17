-- 1. Ativar o perfil profissional do Wasabi e outros profissionais que deveriam estar ativos
UPDATE profissionais 
SET ativo = true 
WHERE profile_id IN (
  SELECT p.id 
  FROM profiles p 
  WHERE p.tipo_usuario = 'profissional'
) AND ativo = false;

-- 2. Atualizar o trigger de sincronização para ativar automaticamente profissionais
CREATE OR REPLACE FUNCTION public.sync_professional_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  -- When a professional is created, update the profile tipo_usuario and set ativo = true
  IF TG_OP = 'INSERT' THEN
    UPDATE public.profiles 
    SET tipo_usuario = 'profissional'
    WHERE id = NEW.profile_id;
    
    -- Ensure the professional is active by default
    NEW.ativo = true;
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
$function$;

-- 3. Atualizar função para ativar profissionais quando tipo_usuario muda para 'profissional'
CREATE OR REPLACE FUNCTION public.sync_profile_tipo_usuario()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  -- When tipo_usuario changes to 'profissional', ensure professional record exists and is active
  IF NEW.tipo_usuario = 'profissional' AND (OLD.tipo_usuario IS NULL OR OLD.tipo_usuario != 'profissional') THEN
    INSERT INTO public.profissionais (profile_id, user_email, display_name, ativo)
    VALUES (NEW.id, NEW.email, NEW.nome, true)
    ON CONFLICT (profile_id) DO UPDATE SET ativo = true;
  END IF;
  
  -- When tipo_usuario changes from 'profissional' to something else, deactivate
  IF OLD.tipo_usuario = 'profissional' AND NEW.tipo_usuario != 'profissional' THEN
    UPDATE public.profissionais 
    SET ativo = false 
    WHERE profile_id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- 4. Criar trigger para sincronizar mudanças no tipo_usuario
DROP TRIGGER IF EXISTS sync_profile_tipo_usuario_trigger ON public.profiles;
CREATE TRIGGER sync_profile_tipo_usuario_trigger
  AFTER UPDATE OF tipo_usuario ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_profile_tipo_usuario();