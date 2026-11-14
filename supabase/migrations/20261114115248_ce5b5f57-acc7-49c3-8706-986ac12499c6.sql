CREATE OR REPLACE FUNCTION public.get_clinical_home_summary()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE uid uuid := auth.uid(); res jsonb; sem text;
BEGIN
  IF uid IS NULL OR NOT EXISTS (SELECT 1 FROM user_roles WHERE user_id = uid AND role IN ('admin','super_admin','admin_rbe','clinical_coordinator')) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  sem := extract(year from now())::text || '.' || CASE WHEN extract(month from now()) <= 6 THEN '1' ELSE '2' END;
  WITH st AS (
    SELECT DISTINCT pi.institution_id, pi.patient_id, pa.profile_id, coalesce(pr.user_id, pa.profile_id) AS user_id
    FROM patient_institutions pi JOIN pacientes pa ON pa.id = pi.patient_id
    LEFT JOIN profiles pr ON pr.id = pa.profile_id
    WHERE pi.enrollment_status = 'enrolled'
  ), lvl AS (
    SELECT st.institution_id, st.patient_id, st.profile_id,
      coalesce((SELECT a.risk_level::text FROM mood_entries m JOIN mood_entry_analyses a ON a.mood_entry_id = m.id
        WHERE m.profile_id = st.profile_id AND m.date >= current_date - 30 ORDER BY m.date DESC, a.created_at DESC LIMIT 1), 'none') AS level
    FROM st
  ), cur AS (
    SELECT avg(m.mood_score) mood, avg(m.anxiety_level) anx, avg(m.sleep_quality) sleep, avg(m.energy_level) energy
    FROM mood_entries m WHERE m.profile_id IN (SELECT profile_id FROM st) AND m.date >= current_date - 30
  ), prev AS (
    SELECT avg(m.mood_score) mood, avg(m.anxiety_level) anx, avg(m.sleep_quality) sleep, avg(m.energy_level) energy
    FROM mood_entries m WHERE m.profile_id IN (SELECT profile_id FROM st) AND m.date >= current_date - 60 AND m.date < current_date - 30
  ), inst_avg AS (
    SELECT st.institution_id, count(DISTINCT m.profile_id) respondents,
      avg(m.mood_score) mood, avg(m.anxiety_level) anx, avg(m.sleep_quality) sleep, avg(m.energy_level) energy
    FROM st JOIN mood_entries m ON m.profile_id = st.profile_id AND m.date >= current_date - 30
    GROUP BY st.institution_id
  ), inst_e7 AS (
    SELECT st.institution_id, count(DISTINCT m.profile_id) n
    FROM st JOIN mood_entries m ON m.profile_id = st.profile_id AND m.date >= current_date - 7
    JOIN mood_entry_analyses a ON a.mood_entry_id = m.id AND a.risk_level = 'critical'
    GROUP BY st.institution_id
  ), inst_flow AS (
    SELECT institution_id,
      count(*) FILTER (WHERE triaged_at IS NOT NULL) n_triage,
      avg(extract(epoch FROM triaged_at - requested_at)/3600) FILTER (WHERE triaged_at IS NOT NULL) h_triage,
      count(*) FILTER (WHERE first_consult_at IS NOT NULL) n_consult,
      avg(extract(epoch FROM first_consult_at - requested_at)/86400) FILTER (WHERE first_consult_at IS NOT NULL) d_consult
    FROM care_requests WHERE requested_at >= now() - interval '90 days' GROUP BY institution_id
  ), inst AS (
    SELECT i.id, i.name, i.logo_url,
      (SELECT count(*) FROM st WHERE st.institution_id = i.id) students,
      (SELECT count(*) FROM lvl WHERE lvl.institution_id = i.id AND level = 'critical') elevated,
      (SELECT count(*) FROM lvl WHERE lvl.institution_id = i.id AND level = 'alert') alert,
      (SELECT count(*) FROM lvl WHERE lvl.institution_id = i.id AND level = 'attention') attention,
      (SELECT count(*) FROM lvl WHERE lvl.institution_id = i.id AND level = 'healthy') healthy,
      (SELECT count(*) FROM lvl WHERE lvl.institution_id = i.id AND level = 'none') no_data,
      (SELECT count(*) FROM lvl WHERE lvl.institution_id = i.id AND level = 'critical' AND NOT EXISTS (SELECT 1 FROM student_triage t WHERE t.patient_id = lvl.patient_id AND t.created_at >= now() - interval '30 days')) elevated_untriaged,
      coalesce((SELECT n FROM inst_e7 WHERE inst_e7.institution_id = i.id), 0) elevated_7d,
      coalesce((SELECT respondents FROM inst_avg WHERE inst_avg.institution_id = i.id), 0) diary_respondents,
      (SELECT CASE WHEN respondents >= 10 THEN round(mood::numeric, 2) END FROM inst_avg WHERE inst_avg.institution_id = i.id) avg_mood,
      (SELECT CASE WHEN respondents >= 10 THEN round(anx::numeric, 2) END FROM inst_avg WHERE inst_avg.institution_id = i.id) avg_anx,
      (SELECT CASE WHEN respondents >= 10 THEN round(sleep::numeric, 2) END FROM inst_avg WHERE inst_avg.institution_id = i.id) avg_sleep,
      (SELECT CASE WHEN respondents >= 10 THEN round(energy::numeric, 2) END FROM inst_avg WHERE inst_avg.institution_id = i.id) avg_energy,
      (SELECT CASE WHEN n_triage >= 10 THEN round(h_triage::numeric, 1) END FROM inst_flow WHERE inst_flow.institution_id = i.id) hours_to_triage,
      (SELECT CASE WHEN n_consult >= 10 THEN round(d_consult::numeric, 1) END FROM inst_flow WHERE inst_flow.institution_id = i.id) days_to_consult,
      (SELECT count(*) FROM student_triage t WHERE t.institution_id = i.id AND t.status IN ('pending','in_progress')) triage_open,
      (SELECT count(*) FROM student_triage t WHERE t.institution_id = i.id AND t.status <> 'resolved' AND t.priority IN ('urgent','high')) triage_urgent,
      (SELECT count(*) FROM student_triage t WHERE t.institution_id = i.id AND t.status <> 'resolved' AND t.follow_up_date < current_date) followups_overdue,
      (SELECT count(*) FROM care_requests c WHERE c.institution_id = i.id AND c.outcome IS NULL AND c.triaged_at IS NULL AND c.requested_at < now() - interval '3 days') care_stalled,
      (SELECT count(DISTINCT p.patient_id) FROM permanence_responses p WHERE p.institution_id = i.id AND p.semester = sem) radar_answered
    FROM educational_institutions i WHERE i.is_active
  )
  SELECT jsonb_build_object(
    'students', (SELECT count(DISTINCT patient_id) FROM st),
    'levels', (SELECT jsonb_object_agg(level, n) FROM (SELECT level, count(*) n FROM lvl GROUP BY level) x),
    'elevated_untriaged', (SELECT count(*) FROM lvl WHERE level = 'critical' AND NOT EXISTS (SELECT 1 FROM student_triage t WHERE t.patient_id = lvl.patient_id AND t.created_at >= now() - interval '30 days')),
    'triage_open', (SELECT count(*) FROM student_triage WHERE status IN ('pending','in_progress')),
    'triage_urgent', (SELECT count(*) FROM student_triage WHERE status <> 'resolved' AND priority IN ('urgent','high')),
    'followups_overdue', (SELECT count(*) FROM student_triage WHERE status <> 'resolved' AND follow_up_date < current_date),
    'care_stalled', (SELECT count(*) FROM care_requests WHERE outcome IS NULL AND triaged_at IS NULL AND requested_at < now() - interval '3 days'),
    'elevated_7d', (SELECT count(DISTINCT m.profile_id) FROM mood_entry_analyses a JOIN mood_entries m ON m.id = a.mood_entry_id WHERE a.risk_level = 'critical' AND m.date >= current_date - 7 AND m.profile_id IN (SELECT profile_id FROM st)),
    'averages', (SELECT jsonb_build_object('cur', to_jsonb(cur), 'prev', to_jsonb(prev)) FROM cur, prev),
    'engaged_7d', (SELECT count(DISTINCT m.profile_id) FROM mood_entries m WHERE m.profile_id IN (SELECT profile_id FROM st) AND m.date >= current_date - 7),
    'flow', jsonb_build_object(
      'hours_to_triage', (SELECT round(avg(extract(epoch FROM triaged_at - requested_at)/3600)::numeric, 1) FROM care_requests WHERE triaged_at IS NOT NULL AND requested_at >= now() - interval '90 days'),
      'days_to_consult', (SELECT round(avg(extract(epoch FROM first_consult_at - requested_at)/86400)::numeric, 1) FROM care_requests WHERE first_consult_at IS NOT NULL AND requested_at >= now() - interval '90 days'),
      'resolved_30d', (SELECT count(*) FROM student_triage WHERE resolved_at >= now() - interval '30 days'),
      'outcomes', (SELECT coalesce(jsonb_object_agg(k, n), '{}'::jsonb) FROM (SELECT coalesce(resolution_type, 'outro') k, count(*) n FROM student_triage WHERE resolved_at >= now() - interval '30 days' GROUP BY 1) o)
    ),
    'radar_semester', sem,
    'radar_answered', (SELECT count(DISTINCT patient_id) FROM permanence_responses WHERE semester = sem),
    'appointments_week', (SELECT count(*) FROM agendamentos WHERE data_consulta BETWEEN current_date AND current_date + 7 AND status <> 'cancelado'),
    'sessions_week', (SELECT coalesce(jsonb_agg(jsonb_build_object('id', id, 'title', title, 'date', session_date, 'time', start_time, 'free_spots', greatest(coalesce(max_participants,0) - coalesce(current_registrations,0), 0)) ORDER BY session_date, start_time), '[]'::jsonb)
       FROM group_sessions WHERE status IN ('scheduled','published','live') AND session_date BETWEEN current_date AND current_date + 7),
    'by_institution', (SELECT coalesce(jsonb_agg(
        CASE WHEN students >= 10 THEN to_jsonb(inst)
        ELSE to_jsonb(inst) || jsonb_build_object('elevated_untriaged', NULL, 'elevated_7d', NULL) END), '[]'::jsonb) FROM inst WHERE students > 0)
  ) INTO res;
  RETURN res;
END $function$;