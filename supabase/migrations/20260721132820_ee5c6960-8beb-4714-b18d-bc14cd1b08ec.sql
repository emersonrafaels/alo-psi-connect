
-- 1) Colunas novas
ALTER TABLE public.institution_radar_diagnostics
  ALTER COLUMN institution_id DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS submission_source text NOT NULL DEFAULT 'authenticated',
  ADD COLUMN IF NOT EXISTS public_access_token uuid,
  ADD COLUMN IF NOT EXISTS submitted_institution_name text,
  ADD COLUMN IF NOT EXISTS submitted_institution_type text,
  ADD COLUMN IF NOT EXISTS submitted_institution_city text,
  ADD COLUMN IF NOT EXISTS submitted_institution_state text,
  ADD COLUMN IF NOT EXISTS submitted_institution_website text;

ALTER TABLE public.institution_radar_diagnostics
  DROP CONSTRAINT IF EXISTS institution_radar_diagnostics_submission_source_check;
ALTER TABLE public.institution_radar_diagnostics
  ADD CONSTRAINT institution_radar_diagnostics_submission_source_check
  CHECK (submission_source IN ('authenticated', 'public'));

CREATE UNIQUE INDEX IF NOT EXISTS institution_radar_diagnostics_public_token_key
  ON public.institution_radar_diagnostics (public_access_token)
  WHERE public_access_token IS NOT NULL;

-- 2) Função pública para consulta por token (SECURITY DEFINER, bypassa RLS)
CREATE OR REPLACE FUNCTION public.get_radar_by_public_token(_token uuid)
RETURNS SETOF public.institution_radar_diagnostics
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT *
  FROM public.institution_radar_diagnostics
  WHERE public_access_token = _token
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_radar_by_public_token(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_radar_by_public_token(uuid) TO anon, authenticated;
