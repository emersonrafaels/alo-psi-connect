CREATE INDEX IF NOT EXISTS idx_mood_entries_profile_date ON public.mood_entries (profile_id, date);
CREATE INDEX IF NOT EXISTS idx_pacientes_profile ON public.pacientes (profile_id);

CREATE OR REPLACE FUNCTION public.get_institution_wellbeing_summary(p_institution_id uuid, p_start date, p_end date, p_prev_start date)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE result jsonb;
BEGIN
  IF NOT (public.is_admin(auth.uid()) OR public.user_has_institution_access(auth.uid(), p_institution_id)) THEN
    RAISE EXCEPTION 'access denied';
  END IF;
  WITH st AS (
    SELECT DISTINCT pa.profile_id FROM patient_institutions pi JOIN pacientes pa ON pa.id = pi.patient_id
    WHERE pi.institution_id = p_institution_id AND pa.profile_id IS NOT NULL
  ), cur AS (
    SELECT m.date, m.mood_score, m.anxiety_level, m.sleep_quality, m.energy_level, m.profile_id
    FROM mood_entries m JOIN st ON st.profile_id = m.profile_id WHERE m.date BETWEEN p_start AND p_end
  ), daily AS (
    SELECT date, avg(mood_score) am, avg(anxiety_level) aa, avg(sleep_quality) asl, avg(energy_level) ae,
      greatest(count(mood_score), count(anxiety_level), count(sleep_quality), count(energy_level)) c
    FROM cur GROUP BY date
  )
  SELECT jsonb_build_object(
    'total_students', (SELECT count(*) FROM st),
    'total_entries', (SELECT count(*) FROM cur),
    'students_with_entries', (SELECT count(DISTINCT profile_id) FROM cur),
    'low_mood_students', (SELECT count(DISTINCT profile_id) FROM cur WHERE mood_score <= 3),
    'avg_mood', (SELECT avg(mood_score) FROM cur),
    'avg_anxiety', (SELECT avg(anxiety_level) FROM cur),
    'avg_sleep', (SELECT avg(sleep_quality) FROM cur),
    'avg_energy', (SELECT avg(energy_level) FROM cur),
    'prev_avg_mood', (SELECT avg(m.mood_score) FROM mood_entries m JOIN st ON st.profile_id = m.profile_id WHERE m.date >= p_prev_start AND m.date < p_start),
    'oldest', (SELECT min(m.date) FROM mood_entries m JOIN st ON st.profile_id = m.profile_id),
    'newest', (SELECT max(m.date) FROM mood_entries m JOIN st ON st.profile_id = m.profile_id),
    'daily', COALESCE((SELECT jsonb_agg(jsonb_build_object('date', date, 'avg_mood', am, 'avg_anxiety', aa, 'avg_sleep', asl, 'avg_energy', ae, 'entries_count', c) ORDER BY date) FROM daily), '[]'::jsonb)
  ) INTO result;
  RETURN result;
END $$;
REVOKE ALL ON FUNCTION public.get_institution_wellbeing_summary(uuid, date, date, date) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_institution_wellbeing_summary(uuid, date, date, date) TO authenticated;