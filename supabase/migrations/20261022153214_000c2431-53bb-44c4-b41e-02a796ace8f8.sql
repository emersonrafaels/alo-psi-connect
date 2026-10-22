CREATE TABLE public.triage_critical_terms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  term text NOT NULL,
  severity text NOT NULL DEFAULT 'moderate',
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT triage_critical_terms_severity_chk CHECK (severity IN ('grave','moderate')),
  CONSTRAINT triage_critical_terms_term_uniq UNIQUE (term)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.triage_critical_terms TO authenticated;
GRANT ALL ON public.triage_critical_terms TO service_role;
ALTER TABLE public.triage_critical_terms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Platform admins manage critical terms" ON public.triage_critical_terms
  FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE TRIGGER trg_triage_critical_terms_updated BEFORE UPDATE ON public.triage_critical_terms
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.triage_critical_terms (term, severity) VALUES
('suicídio','grave'),('me matar','grave'),('quero morrer','grave'),('tirar minha vida','grave'),('não aguento mais viver','grave'),('me cortar','grave'),('automutilação','grave'),('acabar com tudo','grave'),('sem razão para viver','grave'),
('morte','moderate'),('morrer','moderate'),('desesperado','moderate'),('sem saída','moderate'),('sozinho no mundo','moderate'),('ninguém se importa','moderate'),('inútil','moderate'),('vazio','moderate'),('não aguento mais','moderate'),('crise de pânico','moderate')
ON CONFLICT (term) DO NOTHING;

CREATE OR REPLACE FUNCTION public.normalize_pt_text(t text) RETURNS text
LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT translate(lower(coalesce(t,'')), 'áàâãäéèêëíìîïóòôõöúùûüçñ', 'aaaaaeeeeiiiiooooouuuucn')
$$;

CREATE OR REPLACE FUNCTION public.get_institution_critical_flags(p_institution_id uuid, p_since date)
RETURNS TABLE(patient_id uuid, max_severity text, hits integer, last_date date)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT (public.is_admin(auth.uid()) OR public.user_has_institution_access(auth.uid(), p_institution_id)) THEN
    RAISE EXCEPTION 'access denied';
  END IF;
  RETURN QUERY
  WITH terms AS (
    SELECT severity, '(^|[^a-z0-9])' || regexp_replace(public.normalize_pt_text(term), '([.*+?^${}()|\[\]\\])', '\\\1', 'g') || '($|[^a-z0-9])' AS rx
    FROM triage_critical_terms WHERE is_active
  ), st AS (
    SELECT pi.patient_id, pa.profile_id FROM patient_institutions pi JOIN pacientes pa ON pa.id = pi.patient_id
    WHERE pi.institution_id = p_institution_id AND pa.profile_id IS NOT NULL
  ), m AS (
    SELECT st.patient_id, me.date, public.normalize_pt_text(me.journal_text) txt
    FROM mood_entries me JOIN st ON st.profile_id = me.profile_id
    WHERE me.date >= p_since AND me.journal_text IS NOT NULL AND me.journal_text <> ''
  ), hit AS (
    SELECT m.patient_id, m.date, max(CASE WHEN t.severity='grave' THEN 2 ELSE 1 END) sev
    FROM m JOIN terms t ON m.txt ~ t.rx GROUP BY m.patient_id, m.date
  )
  SELECT h.patient_id, CASE WHEN max(h.sev)=2 THEN 'grave' ELSE 'moderate' END, count(*)::int, max(h.date)
  FROM hit h GROUP BY h.patient_id;
END $$;
REVOKE ALL ON FUNCTION public.get_institution_critical_flags(uuid, date) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.get_institution_critical_flags(uuid, date) TO authenticated;