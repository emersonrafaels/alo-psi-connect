-- ============================================
-- 1. CORRIGIR FUNÇÃO DE PARSING DE SERVIÇOS
-- ============================================
-- Atualizar parse_php_serialized_array para aceitar:
-- - Formato PHP serializado: a:3:{i:0;s:10:"Ansiedade";...}
-- - Formato CSV: "Ansiedade, Depressão, TOC"

CREATE OR REPLACE FUNCTION public.parse_php_serialized_array(php_data text)
RETURNS text[]
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
DECLARE
    result text[] := '{}';
    item_pattern text;
    item_value text;
BEGIN
    -- Se o dado for nulo ou vazio, retorna array vazio
    IF php_data IS NULL OR php_data = '' THEN
        RETURN result;
    END IF;
    
    -- Verificar se é formato PHP serializado (começa com "a:")
    IF php_data ~* '^a:\d+:' THEN
        -- Pattern para extrair valores de strings PHP serializadas
        -- Busca por s:N:"valor" onde N é o tamanho da string
        item_pattern := 's:\d+:"([^"]*)"';
        
        -- Extrai todos os valores usando regex
        FOR item_value IN 
            SELECT regexp_replace(match[1], E'\\\\(.)', E'\\1', 'g')
            FROM (
                SELECT regexp_matches(php_data, item_pattern, 'g') as match
            ) matches
        LOOP
            result := array_append(result, item_value);
        END LOOP;
    ELSE
        -- Formato CSV: dividir por vírgula e limpar espaços
        SELECT array_agg(trim(unnest))
        INTO result
        FROM unnest(string_to_array(php_data, ','));
        
        -- Remover valores vazios
        result := array_remove(result, '');
        result := array_remove(result, NULL);
    END IF;
    
    RETURN result;
END;
$function$;

-- ============================================
-- 2. RE-POPULAR SERVICOS_NORMALIZADOS
-- ============================================
-- Atualizar todos os profissionais ativos com a nova lógica

UPDATE profissionais 
SET servicos_normalizados = normalize_specialties(
    parse_php_serialized_array(servicos_raw)
)
WHERE servicos_raw IS NOT NULL 
  AND servicos_raw != ''
  AND ativo = true;

-- ============================================
-- 3. RECRIAR RPC MINIMAL MEDCOS COM FILTRO DE TIMEZONE
-- ============================================

CREATE OR REPLACE FUNCTION public.get_professionals_with_filtered_availability_minimal_medcos(
  p_date_start date DEFAULT CURRENT_DATE, 
  p_date_end date DEFAULT (CURRENT_DATE + '30 days'::interval)
)
RETURNS TABLE(
  professional_id bigint, 
  profile_id uuid, 
  display_name text, 
  profissao text, 
  crp_crm text, 
  servicos_normalizados text[], 
  formacao_normalizada text[], 
  preco_consulta numeric, 
  ativo boolean, 
  em_destaque boolean, 
  ordem_destaque integer, 
  genero text, 
  data_nascimento date, 
  raca text, 
  sexualidade text, 
  tenant_info jsonb, 
  total_slots_available bigint, 
  days_available bigint, 
  next_available_date date, 
  last_available_date date, 
  slots_per_day jsonb
)
LANGUAGE plpgsql
STABLE
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  WITH professional_schedules AS (
    SELECT 
      p.id as prof_id,
      p.profile_id,
      p.display_name,
      p.profissao,
      p.crp_crm,
      p.servicos_normalizados,
      p.formacao_normalizada,
      p.preco_consulta,
      p.ativo,
      p.em_destaque,
      p.ordem_destaque,
      ps.day,
      ps.start_time,
      ps.end_time,
      ps.time_slot
    FROM profissionais p
    INNER JOIN profissionais_sessoes ps ON ps.user_id = p.user_id
    WHERE p.ativo = true
      AND p.id IN (
        SELECT pt.professional_id 
        FROM professional_tenants pt 
        WHERE pt.tenant_id = '3a9ae5ec-50a9-4674-b808-7735e5f0afb5'::uuid
      )
  ),
  date_series AS (
    SELECT generate_series(p_date_start, p_date_end, '1 day'::interval)::date as check_date
  ),
  expanded_slots AS (
    SELECT 
      ps.*,
      ds.check_date,
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
    -- NOVO FILTRO: Apenas horários futuros (considerando timezone Brasil)
    AND (
      es.check_date > CURRENT_DATE 
      OR (
        es.check_date = CURRENT_DATE 
        AND (es.check_date + es.slot_start_time) > (NOW() AT TIME ZONE 'America/Sao_Paulo')
      )
    )
  ),
  professional_tenant_info AS (
    SELECT 
      pt.professional_id,
      jsonb_build_object(
        'tenant_id', t.id,
        'tenant_name', t.name,
        'tenant_slug', t.slug,
        'is_featured', pt.is_featured,
        'featured_order', pt.featured_order
      ) as tenant_info
    FROM professional_tenants pt
    JOIN tenants t ON t.id = pt.tenant_id
    WHERE pt.tenant_id = '3a9ae5ec-50a9-4674-b808-7735e5f0afb5'::uuid
  ),
  slots_per_day_agg AS (
    SELECT 
      prof_id,
      jsonb_object_agg(
        TO_CHAR(check_date, 'YYYY-MM-DD'),
        slot_count
      ) as slots_per_day
    FROM (
      SELECT 
        prof_id,
        check_date,
        COUNT(*)::integer as slot_count
      FROM filtered_slots
      GROUP BY prof_id, check_date
    ) daily_counts
    GROUP BY prof_id
  )
  SELECT 
    fs.prof_id,
    fs.profile_id,
    fs.display_name,
    fs.profissao,
    fs.crp_crm,
    fs.servicos_normalizados,
    fs.formacao_normalizada,
    fs.preco_consulta,
    fs.ativo,
    fs.em_destaque,
    fs.ordem_destaque,
    prof.genero,
    prof.data_nascimento,
    prof.raca,
    prof.sexualidade,
    pti.tenant_info,
    COUNT(*)::bigint as total_slots_available,
    COUNT(DISTINCT fs.check_date)::bigint as days_available,
    MIN(fs.check_date) as next_available_date,
    MAX(fs.check_date) as last_available_date,
    spd.slots_per_day
  FROM filtered_slots fs
  LEFT JOIN profiles prof ON prof.id = fs.profile_id
  LEFT JOIN professional_tenant_info pti ON pti.professional_id = fs.prof_id
  LEFT JOIN slots_per_day_agg spd ON spd.prof_id = fs.prof_id
  GROUP BY 
    fs.prof_id, fs.profile_id, fs.display_name, fs.profissao, fs.crp_crm,
    fs.servicos_normalizados, fs.formacao_normalizada, fs.preco_consulta, 
    fs.ativo, fs.em_destaque, fs.ordem_destaque, prof.genero, 
    prof.data_nascimento, prof.raca, prof.sexualidade, pti.tenant_info, 
    spd.slots_per_day
  ORDER BY fs.ordem_destaque NULLS LAST, fs.display_name;
END;
$function$;

-- ============================================
-- 4. RECRIAR RPC MINIMAL GENÉRICA COM FILTRO DE TIMEZONE
-- ============================================

CREATE OR REPLACE FUNCTION public.get_professionals_with_filtered_availability_minimal(
  p_date_start date DEFAULT CURRENT_DATE, 
  p_date_end date DEFAULT (CURRENT_DATE + '30 days'::interval), 
  p_tenant_id uuid DEFAULT NULL::uuid
)
RETURNS TABLE(
  professional_id bigint, 
  profile_id uuid, 
  display_name text, 
  profissao text, 
  crp_crm text, 
  servicos_normalizados text[], 
  preco_consulta numeric, 
  ativo boolean, 
  em_destaque boolean, 
  ordem_destaque integer, 
  genero text, 
  data_nascimento date, 
  raca text, 
  sexualidade text, 
  tenant_info jsonb, 
  total_slots_available bigint, 
  days_available bigint, 
  next_available_date date, 
  last_available_date date, 
  slots_per_day jsonb
)
LANGUAGE plpgsql
STABLE
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  WITH professional_schedules AS (
    SELECT 
      p.id as prof_id,
      p.profile_id,
      p.display_name,
      p.profissao,
      p.crp_crm,
      p.servicos_normalizados,
      p.preco_consulta,
      p.ativo,
      p.em_destaque,
      p.ordem_destaque,
      ps.day,
      ps.start_time,
      ps.end_time,
      ps.time_slot
    FROM profissionais p
    INNER JOIN profissionais_sessoes ps ON ps.user_id = p.user_id
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
    -- NOVO FILTRO: Apenas horários futuros (considerando timezone Brasil)
    AND (
      es.check_date > CURRENT_DATE 
      OR (
        es.check_date = CURRENT_DATE 
        AND (es.check_date + es.slot_start_time) > (NOW() AT TIME ZONE 'America/Sao_Paulo')
      )
    )
  ),
  professional_tenant_info AS (
    SELECT 
      pt.professional_id,
      jsonb_build_object(
        'tenant_id', t.id,
        'tenant_name', t.name,
        'tenant_slug', t.slug,
        'is_featured', pt.is_featured,
        'featured_order', pt.featured_order
      ) as tenant_info
    FROM professional_tenants pt
    JOIN tenants t ON t.id = pt.tenant_id
    WHERE p_tenant_id IS NULL OR pt.tenant_id = p_tenant_id
  ),
  slots_per_day_agg AS (
    SELECT 
      prof_id,
      jsonb_object_agg(
        TO_CHAR(check_date, 'YYYY-MM-DD'),
        slot_count
      ) as slots_per_day
    FROM (
      SELECT 
        prof_id,
        check_date,
        COUNT(*)::integer as slot_count
      FROM filtered_slots
      GROUP BY prof_id, check_date
    ) daily_counts
    GROUP BY prof_id
  )
  SELECT 
    fs.prof_id,
    fs.profile_id,
    fs.display_name,
    fs.profissao,
    fs.crp_crm,
    fs.servicos_normalizados,
    fs.preco_consulta,
    fs.ativo,
    fs.em_destaque,
    fs.ordem_destaque,
    prof.genero,
    prof.data_nascimento,
    prof.raca,
    prof.sexualidade,
    pti.tenant_info,
    COUNT(*)::bigint as total_slots_available,
    COUNT(DISTINCT fs.check_date)::bigint as days_available,
    MIN(fs.check_date) as next_available_date,
    MAX(fs.check_date) as last_available_date,
    spd.slots_per_day
  FROM filtered_slots fs
  LEFT JOIN profiles prof ON prof.id = fs.profile_id
  LEFT JOIN professional_tenant_info pti ON pti.professional_id = fs.prof_id
  LEFT JOIN slots_per_day_agg spd ON spd.prof_id = fs.prof_id
  GROUP BY 
    fs.prof_id, fs.profile_id, fs.display_name, fs.profissao, fs.crp_crm,
    fs.servicos_normalizados, fs.preco_consulta, fs.ativo, fs.em_destaque, 
    fs.ordem_destaque, prof.genero, prof.data_nascimento, prof.raca, 
    prof.sexualidade, pti.tenant_info, spd.slots_per_day
  ORDER BY fs.ordem_destaque NULLS LAST, fs.display_name;
END;
$function$;