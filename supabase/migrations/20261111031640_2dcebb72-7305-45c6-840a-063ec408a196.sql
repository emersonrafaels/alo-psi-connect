CREATE OR REPLACE FUNCTION public.get_staff_home_summary()
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE uid uuid := auth.uid(); res jsonb; sem text;
BEGIN
  IF uid IS NULL OR NOT EXISTS (SELECT 1 FROM user_roles WHERE user_id = uid AND role IN ('admin','super_admin','admin_rbe','clinical_coordinator')) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  sem := extract(year from now())::text || '.' || CASE WHEN extract(month from now()) <= 6 THEN '1' ELSE '2' END;
  SELECT jsonb_build_object(
    'institutions', (SELECT count(*) FROM educational_institutions WHERE is_active),
    'students', (SELECT count(DISTINCT patient_id) FROM patient_institutions WHERE enrollment_status = 'enrolled'),
    'professionals_active', (SELECT count(*) FROM profissionais WHERE ativo),
    'professionals_pending', (SELECT count(*) FROM profissionais WHERE NOT coalesce(ativo,false) AND profile_id IS NOT NULL),
    'appointments_week', (SELECT count(*) FROM agendamentos WHERE data_consulta BETWEEN current_date AND current_date + 7 AND status <> 'cancelado'),
    'payments_pending', (SELECT count(*) FROM agendamentos WHERE payment_status = 'pending_payment' AND status <> 'cancelado'),
    'triage_open', (SELECT count(*) FROM student_triage WHERE status IN ('pending','in_progress')),
    'triage_urgent', (SELECT count(*) FROM student_triage WHERE status <> 'resolved' AND priority IN ('urgent','high')),
    'followups_overdue', (SELECT count(*) FROM student_triage WHERE status <> 'resolved' AND follow_up_date < current_date),
    'care_open', (SELECT count(*) FROM care_requests WHERE outcome IS NULL AND first_consult_at IS NULL),
    'care_stalled', (SELECT count(*) FROM care_requests WHERE outcome IS NULL AND triaged_at IS NULL AND requested_at < now() - interval '3 days'),
    'radar_semester', sem,
    'radar_answered', (SELECT count(DISTINCT patient_id) FROM permanence_responses WHERE semester = sem),
    'by_institution', coalesce((SELECT jsonb_agg(x ORDER BY x->>'name') FROM (
      SELECT jsonb_build_object('id', i.id, 'name', i.name, 'logo_url', i.logo_url,
        'students', (SELECT count(*) FROM patient_institutions pi WHERE pi.institution_id = i.id AND pi.enrollment_status = 'enrolled'),
        'triage_open', (SELECT count(*) FROM student_triage t WHERE t.institution_id = i.id AND t.status IN ('pending','in_progress')),
        'triage_urgent', (SELECT count(*) FROM student_triage t WHERE t.institution_id = i.id AND t.status <> 'resolved' AND t.priority IN ('urgent','high')),
        'care_open', (SELECT count(*) FROM care_requests c WHERE c.institution_id = i.id AND c.outcome IS NULL AND c.first_consult_at IS NULL)) x
      FROM educational_institutions i WHERE i.is_active AND EXISTS (SELECT 1 FROM patient_institutions pi WHERE pi.institution_id = i.id)) s), '[]'::jsonb)
  ) INTO res;
  RETURN res;
END $$;
REVOKE EXECUTE ON FUNCTION public.get_staff_home_summary() FROM anon, public;
GRANT EXECUTE ON FUNCTION public.get_staff_home_summary() TO authenticated;