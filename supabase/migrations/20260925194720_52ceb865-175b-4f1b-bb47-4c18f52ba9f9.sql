CREATE OR REPLACE FUNCTION public.save_anonymous_journey_session(_session jsonb, _emotions jsonb)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _session_id uuid;
  _emotion jsonb;
BEGIN
  IF auth.uid() IS NOT NULL THEN
    RAISE EXCEPTION 'Esta função é exclusiva para jornadas anônimas';
  END IF;

  INSERT INTO public.journey_sessions (
    user_id, session_key, tenant_id, family_id, emotion_id,
    intensity_before, intensity_after, practice_id, duration_minutes,
    perceived_change_ids, usefulness, phase, status, focus_mode,
    comprehension, action, immediate_regulation, learning_practice, completed_at
  ) VALUES (
    NULL,
    _session->>'session_key',
    NULLIF(_session->>'tenant_id', '')::uuid,
    _session->>'family_id',
    _session->>'emotion_id',
    (_session->>'intensity_before')::smallint,
    NULLIF(_session->>'intensity_after', '')::smallint,
    NULLIF(_session->>'practice_id', ''),
    NULLIF(_session->>'duration_minutes', '')::smallint,
    ARRAY(SELECT jsonb_array_elements_text(COALESCE(_session->'perceived_change_ids', '[]'::jsonb))),
    NULLIF(_session->>'usefulness', '')::smallint,
    COALESCE(_session->>'phase', 'record'),
    COALESCE(_session->>'status', 'completed'),
    NULLIF(_session->>'focus_mode', ''),
    COALESCE(_session->'comprehension', '{}'::jsonb),
    COALESCE(_session->'action', '{}'::jsonb),
    COALESCE(_session->'immediate_regulation', '{}'::jsonb),
    COALESCE(_session->'learning_practice', '{}'::jsonb),
    COALESCE(NULLIF(_session->>'completed_at', '')::timestamptz, now())
  )
  RETURNING id INTO _session_id;

  FOR _emotion IN SELECT value FROM jsonb_array_elements(COALESCE(_emotions, '[]'::jsonb))
  LOOP
    INSERT INTO public.journey_session_emotions (
      session_id, user_id, emotion_id, family_id, emotion_level,
      intensity_before, intensity_after, is_focus, position
    ) VALUES (
      _session_id,
      NULL,
      _emotion->>'emotion_id',
      NULLIF(_emotion->>'family_id', ''),
      (_emotion->>'emotion_level')::smallint,
      (_emotion->>'intensity_before')::smallint,
      NULLIF(_emotion->>'intensity_after', '')::smallint,
      COALESCE((_emotion->>'is_focus')::boolean, false),
      (_emotion->>'position')::smallint
    );
  END LOOP;

  RETURN _session_id;
END;
$$;

REVOKE ALL ON FUNCTION public.save_anonymous_journey_session(jsonb, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.save_anonymous_journey_session(jsonb, jsonb) TO anon;
GRANT EXECUTE ON FUNCTION public.save_anonymous_journey_session(jsonb, jsonb) TO service_role;