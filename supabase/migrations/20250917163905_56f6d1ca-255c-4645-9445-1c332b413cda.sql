-- Adicionar campos bancários à tabela profissionais
ALTER TABLE public.profissionais 
ADD COLUMN banco TEXT,
ADD COLUMN agencia TEXT,
ADD COLUMN conta TEXT,
ADD COLUMN pix TEXT,
ADD COLUMN tipo_conta TEXT; -- corrente, poupança, etc

-- Atualizar função para garantir que todos os profissionais sejam criados com tempo_consulta = 50
CREATE OR REPLACE FUNCTION public.sync_professional_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- When a professional is created, update the profile tipo_usuario and set defaults
  IF TG_OP = 'INSERT' THEN
    UPDATE public.profiles 
    SET tipo_usuario = 'profissional'
    WHERE id = NEW.profile_id;
    
    -- Ensure the professional is active by default and has 50min consultation time
    NEW.ativo = true;
    NEW.tempo_consulta = 50;
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