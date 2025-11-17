-- Função 1: Métricas de crescimento (últimos 12 meses)
CREATE OR REPLACE FUNCTION get_institution_growth_metrics(p_institution_id uuid)
RETURNS TABLE (
  month text,
  professionals_added bigint,
  students_enrolled bigint
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH months AS (
    SELECT generate_series(
      DATE_TRUNC('month', NOW() - INTERVAL '11 months'),
      DATE_TRUNC('month', NOW()),
      '1 month'::interval
    ) AS month_date
  ),
  prof_counts AS (
    SELECT 
      DATE_TRUNC('month', start_date) AS month,
      COUNT(*) AS count
    FROM professional_institutions
    WHERE institution_id = p_institution_id
      AND is_active = true
      AND start_date IS NOT NULL
    GROUP BY DATE_TRUNC('month', start_date)
  ),
  student_counts AS (
    SELECT 
      DATE_TRUNC('month', enrollment_date) AS month,
      COUNT(*) AS count
    FROM patient_institutions
    WHERE institution_id = p_institution_id
      AND enrollment_date IS NOT NULL
    GROUP BY DATE_TRUNC('month', enrollment_date)
  )
  SELECT 
    TO_CHAR(m.month_date, 'Mon/YY') AS month,
    COALESCE(p.count, 0) AS professionals_added,
    COALESCE(s.count, 0) AS students_enrolled
  FROM months m
  LEFT JOIN prof_counts p ON DATE_TRUNC('month', p.month) = m.month_date
  LEFT JOIN student_counts s ON DATE_TRUNC('month', s.month) = m.month_date
  ORDER BY m.month_date;
END;
$$;

-- Função 2: Métricas de engajamento
CREATE OR REPLACE FUNCTION get_institution_engagement_metrics(p_institution_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
  v_top_professionals jsonb;
  v_total_appointments integer;
  v_cancelled_appointments integer;
  v_cancellation_rate numeric;
BEGIN
  -- Top 5 profissionais por agendamentos (últimos 90 dias)
  SELECT jsonb_agg(prof_data)
  INTO v_top_professionals
  FROM (
    SELECT 
      p.display_name AS name,
      COUNT(a.id) AS appointments
    FROM professional_institutions pi
    JOIN profissionais p ON p.id = pi.professional_id
    LEFT JOIN agendamentos a ON a.professional_id = p.id
      AND a.created_at >= NOW() - INTERVAL '90 days'
    WHERE pi.institution_id = p_institution_id
      AND pi.is_active = true
    GROUP BY p.id, p.display_name
    ORDER BY COUNT(a.id) DESC
    LIMIT 5
  ) prof_data;

  -- Contadores de agendamentos (últimos 30 dias)
  SELECT 
    COUNT(*),
    COUNT(CASE WHEN status = 'cancelado' THEN 1 END)
  INTO v_total_appointments, v_cancelled_appointments
  FROM agendamentos a
  JOIN professional_institutions pi ON pi.professional_id = a.professional_id
  WHERE pi.institution_id = p_institution_id
    AND a.created_at >= NOW() - INTERVAL '30 days';

  -- Calcular taxa de cancelamento
  IF v_total_appointments > 0 THEN
    v_cancellation_rate := ROUND((v_cancelled_appointments::numeric / v_total_appointments * 100), 1);
  ELSE
    v_cancellation_rate := 0;
  END IF;

  -- Montar resposta JSON
  SELECT jsonb_build_object(
    'top_professionals', COALESCE(v_top_professionals, '[]'::jsonb),
    'total_appointments', v_total_appointments,
    'cancelled_appointments', v_cancelled_appointments,
    'cancellation_rate', v_cancellation_rate,
    'active_rate', ROUND(100 - v_cancellation_rate, 1)
  ) INTO result;

  RETURN result;
END;
$$;

-- Função 3: Sistema de alertas automáticos
CREATE OR REPLACE FUNCTION get_institution_alerts(p_institution_id uuid)
RETURNS TABLE (
  severity text,
  message text,
  count integer
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  
  -- Alerta 1: Profissionais sem agendamentos há 30+ dias
  SELECT 
    'medium'::text AS severity,
    'Profissionais inativos (sem agendamentos há 30+ dias)' AS message,
    COUNT(*)::integer AS count
  FROM professional_institutions pi
  JOIN profissionais p ON p.id = pi.professional_id
  LEFT JOIN agendamentos a ON a.professional_id = p.id 
    AND a.created_at >= NOW() - INTERVAL '30 days'
  WHERE pi.institution_id = p_institution_id
    AND pi.is_active = true
    AND a.id IS NULL
  HAVING COUNT(*) > 0

  UNION ALL

  -- Alerta 2: Taxa de cancelamento alta (>20%)
  SELECT 
    'high'::text AS severity,
    'Taxa de cancelamento elevada (>20% nos últimos 30 dias)' AS message,
    1::integer AS count
  WHERE (
    SELECT 
      CASE 
        WHEN COUNT(*) = 0 THEN 0
        ELSE (COUNT(CASE WHEN status = 'cancelado' THEN 1 END)::numeric / COUNT(*) * 100)
      END
    FROM agendamentos a
    JOIN professional_institutions pi ON pi.professional_id = a.professional_id
    WHERE pi.institution_id = p_institution_id
      AND a.created_at >= NOW() - INTERVAL '30 days'
  ) > 20

  UNION ALL

  -- Alerta 3: Cupons ativos prestes a expirar (próximos 7 dias)
  SELECT 
    'low'::text AS severity,
    'Cupons expirando nos próximos 7 dias' AS message,
    COUNT(*)::integer AS count
  FROM institution_coupons
  WHERE institution_id = p_institution_id
    AND is_active = true
    AND valid_until >= NOW()
    AND valid_until <= NOW() + INTERVAL '7 days'
  HAVING COUNT(*) > 0;
  
END;
$$;