CREATE OR REPLACE FUNCTION public.get_institution_usage_metrics(p_institution_id uuid, p_days int DEFAULT 30, p_unit uuid DEFAULT NULL, p_course uuid DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  result jsonb;
  v_end timestamptz := now();
  v_start timestamptz := now() - make_interval(days => greatest(p_days,1));
  v_prev timestamptz := now() - make_interval(days => 2*greatest(p_days,1));
  v_hist timestamptz := least(now() - interval '12 weeks', now() - make_interval(days => 2*greatest(p_days,1)));
BEGIN
  IF NOT (public.is_admin(auth.uid()) OR public.user_has_institution_access(auth.uid(), p_institution_id)) THEN
    RAISE EXCEPTION 'access denied';
  END IF;

  CREATE TEMP TABLE IF NOT EXISTS _um_st(profile_id uuid, user_id uuid, course_id uuid, course_name text, unit_id uuid, unit_name text) ON COMMIT DROP;
  CREATE TEMP TABLE IF NOT EXISTS _um_ev(user_id uuid, kind text, ts timestamptz) ON COMMIT DROP;
  TRUNCATE _um_st; TRUNCATE _um_ev;

  INSERT INTO _um_st
  SELECT DISTINCT ON (pa.profile_id) pa.profile_id, pr.user_id, co.id, co.name, un.id, un.name
  FROM patient_institutions pi
  JOIN pacientes pa ON pa.id = pi.patient_id
  JOIN profiles pr ON pr.id = pa.profile_id
  LEFT JOIN patient_institution_placements pl ON pl.patient_id = pi.patient_id AND pl.institution_id = pi.institution_id
  LEFT JOIN institution_academic_units cl ON cl.id = pl.class_unit_id
  LEFT JOIN institution_academic_units sh ON sh.id = cl.parent_id
  LEFT JOIN institution_academic_units co ON co.id = sh.parent_id AND co.level = 'course'
  LEFT JOIN institution_academic_units un ON un.id = co.parent_id
  WHERE pi.institution_id = p_institution_id AND pa.profile_id IS NOT NULL;

  IF p_unit IS NOT NULL THEN DELETE FROM _um_st WHERE unit_id IS DISTINCT FROM p_unit; END IF;
  IF p_course IS NOT NULL THEN DELETE FROM _um_st WHERE course_id IS DISTINCT FROM p_course; END IF;

  INSERT INTO _um_ev
  SELECT s.user_id, 'diario', m.created_at FROM mood_entries m JOIN _um_st s ON s.profile_id = m.profile_id WHERE m.created_at >= v_hist
  UNION ALL SELECT j.user_id, 'jornada', j.created_at FROM journey_sessions j JOIN _um_st s ON s.user_id = j.user_id WHERE j.created_at >= v_hist
  UNION ALL SELECT c.user_id, 'praticas', c.created_at FROM praticas_checkouts c JOIN _um_st s ON s.user_id = c.user_id WHERE c.created_at >= v_hist
  UNION ALL SELECT r.user_id, 'escalas', r.taken_at FROM emotional_scale_responses r JOIN _um_st s ON s.user_id = r.user_id WHERE r.taken_at >= v_hist
  UNION ALL SELECT g.user_id, 'encontros', g.registered_at FROM group_session_registrations g JOIN _um_st s ON s.user_id = g.user_id WHERE g.registered_at >= v_hist
  UNION ALL SELECT v.user_id, 'apoios', v.visited_at FROM support_visits v JOIN _um_st s ON s.user_id = v.user_id WHERE v.visited_at >= v_hist
  UNION ALL SELECT a.user_id, 'buddy', a.created_at FROM ai_chat_sessions a JOIN _um_st s ON s.user_id = a.user_id WHERE a.created_at >= v_hist;

  WITH cur AS (SELECT * FROM _um_ev WHERE ts >= v_start),
  prev AS (SELECT * FROM _um_ev WHERE ts >= v_prev AND ts < v_start),
  wk AS (SELECT DISTINCT user_id, date_trunc('week', ts AT TIME ZONE 'America/Sao_Paulo')::date w FROM _um_ev WHERE ts >= now() - interval '12 weeks'),
  per_user AS (SELECT user_id, count(DISTINCT kind) kinds FROM cur GROUP BY 1),
  ever AS (SELECT DISTINCT user_id FROM _um_ev),
  recurring AS (SELECT user_id FROM wk WHERE w >= (now() - interval '4 weeks')::date GROUP BY 1 HAVING count(*) >= 2),
  ret AS (
    SELECT k, CASE WHEN sum(base)=0 THEN NULL ELSE round(100.0*sum(back)/sum(base)) END pct FROM (
      SELECT k.k, a.w, count(*) base, count(b.user_id) back
      FROM (VALUES (1),(2),(4)) k(k)
      JOIN wk a ON a.w + 7*k.k <= date_trunc('week', now() AT TIME ZONE 'America/Sao_Paulo')::date
      LEFT JOIN wk b ON b.user_id = a.user_id AND b.w = a.w + 7*k.k
      GROUP BY k.k, a.w) x GROUP BY k),
  appt AS (SELECT a.status, a.created_at, a.data_consulta FROM agendamentos a JOIN _um_st s ON s.user_id = a.user_id WHERE a.created_at >= v_prev),
  courses AS (
    SELECT s.course_id, max(s.course_name) course, max(s.unit_name) unit, count(*) students,
      count(DISTINCT c.user_id) active,
      count(DISTINCT p.user_id) prev_active
    FROM _um_st s
    LEFT JOIN (SELECT DISTINCT user_id FROM cur) c ON c.user_id = s.user_id
    LEFT JOIN (SELECT DISTINCT user_id FROM prev) p ON p.user_id = s.user_id
    WHERE s.course_id IS NOT NULL GROUP BY s.course_id),
  course_top AS (
    SELECT DISTINCT ON (s.course_id) s.course_id, e.kind FROM cur e JOIN _um_st s ON s.user_id = e.user_id
    WHERE s.course_id IS NOT NULL GROUP BY s.course_id, e.kind ORDER BY s.course_id, count(DISTINCT e.user_id) DESC)
  SELECT jsonb_build_object(
    'total_students', (SELECT count(*) FROM _um_st),
    'kpis', jsonb_build_object(
      'active', (SELECT count(DISTINCT user_id) FROM cur), 'active_prev', (SELECT count(DISTINCT user_id) FROM prev),
      'wau', (SELECT count(DISTINCT user_id) FROM _um_ev WHERE ts >= now() - interval '7 days'),
      'mau', (SELECT count(DISTINCT user_id) FROM _um_ev WHERE ts >= now() - interval '30 days'),
      'diary', (SELECT count(*) FROM cur WHERE kind='diario'), 'diary_prev', (SELECT count(*) FROM prev WHERE kind='diario'),
      'practices', (SELECT count(*) FROM cur WHERE kind='praticas'), 'practices_prev', (SELECT count(*) FROM prev WHERE kind='praticas'),
      'scales', (SELECT count(*) FROM cur WHERE kind='escalas'), 'scales_prev', (SELECT count(*) FROM prev WHERE kind='escalas'),
      'appointments', (SELECT count(*) FROM appt WHERE created_at >= v_start), 'appointments_prev', (SELECT count(*) FROM appt WHERE created_at < v_start)
    ),
    'by_feature', COALESCE((SELECT jsonb_object_agg(kind, n) FROM (SELECT kind, count(DISTINCT user_id) n FROM cur GROUP BY kind) x), '{}'::jsonb),
    'funnel', jsonb_build_object(
      'linked', (SELECT count(*) FROM _um_st),
      'accessed', (SELECT count(*) FROM ever),
      'one_feature', (SELECT count(*) FROM per_user),
      'three_features', (SELECT count(*) FROM per_user WHERE kinds >= 3),
      'recurring', (SELECT count(*) FROM recurring)),
    'weekly', COALESCE((SELECT jsonb_agg(jsonb_build_object('week', w, 'active', n) ORDER BY w) FROM (SELECT w, count(*) n FROM wk GROUP BY w) x), '[]'::jsonb),
    'heatmap', COALESCE((SELECT jsonb_agg(jsonb_build_object('dow', d, 'slot', sl, 'n', n)) FROM (
        SELECT extract(dow FROM ts AT TIME ZONE 'America/Sao_Paulo')::int d,
               (extract(hour FROM ts AT TIME ZONE 'America/Sao_Paulo')::int / 4) sl, count(*) n
        FROM cur GROUP BY 1,2) x), '[]'::jsonb),
    'retention', COALESCE((SELECT jsonb_object_agg('w'||k, pct) FROM ret), '{}'::jsonb),
    'courses', COALESCE((SELECT jsonb_agg(jsonb_build_object('course', c.course, 'unit', c.unit, 'students', c.students,
        'active_pct', round(100.0*c.active/c.students), 'prev_pct', round(100.0*c.prev_active/c.students), 'top_feature', t.kind) ORDER BY c.active::numeric/c.students DESC)
        FROM courses c LEFT JOIN course_top t ON t.course_id = c.course_id WHERE c.students >= 10), '[]'::jsonb),
    'hidden_courses', (SELECT count(*) FROM courses WHERE students < 10),
    'appointments', jsonb_build_object(
      'total', (SELECT count(*) FROM appt WHERE created_at >= v_start),
      'done', (SELECT count(*) FROM appt WHERE created_at >= v_start AND lower(coalesce(status,'')) IN ('confirmado','confirmed','realizado','concluido','completed')),
      'cancelled', (SELECT count(*) FROM appt WHERE created_at >= v_start AND lower(coalesce(status,'')) IN ('cancelado','cancelled','canceled')),
      'avg_lead_days', (SELECT round(avg(data_consulta - (created_at AT TIME ZONE 'America/Sao_Paulo')::date)::numeric,1) FROM appt WHERE created_at >= v_start AND data_consulta IS NOT NULL)),
    'encounters', jsonb_build_object(
      'registrations', (SELECT count(*) FROM group_session_registrations g JOIN _um_st s ON s.user_id=g.user_id WHERE g.registered_at >= v_start),
      'attended', (SELECT count(*) FROM group_session_registrations g JOIN _um_st s ON s.user_id=g.user_id WHERE g.registered_at >= v_start AND g.attended_at IS NOT NULL)),
    'messages', jsonb_build_object(
      'sent', (SELECT count(*) FROM message_threads t WHERE t.institution_id = p_institution_id AND t.created_at >= v_start),
      'read', (SELECT count(*) FROM message_threads t WHERE t.institution_id = p_institution_id AND t.created_at >= v_start AND t.recipient_read_at IS NOT NULL),
      'replied', (SELECT count(*) FROM message_threads t WHERE t.institution_id = p_institution_id AND t.created_at >= v_start AND t.recipient_replied))
  ) INTO result;
  RETURN result;
END $$;

REVOKE ALL ON FUNCTION public.get_institution_usage_metrics(uuid,int,uuid,uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.get_institution_usage_metrics(uuid,int,uuid,uuid) TO authenticated, service_role;