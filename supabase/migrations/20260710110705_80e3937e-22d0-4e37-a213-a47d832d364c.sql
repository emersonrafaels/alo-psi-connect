
CREATE OR REPLACE FUNCTION public.get_institution_mood_aggregates(p_institution_id uuid, p_period_days integer DEFAULT 30)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  result JSONB;
  v_user_count INTEGER;
BEGIN
  IF NOT (
    has_role(auth.uid(), 'super_admin'::app_role)
    OR EXISTS (
      SELECT 1 FROM institution_users
      WHERE user_id = auth.uid()
        AND institution_id = p_institution_id
        AND role = 'admin'
        AND is_active = true
    )
  ) THEN
    RAISE EXCEPTION 'access denied';
  END IF;

  SELECT COUNT(DISTINCT me.profile_id) INTO v_user_count
  FROM mood_entries me
  JOIN pacientes pa ON pa.profile_id = me.profile_id
  JOIN patient_institutions pi ON pi.patient_id = pa.id
  WHERE pi.institution_id = p_institution_id
    AND me.date >= CURRENT_DATE - (p_period_days || ' days')::interval;

  IF v_user_count < 5 THEN
    RETURN jsonb_build_object(
      'available', false,
      'reason', 'insufficient_users',
      'min_required', 5,
      'current', v_user_count
    );
  END IF;

  SELECT jsonb_build_object(
    'available', true,
    'period_days', p_period_days,
    'unique_users', v_user_count,
    'total_entries', COUNT(*),
    'avg_mood', ROUND(AVG(me.mood_score)::numeric, 2),
    'avg_energy', ROUND(AVG(me.energy_level)::numeric, 2),
    'avg_anxiety', ROUND(AVG(me.anxiety_level)::numeric, 2),
    'avg_sleep_hours', ROUND(AVG(me.sleep_hours)::numeric, 2),
    'avg_sleep_quality', ROUND(AVG(me.sleep_quality)::numeric, 2),
    'risk_distribution', (
      SELECT jsonb_object_agg(risk_level, cnt)
      FROM (
        SELECT mea.risk_level::text AS risk_level, COUNT(*) AS cnt
        FROM mood_entry_analyses mea
        JOIN mood_entries me2 ON me2.id = mea.mood_entry_id
        JOIN pacientes pa2 ON pa2.profile_id = me2.profile_id
        JOIN patient_institutions pi2 ON pi2.patient_id = pa2.id
        WHERE pi2.institution_id = p_institution_id
          AND me2.date >= CURRENT_DATE - (p_period_days || ' days')::interval
        GROUP BY mea.risk_level
      ) rd
    )
  ) INTO result
  FROM mood_entries me
  JOIN pacientes pa ON pa.profile_id = me.profile_id
  JOIN patient_institutions pi ON pi.patient_id = pa.id
  WHERE pi.institution_id = p_institution_id
    AND me.date >= CURRENT_DATE - (p_period_days || ' days')::interval;

  RETURN result;
END;
$function$;
