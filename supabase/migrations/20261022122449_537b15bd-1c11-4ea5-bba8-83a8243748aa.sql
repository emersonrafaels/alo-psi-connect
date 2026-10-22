CREATE OR REPLACE FUNCTION public.get_institution_student_timeline(_institution_id uuid, _patient_id uuid, _days int DEFAULT 90)
RETURNS TABLE(id text, kind text, occurred_at timestamptz, title text, detail text, level text)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE _uid uuid; _pid uuid; _key uuid; _since timestamptz := now() - make_interval(days => _days);
BEGIN
  IF NOT (public.is_admin(auth.uid()) OR public.user_has_institution_access(auth.uid(), _institution_id)) THEN
    RAISE EXCEPTION 'not authorized';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM patient_institutions WHERE patient_id=_patient_id AND institution_id=_institution_id) THEN
    RETURN;
  END IF;
  SELECT pa.profile_id, pr.user_id INTO _pid, _uid FROM pacientes pa JOIN profiles pr ON pr.id=pa.profile_id WHERE pa.id=_patient_id;
  _key := coalesce(_uid, _pid);
  RETURN QUERY
  SELECT 'm'||me.id::text, 'mood'::text, (me.date::timestamp + time '12:00')::timestamptz, 'Diário emocional'::text,
    'Humor '||coalesce(me.mood_score::text,'-')||'/5', a.risk_level::text
  FROM mood_entries me LEFT JOIN mood_entry_analyses a ON a.mood_entry_id=me.id
  WHERE (me.profile_id=_pid OR (_uid IS NOT NULL AND me.user_id=_uid)) AND me.date >= _since::date
  UNION ALL
  SELECT 'j'||js.id::text, 'journey', coalesce(js.completed_at, js.created_at), 'Jornada emocional',
    coalesce(js.emotion_id,'')||coalesce(' · intensidade '||js.intensity_before||'/5',''), js.status
  FROM journey_sessions js WHERE js.user_id=_key AND js.created_at >= _since
  UNION ALL
  SELECT 'p'||pc.id::text, 'practice', pc.created_at, coalesce(p.titulo,'Prática'),
    CASE WHEN pc.duracao_segundos IS NOT NULL THEN round(pc.duracao_segundos/60.0)::text||' min' END, NULL
  FROM praticas_checkouts pc LEFT JOIN praticas p ON p.id=pc.pratica_id WHERE pc.user_id=_key AND pc.created_at >= _since
  UNION ALL
  SELECT 's'||r.id::text, 'scale', coalesce(r.taken_at, r.created_at), coalesce(es.name, upper(r.scale_code)),
    coalesce(r.severity, ''), NULL
  FROM emotional_scale_responses r LEFT JOIN emotional_scales es ON es.id=r.scale_id WHERE _uid IS NOT NULL AND r.user_id=_uid AND coalesce(r.taken_at,r.created_at) >= _since
  UNION ALL
  SELECT 'd'||d.id::text, 'scale', d.taken_at, coalesce(es.name, d.scale_code), 'Pontuação '||d.raw_score::text, NULL
  FROM institution_demo_scale_responses d LEFT JOIN emotional_scales es ON es.code=d.scale_code
  WHERE d.patient_id=_patient_id AND d.institution_id=_institution_id AND d.taken_at >= _since
  UNION ALL
  SELECT 'g'||g.id::text, 'group', coalesce(g.attended_at, g.registered_at), 'Encontro em grupo',
    CASE WHEN g.attended_at IS NOT NULL THEN 'Participou' WHEN g.cancelled_at IS NOT NULL THEN 'Cancelado' ELSE 'Inscrito' END, NULL
  FROM group_session_registrations g WHERE _uid IS NOT NULL AND g.user_id=_uid AND g.registered_at >= _since
  ORDER BY 3 DESC;
END $$;