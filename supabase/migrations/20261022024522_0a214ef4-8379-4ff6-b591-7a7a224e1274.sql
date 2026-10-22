CREATE OR REPLACE FUNCTION public.get_institution_student_timeline(_institution_id uuid, _patient_id uuid, _days int DEFAULT 90)
RETURNS TABLE(id text, kind text, occurred_at timestamptz, title text, detail text, level text)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE _uid uuid; _pid uuid; _since timestamptz := now() - make_interval(days => _days);
BEGIN
  IF NOT (public.is_admin(auth.uid()) OR public.user_has_institution_access(auth.uid(), _institution_id)) THEN
    RAISE EXCEPTION 'not authorized';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM patient_institutions WHERE patient_id=_patient_id AND institution_id=_institution_id) THEN
    RETURN;
  END IF;
  SELECT pa.profile_id, pr.user_id INTO _pid, _uid FROM pacientes pa JOIN profiles pr ON pr.id=pa.profile_id WHERE pa.id=_patient_id;
  RETURN QUERY
  SELECT 'm'||me.id::text, 'mood', (me.date::timestamp + time '12:00')::timestamptz, 'Diário emocional',
    'Humor '||coalesce(me.mood_score::text,'-')||'/5', a.risk_level::text
  FROM mood_entries me LEFT JOIN mood_entry_analyses a ON a.mood_entry_id=me.id
  WHERE (me.profile_id=_pid OR me.user_id=_uid) AND me.date >= _since::date
  UNION ALL
  SELECT 'j'||js.id::text, 'journey', coalesce(js.completed_at, js.created_at), 'Jornada emocional',
    coalesce(js.emotion_id,'')||coalesce(' · intensidade '||js.intensity_before||'/5',''), js.status
  FROM journey_sessions js WHERE js.user_id=_uid AND js.created_at >= _since
  UNION ALL
  SELECT 'p'||pc.id::text, 'practice', pc.created_at, coalesce(p.titulo,'Prática'),
    CASE WHEN pc.duracao_segundos IS NOT NULL THEN round(pc.duracao_segundos/60.0)::text||' min' END, NULL
  FROM praticas_checkouts pc LEFT JOIN praticas p ON p.id=pc.pratica_id WHERE pc.user_id=_uid AND pc.created_at >= _since
  UNION ALL
  SELECT 's'||r.id::text, 'scale', coalesce(r.taken_at, r.created_at), coalesce(es.name, upper(r.scale_code)),
    coalesce(r.severity, ''), NULL
  FROM emotional_scale_responses r LEFT JOIN emotional_scales es ON es.id=r.scale_id WHERE r.user_id=_uid AND coalesce(r.taken_at,r.created_at) >= _since
  UNION ALL
  SELECT 'g'||g.id::text, 'group', coalesce(g.attended_at, g.registered_at), 'Encontro em grupo',
    CASE WHEN g.attended_at IS NOT NULL THEN 'Participou' WHEN g.cancelled_at IS NOT NULL THEN 'Cancelado' ELSE 'Inscrito' END, NULL
  FROM group_session_registrations g WHERE g.user_id=_uid AND g.registered_at >= _since
  ORDER BY 3 DESC;
END $$;
REVOKE ALL ON FUNCTION public.get_institution_student_timeline(uuid,uuid,int) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.get_institution_student_timeline(uuid,uuid,int) TO authenticated;