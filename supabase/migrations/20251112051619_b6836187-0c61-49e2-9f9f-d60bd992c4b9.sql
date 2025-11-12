-- Drop existing function
DROP FUNCTION IF EXISTS public.get_professionals_with_filtered_availability(date, date, uuid);

-- Create improved function that returns ONE row per professional
CREATE OR REPLACE FUNCTION public.get_professionals_with_filtered_availability(
  p_date_start date DEFAULT CURRENT_DATE,
  p_date_end date DEFAULT (CURRENT_DATE + '30 days'::interval),
  p_tenant_id uuid DEFAULT NULL
)
RETURNS TABLE(
  -- IDs and identification
  professional_id bigint,
  user_id integer,
  user_login text,
  user_email text,
  profile_id uuid,
  
  -- Personal data
  display_name text,
  first_name text,
  last_name text,
  
  -- Contact
  email_secundario text,
  telefone text,
  
  -- Professional information
  profissao text,
  crp_crm text,
  resumo text,
  resumo_profissional text,
  idiomas_raw text,
  linkedin text,
  possui_e_psi boolean,
  
  -- Services and training (normalized only)
  servicos_normalizados text[],
  formacao_normalizada text[],
  
  -- Pricing
  preco_consulta numeric,
  
  -- Status and featured
  ativo boolean,
  em_destaque boolean,
  ordem_destaque integer,
  
  -- Demographic data
  genero text,
  data_nascimento date,
  raca text,
  sexualidade text,
  como_conheceu text,
  
  -- Relationships
  institutions jsonb,
  tenant_info jsonb,
  
  -- Available time slots (aggregated)
  available_dates jsonb,
  schedule_summary jsonb,
  
  -- Statistics
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
      p.user_id,
      p.user_login,
      p.user_email,
      p.profile_id,
      p.display_name,
      p.first_name,
      p.last_name,
      p.email_secundario,
      p.telefone,
      p.profissao,
      p.crp_crm,
      p.resumo,
      p.resumo_profissional,
      p.idiomas_raw,
      p.linkedin,
      p.possui_e_psi,
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
  ),
  professional_institutions_agg AS (
    SELECT 
      pi.professional_id,
      jsonb_agg(
        jsonb_build_object(
          'id', ei.id,
          'name', ei.name,
          'type', ei.type,
          'relationship_type', pi.relationship_type,
          'is_active', pi.is_active,
          'start_date', pi.start_date,
          'end_date', pi.end_date
        ) ORDER BY pi.is_active DESC, ei.name
      ) as institutions
    FROM professional_institutions pi
    JOIN educational_institutions ei ON ei.id = pi.institution_id
    GROUP BY pi.professional_id
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
  schedule_summary_agg AS (
    SELECT 
      prof_id,
      jsonb_agg(DISTINCT
        jsonb_build_object(
          'day', day,
          'start_time', start_time,
          'end_time', end_time,
          'slot_duration', time_slot
        ) ORDER BY jsonb_build_object(
          'day', day,
          'start_time', start_time,
          'end_time', end_time,
          'slot_duration', time_slot
        )
      ) as schedule_summary
    FROM filtered_slots
    GROUP BY prof_id
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
    fs.user_id,
    fs.user_login,
    fs.user_email,
    fs.profile_id,
    fs.display_name,
    fs.first_name,
    fs.last_name,
    fs.email_secundario,
    fs.telefone,
    fs.profissao,
    fs.crp_crm,
    fs.resumo,
    fs.resumo_profissional,
    fs.idiomas_raw,
    fs.linkedin,
    fs.possui_e_psi,
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
    prof.como_conheceu,
    COALESCE(pia.institutions, '[]'::jsonb) as institutions,
    pti.tenant_info,
    jsonb_agg(
      jsonb_build_object(
        'date', fs.check_date,
        'day_of_week', TO_CHAR(fs.check_date, 'Day'),
        'slot_start', fs.slot_start_time,
        'slot_end', fs.slot_end_time,
        'duration_minutes', fs.time_slot
      ) ORDER BY fs.check_date, fs.slot_start_time
    ) as available_dates,
    ssa.schedule_summary,
    COUNT(*)::bigint as total_slots_available,
    COUNT(DISTINCT fs.check_date)::bigint as days_available,
    MIN(fs.check_date) as next_available_date,
    MAX(fs.check_date) as last_available_date,
    spd.slots_per_day
  FROM filtered_slots fs
  LEFT JOIN profiles prof ON prof.id = fs.profile_id
  LEFT JOIN professional_institutions_agg pia ON pia.professional_id = fs.prof_id
  LEFT JOIN professional_tenant_info pti ON pti.professional_id = fs.prof_id
  LEFT JOIN schedule_summary_agg ssa ON ssa.prof_id = fs.prof_id
  LEFT JOIN slots_per_day_agg spd ON spd.prof_id = fs.prof_id
  GROUP BY 
    fs.prof_id, fs.user_id, fs.user_login, fs.user_email, fs.profile_id,
    fs.display_name, fs.first_name, fs.last_name,
    fs.email_secundario, fs.telefone, fs.profissao, fs.crp_crm,
    fs.resumo, fs.resumo_profissional, fs.idiomas_raw, fs.linkedin,
    fs.possui_e_psi, fs.servicos_normalizados, fs.formacao_normalizada, 
    fs.preco_consulta, fs.ativo, fs.em_destaque, fs.ordem_destaque, 
    prof.genero, prof.data_nascimento, prof.raca, 
    prof.sexualidade, prof.como_conheceu,
    pia.institutions, pti.tenant_info, ssa.schedule_summary, spd.slots_per_day
  ORDER BY fs.ordem_destaque NULLS LAST, fs.display_name;
END;
$function$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.get_professionals_with_filtered_availability TO authenticated, anon;

-- Add comment
COMMENT ON FUNCTION public.get_professionals_with_filtered_availability IS 
'Returns ONE row per professional with all available time slots in JSONB format. 
Filters out unavailability blocks, Google Calendar busy times, and existing appointments.
Excludes sensitive data (CPF, banking info, raw serialized fields).
Returns enriched availability data with statistics and schedule summaries.';