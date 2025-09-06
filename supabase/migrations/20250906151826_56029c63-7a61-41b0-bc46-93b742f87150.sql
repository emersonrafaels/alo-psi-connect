-- Fix security definer views by recreating them without SECURITY DEFINER
-- These views don't need SECURITY DEFINER as they only access public data

DROP VIEW IF EXISTS public.vw_disponibilidades;
DROP VIEW IF EXISTS public.vw_profissionais_sessoes;

-- Recreate vw_profissionais_sessoes without SECURITY DEFINER
CREATE VIEW public.vw_profissionais_sessoes AS
SELECT 
    s.id,
    s.session_id,
    s.user_id,
    s.clinic_id,
    s.day,
    s.start_time,
    s.end_time,
    s.time_slot,
    s.minutos_janela,
    to_char((s.start_time)::interval, 'HH24:MI'::text) AS inicio_fmt,
    to_char((s.end_time)::interval, 'HH24:MI'::text) AS fim_fmt
FROM profissionais_sessoes s;

-- Recreate vw_disponibilidades without SECURITY DEFINER
CREATE VIEW public.vw_disponibilidades AS
SELECT 
    s.id AS sessao_id,
    p.user_id,
    COALESCE(p.display_name, ''::text) AS profissional,
    lower(COALESCE(p.profissao, ''::text)) AS profissao,
    COALESCE(p.user_email, ''::text) AS profissional_email,
    COALESCE(p.telefone, ''::text) AS profissional_telefone,
    p.ativo AS profissional_ativo,
    s.clinic_id,
    s.day AS dia,
    s.start_time,
    s.end_time,
    s.time_slot,
    s.minutos_janela
FROM profissionais p
JOIN profissionais_sessoes s ON (s.user_id = p.user_id)
WHERE COALESCE(p.ativo, false) = true;