-- Remove SECURITY DEFINER from views that don't need it
DROP VIEW IF EXISTS public.vw_disponibilidades;
DROP VIEW IF EXISTS public.vw_profissionais_sessoes;

-- Recreate views without SECURITY DEFINER
CREATE VIEW public.vw_disponibilidades AS
SELECT 
  ps.time_slot,
  p.profissao,
  p.display_name as profissional,
  ps.end_time,
  ps.minutos_janela,
  ps.start_time,
  ps.clinic_id,
  p.ativo as profissional_ativo,
  ps.user_id,
  ps.id as sessao_id,
  p.telefone as profissional_telefone,
  ps.day as dia,
  p.user_email as profissional_email
FROM profissionais_sessoes ps
JOIN profissionais p ON ps.user_id = p.user_id
WHERE p.ativo = true;

CREATE VIEW public.vw_profissionais_sessoes AS
SELECT 
  ps.start_time,
  ps.day,
  ps.end_time,
  TO_CHAR(ps.end_time, 'HH24:MI') as fim_fmt,
  ps.id,
  TO_CHAR(ps.start_time, 'HH24:MI') as inicio_fmt,
  ps.time_slot,
  ps.session_id,
  ps.clinic_id,
  ps.minutos_janela,
  ps.user_id
FROM profissionais_sessoes ps;