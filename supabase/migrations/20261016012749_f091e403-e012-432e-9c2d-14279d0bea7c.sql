ALTER TABLE public.educational_institutions ADD COLUMN IF NOT EXISTS academic_hierarchy_levels text[] NOT NULL DEFAULT '{unit,course,shift,class}';

CREATE TABLE public.institution_academic_units (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid NOT NULL REFERENCES public.educational_institutions(id) ON DELETE CASCADE,
  parent_id uuid REFERENCES public.institution_academic_units(id) ON DELETE CASCADE,
  level text NOT NULL,
  name text NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.institution_academic_units TO authenticated;
GRANT ALL ON public.institution_academic_units TO service_role;
ALTER TABLE public.institution_academic_units ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Institution access manages academic units" ON public.institution_academic_units FOR ALL TO authenticated
USING (public.is_admin(auth.uid()) OR public.user_has_institution_access(auth.uid(), institution_id))
WITH CHECK (public.is_admin(auth.uid()) OR public.user_has_institution_access(auth.uid(), institution_id));

CREATE OR REPLACE FUNCTION public.validate_academic_unit() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
DECLARE ord text[] := '{unit,course,shift,class}'; p record;
BEGIN
  IF NOT (NEW.level = ANY(ord)) THEN RAISE EXCEPTION 'Nível inválido'; END IF;
  IF NEW.parent_id IS NOT NULL THEN
    SELECT * INTO p FROM public.institution_academic_units WHERE id = NEW.parent_id;
    IF p.institution_id <> NEW.institution_id THEN RAISE EXCEPTION 'Pai de outra instituição'; END IF;
    IF array_position(ord, p.level) >= array_position(ord, NEW.level) THEN RAISE EXCEPTION 'Hierarquia inválida'; END IF;
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END $$;
CREATE TRIGGER validate_academic_unit BEFORE INSERT OR UPDATE ON public.institution_academic_units FOR EACH ROW EXECUTE FUNCTION public.validate_academic_unit();

CREATE TABLE public.patient_institution_placements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL,
  institution_id uuid NOT NULL REFERENCES public.educational_institutions(id) ON DELETE CASCADE,
  class_unit_id uuid NOT NULL REFERENCES public.institution_academic_units(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (patient_id, institution_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.patient_institution_placements TO authenticated;
GRANT ALL ON public.patient_institution_placements TO service_role;
ALTER TABLE public.patient_institution_placements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Institution access manages placements" ON public.patient_institution_placements FOR ALL TO authenticated
USING (public.is_admin(auth.uid()) OR public.user_has_institution_access(auth.uid(), institution_id))
WITH CHECK (public.is_admin(auth.uid()) OR public.user_has_institution_access(auth.uid(), institution_id));
CREATE TRIGGER placements_updated_at BEFORE UPDATE ON public.patient_institution_placements FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();