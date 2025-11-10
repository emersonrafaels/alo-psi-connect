-- Função que retorna profissionais com horários disponíveis já filtrados
-- Remove automaticamente conflitos com: unavailability, google calendar e agendamentos existentes

CREATE OR REPLACE FUNCTION get_professionals_with_filtered_availability(
  p_date_start DATE DEFAULT CURRENT_DATE,
  p_date_end DATE DEFAULT CURRENT_DATE + INTERVAL '30 days',
  p_tenant_id UUID DEFAULT NULL
)
RETURNS TABLE (
  professional_id INTEGER,
  display_name TEXT,
  profissao TEXT,
  preco_consulta NUMERIC,
  foto_perfil_url TEXT,
  resumo_profissional TEXT,
  servicos_raw TEXT,
  ativo BOOLEAN,
  ordem_destaque INTEGER,
  day TEXT,
  start_time TIME,
  end_time TIME,
  time_slot INTEGER,
  available_dates JSONB
) 
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  WITH professional_schedules AS (
    SELECT 
      p.id as prof_id,
      p.display_name,
      p.profissao,
      p.preco_consulta,
      p.foto_perfil_url,
      p.resumo_profissional,
      p.servicos_raw,
      p.ativo,
      p.ordem_destaque,
      ps.day,
      ps.start_time,
      ps.end_time,
      ps.time_slot
    FROM profissionais p
    INNER JOIN profissionais_sessoes ps ON ps.user_id = p.id
    WHERE p.ativo = true
      AND (p_tenant_id IS NULL OR p.id IN (
        SELECT professional_id FROM professional_tenants WHERE tenant_id = p_tenant_id
      ))
  ),
  date_series AS (
    SELECT generate_series(p_date_start, p_date_end, '1 day'::interval)::date as check_date
  ),
  expanded_slots AS (
    SELECT 
      ps.*,
      ds.check_date,
      -- Gerar slots de horário baseado no time_slot
      generate_series(
        ps.start_time,
        ps.end_time - (ps.time_slot || ' minutes')::interval,
        (ps.time_slot || ' minutes')::interval
      )::time as slot_start_time
    FROM professional_schedules ps
    CROSS JOIN date_series ds
    WHERE 
      -- Verificar se o dia da semana corresponde
      CASE ps.day
        WHEN 'mon' THEN EXTRACT(DOW FROM ds.check_date) = 1
        WHEN 'tue' THEN EXTRACT(DOW FROM ds.check_date) = 2
        WHEN 'wed' THEN EXTRACT(DOW FROM ds.check_date) = 3
        WHEN 'thu' THEN EXTRACT(DOW FROM ds.check_date) = 4
        WHEN 'fri' THEN EXTRACT(DOW FROM ds.check_date) = 5
        WHEN 'sat' THEN EXTRACT(DOW FROM ds.check_date) = 6
        WHEN 'sun' THEN EXTRACT(DOW FROM ds.check_date) = 0
      END
  ),
  filtered_slots AS (
    SELECT 
      es.*,
      (es.slot_start_time + (es.time_slot || ' minutes')::interval)::time as slot_end_time
    FROM expanded_slots es
    WHERE NOT EXISTS (
      -- Excluir se tem unavailability no período
      SELECT 1 FROM professional_unavailability pu
      WHERE pu.professional_id = es.prof_id
        AND pu.date = es.check_date
        AND (
          pu.all_day = true
          OR (
            pu.start_time <= es.slot_start_time 
            AND pu.end_time > es.slot_start_time
          )
        )
    )
    AND NOT EXISTS (
      -- Excluir se tem evento do Google Calendar (is_busy)
      SELECT 1 FROM google_calendar_events gce
      INNER JOIN profissionais p ON p.profile_id = (
        SELECT id FROM profiles WHERE user_id = gce.user_id LIMIT 1
      )
      WHERE p.id = es.prof_id
        AND gce.is_busy = true
        AND DATE(gce.start_time) = es.check_date
        AND gce.start_time::time <= es.slot_start_time
        AND gce.end_time::time > es.slot_start_time
    )
    AND NOT EXISTS (
      -- Excluir se já tem agendamento confirmado
      SELECT 1 FROM agendamentos a
      WHERE a.professional_id = es.prof_id
        AND a.data_consulta = es.check_date
        AND a.horario = es.slot_start_time
        AND a.status NOT IN ('cancelado', 'rejeitado')
    )
  )
  SELECT 
    fs.prof_id,
    fs.display_name,
    fs.profissao,
    fs.preco_consulta,
    fs.foto_perfil_url,
    fs.resumo_profissional,
    fs.servicos_raw,
    fs.ativo,
    fs.ordem_destaque,
    fs.day,
    fs.start_time,
    fs.end_time,
    fs.time_slot,
    jsonb_agg(
      jsonb_build_object(
        'date', fs.check_date,
        'slot_start', fs.slot_start_time,
        'slot_end', fs.slot_end_time
      ) ORDER BY fs.check_date, fs.slot_start_time
    ) as available_dates
  FROM filtered_slots fs
  GROUP BY 
    fs.prof_id, fs.display_name, fs.profissao, fs.preco_consulta,
    fs.foto_perfil_url, fs.resumo_profissional, fs.servicos_raw,
    fs.ativo, fs.ordem_destaque, fs.day, fs.start_time, 
    fs.end_time, fs.time_slot
  ORDER BY fs.ordem_destaque NULLS LAST, fs.display_name;
END;
$$;

-- Conceder permissões
GRANT EXECUTE ON FUNCTION get_professionals_with_filtered_availability TO authenticated, anon;

COMMENT ON FUNCTION get_professionals_with_filtered_availability IS 
'Retorna profissionais com horários disponíveis já filtrados, removendo:
- Horários com unavailability configurada
- Horários com eventos do Google Calendar (is_busy)
- Horários com agendamentos existentes
Parâmetros:
- p_date_start: data inicial (padrão: hoje)
- p_date_end: data final (padrão: hoje + 30 dias)
- p_tenant_id: filtrar por tenant específico (opcional)';