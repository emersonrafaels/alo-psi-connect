GRANT UPDATE ON public.educational_institutions TO authenticated;

CREATE OR REPLACE FUNCTION public.guard_institution_member_update()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL OR public.is_admin(auth.uid()) THEN
    RETURN NEW;
  END IF;
  IF (to_jsonb(NEW) - 'academic_hierarchy_levels' - 'updated_at')
     IS DISTINCT FROM (to_jsonb(OLD) - 'academic_hierarchy_levels' - 'updated_at') THEN
    RAISE EXCEPTION 'Somente o modelo de hierarquia pode ser alterado pela instituição';
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS guard_institution_member_update ON public.educational_institutions;
CREATE TRIGGER guard_institution_member_update
BEFORE UPDATE ON public.educational_institutions
FOR EACH ROW EXECUTE FUNCTION public.guard_institution_member_update();