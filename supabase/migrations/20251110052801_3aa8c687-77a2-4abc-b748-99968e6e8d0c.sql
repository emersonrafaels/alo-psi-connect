-- Drop existing function
DROP FUNCTION IF EXISTS get_professionals_with_filtered_availability(DATE, DATE, UUID);

-- Create complete function with all 34 fields from profissionais table
CREATE OR REPLACE FUNCTION get_professionals_with_filtered_availability(
  p_date_start DATE DEFAULT CURRENT_DATE,
  p_date_end DATE DEFAULT CURRENT_DATE + INTERVAL '30 days',
  p_tenant_id UUID DEFAULT NULL
)
RETURNS TABLE (
  -- IDs e Identificação
  professional_id INTEGER,
  user_id INTEGER,
  user_login TEXT,
  user_email TEXT,
  profile_id UUID,
  
  -- Dados Pessoais
  display_name TEXT,
  first_name TEXT,
  last_name TEXT,
  cpf TEXT,
  
  -- Contato
  email_secundario TEXT,
  telefone TEXT,
  
  -- Informações Profissionais
  profissao TEXT,
  crp_crm TEXT,
  resumo TEXT,
  resumo_profissional TEXT,
  idiomas_raw TEXT,
  linkedin TEXT,
  possui_e_psi BOOLEAN,
  
  -- Serviços e Formação
  servicos_raw TEXT,
  servicos_normalizados TEXT[],
  formacao_raw TEXT,
  formacao_normalizada TEXT[],
  
  -- Preços e Tempo
  preco_consulta NUMERIC,
  tempo_consulta INTEGER,
  
  -- Dados Bancários
  banco TEXT,
  agencia TEXT,
  conta TEXT,
  pix TEXT,
  tipo_conta TEXT,
  
  -- Foto
  foto_perfil_url TEXT,
  foto_id INTEGER,
  
  -- Status e Destaque
  ativo BOOLEAN,
  em_destaque BOOLEAN,
  ordem_destaque INTEGER,
  
  -- Horários (vindos de profissionais_sessoes)
  day TEXT,
  start_time TIME,
  end_time TIME,
  time_slot INTEGER,
  
  -- Slots disponíveis
  available_dates JSONB
) 
LANGUAGE plpgsql
STABLE
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  WITH professional_schedules AS (
    SELECT 
      p.id as prof_id,
      -- IDs e Identificação
      p.user_id,
      p.user_login,
      p.user_email,
      p.profile_id,
      
      -- Dados Pessoais
      p.display_name,
      p.first_name,
      p.last_name,
      p.cpf,
      
      -- Contato
      p.email_secundario,
      p.telefone,
      
      -- Informações Profissionais
      p.profissao,
      p.crp_crm,
      p.resumo,
      p.resumo_profissional,
      p.idiomas_raw,
      p.linkedin,
      p.possui_e_psi,
      
      -- Serviços e Formação
      p.servicos_raw,
      p.servicos_normalizados,
      p.formacao_raw,
      p.formacao_normalizada,
      
      -- Preços e Tempo
      p.preco_consulta,
      p.tempo_consulta,
      
      -- Dados Bancários
      p.banco,
      p.agencia,
      p.conta,
      p.pix,
      p.tipo_conta,
      
      -- Foto
      p.foto_perfil_url,
      p.foto_id,
      
      -- Status e Destaque
      p.ativo,
      p.em_destaque,
      p.ordem_destaque,
      
      -- Horários
      ps.day,
      ps.start_time,
      ps.end_time,
      ps.time_slot
    FROM profissionais p
    INNER JOIN profissionais_sessoes ps ON ps.user_id = p.id
    WHERE p.ativo = true
      AND (p_tenant_id IS NULL OR p.id IN (
        SELECT pt.professional_id 
        FROM professional_tenants pt 
        WHERE pt.tenant_id = p_tenant_id
      ))
  ),
  date_series AS (
    SELECT generate_series(p_date_start, p_date_end, '1 day'::interval)::date as check_date
  ),
  expanded_slots AS (
    SELECT 
      ps.*,
      ds.check_date,
      -- Convert TIME to TIMESTAMP for generate_series, then back to TIME
      generate_series(
        ('1970-01-01'::date + ps.start_time)::timestamp,
        ('1970-01-01'::date + ps.end_time - (ps.time_slot || ' minutes')::interval)::timestamp,
        (ps.time_slot || ' minutes')::interval
      )::time as slot_start_time
    FROM professional_schedules ps
    CROSS JOIN date_series ds
    WHERE 
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
      SELECT 1 FROM google_calendar_events gce
      INNER JOIN profissionais p2 ON p2.profile_id = (
        SELECT pr.id FROM profiles pr WHERE pr.user_id = gce.user_id LIMIT 1
      )
      WHERE p2.id = es.prof_id
        AND gce.is_busy = true
        AND DATE(gce.start_time) = es.check_date
        AND gce.start_time::time <= es.slot_start_time
        AND gce.end_time::time > es.slot_start_time
    )
    AND NOT EXISTS (
      SELECT 1 FROM agendamentos a
      WHERE a.professional_id = es.prof_id
        AND a.data_consulta = es.check_date
        AND a.horario = es.slot_start_time
        AND a.status NOT IN ('cancelado', 'rejeitado')
    )
  )
  SELECT 
    fs.prof_id,
    fs.user_id,
    fs.user_login,
    fs.user_email,
    fs.profile_id,
    fs.display_name,
    fs.first_name,
    fs.last_name,
    fs.cpf,
    fs.email_secundario,
    fs.telefone,
    fs.profissao,
    fs.crp_crm,
    fs.resumo,
    fs.resumo_profissional,
    fs.idiomas_raw,
    fs.linkedin,
    fs.possui_e_psi,
    fs.servicos_raw,
    fs.servicos_normalizados,
    fs.formacao_raw,
    fs.formacao_normalizada,
    fs.preco_consulta,
    fs.tempo_consulta,
    fs.banco,
    fs.agencia,
    fs.conta,
    fs.pix,
    fs.tipo_conta,
    fs.foto_perfil_url,
    fs.foto_id,
    fs.ativo,
    fs.em_destaque,
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
    fs.prof_id, fs.user_id, fs.user_login, fs.user_email, fs.profile_id,
    fs.display_name, fs.first_name, fs.last_name, fs.cpf,
    fs.email_secundario, fs.telefone, fs.profissao, fs.crp_crm,
    fs.resumo, fs.resumo_profissional, fs.idiomas_raw, fs.linkedin,
    fs.possui_e_psi, fs.servicos_raw, fs.servicos_normalizados,
    fs.formacao_raw, fs.formacao_normalizada, fs.preco_consulta,
    fs.tempo_consulta, fs.banco, fs.agencia, fs.conta, fs.pix,
    fs.tipo_conta, fs.foto_perfil_url, fs.foto_id, fs.ativo,
    fs.em_destaque, fs.ordem_destaque, fs.day, fs.start_time,
    fs.end_time, fs.time_slot
  ORDER BY fs.ordem_destaque NULLS LAST, fs.display_name;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_professionals_with_filtered_availability TO authenticated, anon;

-- Add documentation
COMMENT ON FUNCTION get_professionals_with_filtered_availability IS 
'Retorna profissionais com TODOS os campos da tabela profissionais (34 campos) + horários disponíveis já filtrados.
Remove automaticamente:
- Horários com unavailability configurada
- Horários com eventos do Google Calendar (is_busy)
- Horários com agendamentos existentes
Parâmetros:
- p_date_start: data inicial (padrão: hoje)
- p_date_end: data final (padrão: hoje + 30 dias)
- p_tenant_id: filtrar por tenant específico (opcional)';