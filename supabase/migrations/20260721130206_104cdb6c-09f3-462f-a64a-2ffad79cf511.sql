
-- Enum de status
DO $$ BEGIN
  CREATE TYPE public.radar_status AS ENUM ('draft', 'submitted', 'archived');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Tabela principal
CREATE TABLE public.institution_radar_diagnostics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  institution_id UUID NOT NULL REFERENCES public.educational_institutions(id) ON DELETE CASCADE,
  version INTEGER NOT NULL DEFAULT 1,
  status public.radar_status NOT NULL DEFAULT 'draft',

  respondent_name TEXT,
  respondent_role TEXT,
  respondent_area TEXT,
  respondent_email TEXT,
  respondent_phone TEXT,

  institution_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  structures JSONB NOT NULL DEFAULT '{}'::jsonb,
  pains JSONB NOT NULL DEFAULT '[]'::jsonb,
  adaptive_answers JSONB NOT NULL DEFAULT '{}'::jsonb,
  maturity JSONB NOT NULL DEFAULT '{}'::jsonb,
  priorities JSONB NOT NULL DEFAULT '{}'::jsonb,

  overall_score NUMERIC(5,2),
  headline TEXT,
  strategic_reading JSONB,
  recommendations JSONB,

  consent_given BOOLEAN NOT NULL DEFAULT false,
  filled_by_user_id UUID,
  submitted_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_radar_institution ON public.institution_radar_diagnostics(institution_id);
CREATE INDEX idx_radar_status ON public.institution_radar_diagnostics(status);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.institution_radar_diagnostics TO authenticated;
GRANT ALL ON public.institution_radar_diagnostics TO service_role;

ALTER TABLE public.institution_radar_diagnostics ENABLE ROW LEVEL SECURITY;

-- Admins acesso total
CREATE POLICY "Admins full access radar"
ON public.institution_radar_diagnostics FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Gestores institucionais leem/escrevem apenas a própria instituição
CREATE POLICY "Institution users view own radar"
ON public.institution_radar_diagnostics FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.institution_users iu
    WHERE iu.institution_id = institution_radar_diagnostics.institution_id
      AND iu.user_id = auth.uid()
  )
);

CREATE POLICY "Institution users insert own radar"
ON public.institution_radar_diagnostics FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.institution_users iu
    WHERE iu.institution_id = institution_radar_diagnostics.institution_id
      AND iu.user_id = auth.uid()
  )
);

CREATE POLICY "Institution users update own radar"
ON public.institution_radar_diagnostics FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.institution_users iu
    WHERE iu.institution_id = institution_radar_diagnostics.institution_id
      AND iu.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.institution_users iu
    WHERE iu.institution_id = institution_radar_diagnostics.institution_id
      AND iu.user_id = auth.uid()
  )
);

-- Trigger updated_at (função pública já existe no projeto)
CREATE TRIGGER update_radar_diagnostics_updated_at
BEFORE UPDATE ON public.institution_radar_diagnostics
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
