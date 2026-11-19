
CREATE OR REPLACE FUNCTION public._can_read_institution(_inst uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT auth.uid() IS NOT NULL AND (
    public.is_admin(auth.uid())
    OR public.is_clinical_staff(auth.uid())
    OR EXISTS (SELECT 1 FROM public.institution_users iu WHERE iu.user_id = auth.uid() AND iu.institution_id = _inst AND iu.is_active)
    OR public.user_has_institution_access(auth.uid(), _inst)
  )
$$;
REVOKE ALL ON FUNCTION public._can_read_institution(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public._can_read_institution(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_institution_portal_summary(p_institution_id uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_week date := current_date - 7;
  v_two date := current_date - 14;
  v_result jsonb;
BEGIN
  IF NOT public._can_read_institution(p_institution_id) THEN
    RAISE EXCEPTION 'not authorized' USING ERRCODE = '42501';
  END IF;

  WITH links AS (
    SELECT pi.patient_id, pi.enrollment_status, p.profile_id
    FROM patient_institutions pi
    JOIN pacientes p ON p.id = pi.patient_id
    WHERE pi.institution_id = p_institution_id
  ), enrolled AS (
    SELECT DISTINCT profile_id FROM links WHERE enrollment_status = 'enrolled' AND profile_id IS NOT NULL
  ), ent AS (
    SELECT me.profile_id, me.date FROM mood_entries me
    WHERE me.profile_id IN (SELECT profile_id FROM enrolled) AND me.date >= v_two
  ), act AS (SELECT DISTINCT profile_id FROM ent WHERE date >= v_week),
     prev AS (SELECT DISTINCT profile_id FROM ent WHERE date < v_week),
     tri AS (SELECT id, status, risk_level, priority, created_at FROM student_triage WHERE institution_id = p_institution_id)
  SELECT jsonb_build_object(
    'total_students', (SELECT count(*) FROM links),
    'enrolled_students', (SELECT count(*) FROM links WHERE enrollment_status = 'enrolled'),
    'active_week', (SELECT count(*) FROM act),
    'active_prev_week', (SELECT count(*) FROM prev),
    'sparkline', (SELECT jsonb_agg(COALESCE(c, 0) ORDER BY idx) FROM generate_series(0, 6) idx
                  LEFT JOIN (SELECT 6 - LEAST(6, current_date - date) AS i, count(*) AS c FROM ent WHERE date >= v_week GROUP BY 1) s ON s.i = idx),
    'total_triage', (SELECT count(*) FROM tri),
    'resolved_triage', (SELECT count(*) FROM tri WHERE status = 'resolved'),
    'open_critical', COALESCE((SELECT jsonb_agg(jsonb_build_object('id', id, 'risk_level', risk_level, 'priority', priority, 'created_at', created_at) ORDER BY created_at DESC)
                    FROM tri WHERE status <> 'resolved' AND lower(risk_level) IN ('alto','critico','crítico','high','critical')), '[]'::jsonb),
    'absent_profile_ids', COALESCE((SELECT jsonb_agg(profile_id) FROM (SELECT profile_id FROM prev EXCEPT SELECT profile_id FROM act LIMIT 5) a), '[]'::jsonb)
  ) INTO v_result;
  RETURN v_result;
END $$;
REVOKE ALL ON FUNCTION public.get_institution_portal_summary(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_institution_portal_summary(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_institution_triage_inputs(p_institution_id uuid, p_since date)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE v_result jsonb;
BEGIN
  IF NOT public._can_read_institution(p_institution_id) THEN
    RAISE EXCEPTION 'not authorized' USING ERRCODE = '42501';
  END IF;

  WITH st AS (
    SELECT pi.patient_id, p.profile_id, pr.nome, pr.user_id, pr.genero, pr.data_nascimento
    FROM patient_institutions pi
    JOIN pacientes p ON p.id = pi.patient_id
    JOIN profiles pr ON pr.id = p.profile_id
    WHERE pi.institution_id = p_institution_id AND pi.enrollment_status = 'enrolled'
  )
  SELECT jsonb_build_object(
    'students', COALESCE((SELECT jsonb_agg(to_jsonb(st) ORDER BY st.patient_id) FROM st), '[]'::jsonb),
    'entries', COALESCE((SELECT jsonb_agg(jsonb_build_object(
        'id', me.id, 'profile_id', me.profile_id, 'mood_score', me.mood_score, 'anxiety_level', me.anxiety_level,
        'energy_level', me.energy_level, 'sleep_quality', me.sleep_quality, 'sleep_hours', me.sleep_hours, 'date', me.date)
        ORDER BY me.date, me.id)
      FROM mood_entries me WHERE me.profile_id IN (SELECT profile_id FROM st) AND me.date >= p_since), '[]'::jsonb),
    'triages', COALESCE((SELECT jsonb_agg(to_jsonb(t)) FROM (
        SELECT DISTINCT ON (patient_id) * FROM student_triage
        WHERE institution_id = p_institution_id AND patient_id IN (SELECT patient_id FROM st)
        ORDER BY patient_id, created_at DESC) t), '[]'::jsonb)
  ) INTO v_result;
  RETURN v_result;
END $$;
REVOKE ALL ON FUNCTION public.get_institution_triage_inputs(uuid, date) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_institution_triage_inputs(uuid, date) TO authenticated;
