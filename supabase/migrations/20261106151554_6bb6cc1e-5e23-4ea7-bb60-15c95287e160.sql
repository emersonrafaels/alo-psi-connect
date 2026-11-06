CREATE OR REPLACE FUNCTION public.ensure_paciente_for_profile()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NEW.tipo_usuario = 'paciente' THEN
    BEGIN
      INSERT INTO public.pacientes (profile_id, tenant_id)
      SELECT NEW.id, NEW.tenant_id
      WHERE NOT EXISTS (SELECT 1 FROM public.pacientes WHERE profile_id = NEW.id);
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'ensure_paciente_for_profile failed for %: %', NEW.id, SQLERRM;
    END;
  END IF;
  RETURN NEW;
END $$;
REVOKE EXECUTE ON FUNCTION public.ensure_paciente_for_profile() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS ensure_paciente_for_profile ON public.profiles;
CREATE TRIGGER ensure_paciente_for_profile AFTER INSERT OR UPDATE OF tipo_usuario ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.ensure_paciente_for_profile();
INSERT INTO public.pacientes (profile_id, tenant_id)
SELECT p.id, p.tenant_id FROM public.profiles p
WHERE p.tipo_usuario='paciente' AND NOT EXISTS (SELECT 1 FROM public.pacientes pa WHERE pa.profile_id=p.id);