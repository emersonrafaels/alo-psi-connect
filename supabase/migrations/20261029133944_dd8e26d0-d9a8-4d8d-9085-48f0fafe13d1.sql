CREATE TABLE public.permanence_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  patient_id uuid REFERENCES public.pacientes(id) ON DELETE CASCADE,
  institution_id uuid REFERENCES public.educational_institutions(id) ON DELETE SET NULL,
  semester text NOT NULL,
  answers jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON public.permanence_responses (institution_id, semester, patient_id, created_at DESC);
CREATE INDEX ON public.permanence_responses (user_id, created_at DESC);
GRANT SELECT, INSERT ON public.permanence_responses TO authenticated;
GRANT ALL ON public.permanence_responses TO service_role;
ALTER TABLE public.permanence_responses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students read own permanence responses" ON public.permanence_responses FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Students create own permanence responses" ON public.permanence_responses FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.get_institution_permanence(_institution_id uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE result jsonb;
BEGIN
  IF NOT (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin') OR EXISTS (
    SELECT 1 FROM institution_users iu WHERE iu.user_id = auth.uid() AND iu.institution_id = _institution_id AND iu.is_active)) THEN
    RAISE EXCEPTION 'not authorized';
  END IF;
  WITH RECURSIVE up AS (
    SELECT p.patient_id, u.id cur, u.parent_id, u.level, u.name FROM patient_institution_placements p
      JOIN institution_academic_units u ON u.id = p.class_unit_id WHERE p.institution_id = _institution_id
    UNION ALL
    SELECT up.patient_id, u.id, u.parent_id, u.level, u.name FROM up JOIN institution_academic_units u ON u.id = up.parent_id WHERE up.level <> 'unit'
  ), punit AS (SELECT DISTINCT ON (patient_id) patient_id, cur unit_id, name unit_name FROM up WHERE level='unit'),
  enrolled AS (SELECT unit_id, count(*) est FROM punit GROUP BY 1),
  latest AS (
    SELECT DISTINCT ON (r.semester, r.patient_id) r.semester, r.patient_id, r.answers
    FROM permanence_responses r WHERE r.institution_id = _institution_id AND r.patient_id IS NOT NULL
    ORDER BY r.semester, r.patient_id, r.created_at DESC
  ), lu AS (
    SELECT l.*, pu.unit_id, pu.unit_name FROM latest l JOIN punit pu USING (patient_id)
  ), opts AS (
    SELECT lu.semester, lu.unit_id, a.key q, v.opt
    FROM lu, jsonb_each(lu.answers) a,
    LATERAL (SELECT jsonb_array_elements_text(CASE WHEN jsonb_typeof(a.value)='array' THEN a.value ELSE jsonb_build_array(a.value) END) opt) v
    WHERE a.key <> '11.1'
  ), dist AS (
    SELECT semester, unit_id, jsonb_object_agg(q, o) d FROM (
      SELECT semester, unit_id, q, jsonb_object_agg(opt, c) o FROM (SELECT semester, unit_id, q, opt, count(*) c FROM opts GROUP BY 1,2,3,4) x GROUP BY 1,2,3) y GROUP BY 1,2
  ), units AS (
    SELECT lu.semester, lu.unit_id, max(lu.unit_name) unit_name, count(*) n FROM lu GROUP BY 1,2 HAVING count(*) >= 10
  )
  SELECT coalesce(jsonb_agg(jsonb_build_object('semester', u.semester, 'unit_id', u.unit_id, 'unit_name', u.unit_name, 'n', u.n, 'est', coalesce(e.est, u.n), 'dist', coalesce(d.d,'{}'::jsonb)) ORDER BY u.semester, u.unit_name), '[]'::jsonb)
  INTO result FROM units u LEFT JOIN enrolled e ON e.unit_id = u.unit_id LEFT JOIN dist d ON d.semester = u.semester AND d.unit_id = u.unit_id;
  RETURN result;
END $$;
REVOKE ALL ON FUNCTION public.get_institution_permanence(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.get_institution_permanence(uuid) TO authenticated;