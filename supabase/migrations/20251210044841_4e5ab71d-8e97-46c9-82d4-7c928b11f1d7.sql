-- Atualizar função get_institution_growth_metrics para usar created_at como fallback
CREATE OR REPLACE FUNCTION get_institution_growth_metrics(p_institution_id UUID)
RETURNS TABLE (
  month TEXT,
  professionals_added BIGINT,
  students_enrolled BIGINT
) AS $$
DECLARE
  month_record RECORD;
BEGIN
  -- Gerar os últimos 12 meses
  FOR month_record IN
    SELECT 
      TO_CHAR(date_trunc('month', generate_series), 'YYYY-MM') as month_str,
      date_trunc('month', generate_series) as month_start,
      (date_trunc('month', generate_series) + INTERVAL '1 month' - INTERVAL '1 day')::date as month_end
    FROM generate_series(
      date_trunc('month', CURRENT_DATE) - INTERVAL '11 months',
      date_trunc('month', CURRENT_DATE),
      '1 month'::interval
    )
  LOOP
    month := month_record.month_str;
    
    -- Contar profissionais adicionados neste mês (usando created_at como fallback para start_date)
    SELECT COUNT(*)::BIGINT INTO professionals_added
    FROM professional_institutions pi
    WHERE pi.institution_id = p_institution_id
      AND DATE_TRUNC('month', COALESCE(pi.start_date, pi.created_at::date)) = month_record.month_start;
    
    -- Contar alunos matriculados neste mês (usando created_at como fallback para enrollment_date)
    SELECT COUNT(*)::BIGINT INTO students_enrolled
    FROM patient_institutions pai
    WHERE pai.institution_id = p_institution_id
      AND DATE_TRUNC('month', COALESCE(pai.enrollment_date, pai.created_at::date)) = month_record.month_start;
    
    RETURN NEXT;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;