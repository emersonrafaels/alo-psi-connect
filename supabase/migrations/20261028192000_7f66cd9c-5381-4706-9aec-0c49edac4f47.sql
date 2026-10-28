CREATE OR REPLACE FUNCTION public.get_institution_diary_rhythm(p_institution_id uuid) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE result jsonb;
BEGIN
  IF NOT (public.is_admin(auth.uid()) OR public.user_has_institution_access(auth.uid(), p_institution_id)) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  WITH studs AS (
    SELECT pi.patient_id, pa.profile_id, pr.user_id,
      coalesce((WITH RECURSIVE up AS (
        SELECT id, parent_id, level, name FROM institution_academic_units WHERE id = pl.class_unit_id
        UNION ALL SELECT u.id, u.parent_id, u.level, u.name FROM institution_academic_units u JOIN up ON u.id = up.parent_id
      ) SELECT name FROM up WHERE level = 'unit' LIMIT 1), 'Sem unidade') unit
    FROM patient_institutions pi JOIN pacientes pa ON pa.id = pi.patient_id
    LEFT JOIN profiles pr ON pr.id = pa.profile_id
    LEFT JOIN patient_institution_placements pl ON pl.patient_id = pi.patient_id AND pl.institution_id = p_institution_id
    WHERE pi.institution_id = p_institution_id
  ), e AS (
    SELECT s.unit, s.profile_id pid, m.date, m.mood_score, m.sleep_quality, m.tags,
      extract(year from m.date)::int || '.' || CASE WHEN extract(month from m.date) <= 6 THEN 1 ELSE 2 END sem
    FROM mood_entries m JOIN studs s ON s.profile_id = m.profile_id
  ), pp AS (SELECT sem, unit, pid, count(*) c FROM e GROUP BY 1,2,3)
  SELECT jsonb_build_object(
    'elig', (SELECT jsonb_object_agg(unit, c) FROM (SELECT coalesce(unit,'__all__') unit, count(*) c FROM studs GROUP BY GROUPING SETS ((unit),())) x),
    'kpi', (SELECT coalesce(jsonb_agg(to_jsonb(k)), '[]') FROM (
      SELECT p.sem, coalesce(p.unit,'__all__') unit, count(*) people, sum(c) entries,
        percentile_cont(0.5) WITHIN GROUP (ORDER BY c) median,
        count(*) FILTER (WHERE EXISTS (SELECT 1 FROM e WHERE e.pid = p.pid AND e.date >= current_date - 14)) active14
      FROM pp p GROUP BY GROUPING SETS ((p.sem, p.unit),(p.sem)) HAVING count(*) >= 10) k),
    'weekly', (SELECT coalesce(jsonb_agg(to_jsonb(w) ORDER BY w.wk), '[]') FROM (
      SELECT sem, coalesce(unit,'__all__') unit, date_trunc('week', date)::date wk,
        round(avg(mood_score)::numeric, 2) mood, round(avg(sleep_quality)::numeric, 2) sleep,
        round(100.0 * count(*) FILTER (WHERE 'Provas' = ANY(tags)) / count(*)) provas, count(DISTINCT pid) people
      FROM e GROUP BY GROUPING SETS ((sem, unit, 3),(sem, 3)) HAVING count(DISTINCT pid) >= 10) w),
    'dist', (SELECT coalesce(jsonb_agg(to_jsonb(d)), '[]') FROM (
      SELECT sem, coalesce(unit,'__all__') unit, round(mood_score)::int score, count(*) n
      FROM e WHERE mood_score IS NOT NULL AND (sem, unit) IN (SELECT sem, unit FROM pp GROUP BY 1,2 HAVING count(*) >= 10)
      GROUP BY GROUPING SETS ((sem, unit, 3),(sem, 3))) d),
    'ctx', (SELECT coalesce(jsonb_agg(to_jsonb(c)), '[]') FROM (
      SELECT sem, coalesce(unit,'__all__') unit, t tag, count(*) n, count(*) FILTER (WHERE 'Provas' = ANY(tags)) n_exam
      FROM e, unnest(tags) t WHERE t <> 'demo_sintetico'
      GROUP BY GROUPING SETS ((sem, unit, 3),(sem, 3)) HAVING count(DISTINCT pid) >= 10) c),
    'totals', (SELECT coalesce(jsonb_agg(to_jsonb(t)), '[]') FROM (
      SELECT sem, coalesce(unit,'__all__') unit, count(*) n, count(*) FILTER (WHERE 'Provas' = ANY(tags)) n_exam FROM e GROUP BY GROUPING SETS ((sem, unit),(sem))) t),
    'dow', (SELECT coalesce(jsonb_agg(to_jsonb(d)), '[]') FROM (
      SELECT sem, coalesce(unit,'__all__') unit, extract(isodow from date)::int dow, round(avg(mood_score)::numeric, 2) mood
      FROM e GROUP BY GROUPING SETS ((sem, unit, 3),(sem, 3)) HAVING count(DISTINCT pid) >= 10) d),
    'emo', (SELECT coalesce(jsonb_agg(to_jsonb(x)), '[]') FROM (
      SELECT extract(year from j.created_at)::int || '.' || CASE WHEN extract(month from j.created_at) <= 6 THEN 1 ELSE 2 END sem,
        coalesce(s.unit,'__all__') unit, j.emotion_id, j.family_id, count(*) n, count(DISTINCT j.user_id) people
      FROM journey_session_emotions j JOIN studs s ON s.user_id = j.user_id
      GROUP BY GROUPING SETS ((1, s.unit, 3, 4),(1, 3, 4))) x)
  ) INTO result;
  RETURN result;
END $$;
REVOKE ALL ON FUNCTION public.get_institution_diary_rhythm(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_institution_diary_rhythm(uuid) TO authenticated;