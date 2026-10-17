CREATE TABLE public.institution_demo_scale_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL,
  institution_id uuid NOT NULL,
  scale_code text NOT NULL,
  taken_at timestamptz NOT NULL,
  raw_score numeric NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.institution_demo_scale_responses TO service_role;
ALTER TABLE public.institution_demo_scale_responses ENABLE ROW LEVEL SECURITY;
CREATE INDEX ON public.institution_demo_scale_responses (institution_id);

CREATE OR REPLACE FUNCTION public.get_institution_comparator(p_institution_id uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE result jsonb;
BEGIN
  IF NOT (public.is_admin(auth.uid()) OR public.user_has_institution_access(auth.uid(), p_institution_id)) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  WITH studs AS (
    SELECT pi.patient_id, pa.profile_id, pr.user_id
    FROM patient_institutions pi JOIN pacientes pa ON pa.id = pi.patient_id
    LEFT JOIN profiles pr ON pr.id = pa.profile_id
    WHERE pi.institution_id = p_institution_id
  ), place AS (
    SELECT s.*, (
      WITH RECURSIVE up AS (
        SELECT id, parent_id, level, name FROM institution_academic_units WHERE id = pl.class_unit_id
        UNION ALL SELECT u.id, u.parent_id, u.level, u.name FROM institution_academic_units u JOIN up ON u.id = up.parent_id
      ) SELECT jsonb_object_agg(level, name) FROM up) AS path
    FROM studs s LEFT JOIN patient_institution_placements pl ON pl.patient_id = s.patient_id AND pl.institution_id = p_institution_id
  ), p2 AS (
    SELECT patient_id, profile_id, user_id, coalesce(path->>'unit','Sem unidade') unit, coalesce(path->>'course','Sem curso') course FROM place
  ), resp AS (
    SELECT p2.patient_id, r.scale_code, r.taken_at, r.raw_score::numeric raw_score FROM emotional_scale_responses r JOIN p2 ON p2.user_id = r.user_id
    UNION ALL
    SELECT d.patient_id, d.scale_code, d.taken_at, d.raw_score FROM institution_demo_scale_responses d WHERE d.institution_id = p_institution_id
  ), sc AS (
    SELECT p2.unit, p2.course, r.scale_code,
      extract(year from r.taken_at)::int || '.' || CASE WHEN extract(month from r.taken_at) <= 6 THEN 1 ELSE 2 END AS sem,
      r.patient_id, r.raw_score
    FROM resp r JOIN p2 ON p2.patient_id = r.patient_id
  ), sc_g AS (
    SELECT sem, scale_code, unit, course, count(DISTINCT patient_id) n, round(avg(raw_score), 1) avg FROM sc GROUP BY sem, scale_code, unit, course
  ), any_sc AS (
    SELECT sem, unit, count(DISTINCT patient_id) n FROM sc GROUP BY sem, unit
  ), diary AS (
    SELECT extract(year from m.date)::int || '.' || CASE WHEN extract(month from m.date) <= 6 THEN 1 ELSE 2 END AS sem,
      p2.unit, count(DISTINCT m.profile_id) participants, round(avg(m.mood_score)::numeric, 2) avg_mood
    FROM mood_entries m JOIN p2 ON p2.profile_id = m.profile_id GROUP BY 1, 2
  )
  SELECT jsonb_build_object(
    'population', (SELECT count(*) FROM p2),
    'activated', (SELECT count(*) FROM p2 WHERE user_id IS NOT NULL),
    'units_population', (SELECT coalesce(jsonb_object_agg(unit, c), '{}') FROM (SELECT unit, count(*) c FROM p2 GROUP BY unit) x),
    'scales', (SELECT coalesce(jsonb_agg(to_jsonb(g)), '[]') FROM sc_g g WHERE g.n >= 10),
    'any_scale', (SELECT coalesce(jsonb_agg(to_jsonb(a)), '[]') FROM any_sc a WHERE a.n >= 10),
    'diary', (SELECT coalesce(jsonb_agg(to_jsonb(d)), '[]') FROM diary d WHERE d.participants >= 10)
  ) INTO result;
  RETURN result;
END $$;
REVOKE ALL ON FUNCTION public.get_institution_comparator(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.get_institution_comparator(uuid) TO authenticated;