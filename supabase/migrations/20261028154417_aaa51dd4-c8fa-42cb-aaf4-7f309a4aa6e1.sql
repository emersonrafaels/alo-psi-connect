CREATE TABLE public.care_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES public.pacientes(id) ON DELETE CASCADE,
  institution_id uuid NOT NULL REFERENCES public.educational_institutions(id) ON DELETE CASCADE,
  origin text NOT NULL DEFAULT 'apoio',
  destination text,
  outcome text NOT NULL DEFAULT 'em_andamento',
  requested_at timestamptz NOT NULL DEFAULT now(),
  triaged_at timestamptz,
  referred_at timestamptz,
  contacted_at timestamptz,
  first_consult_at timestamptz,
  followup_at timestamptz,
  is_synthetic boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX care_requests_inst_idx ON public.care_requests(institution_id, requested_at);
CREATE INDEX care_requests_patient_idx ON public.care_requests(patient_id);
GRANT SELECT, INSERT, UPDATE ON public.care_requests TO authenticated;
GRANT ALL ON public.care_requests TO service_role;
ALTER TABLE public.care_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Student reads own care requests" ON public.care_requests FOR SELECT TO authenticated
  USING (patient_id IN (SELECT pa.id FROM pacientes pa JOIN profiles pr ON pr.id = pa.profile_id WHERE pr.user_id = auth.uid()));
CREATE POLICY "Institution team reads care requests" ON public.care_requests FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()) OR public.user_belongs_to_institution(auth.uid(), institution_id));
CREATE POLICY "Institution team updates care requests" ON public.care_requests FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid()) OR public.user_belongs_to_institution(auth.uid(), institution_id))
  WITH CHECK (public.is_admin(auth.uid()) OR public.user_belongs_to_institution(auth.uid(), institution_id));
CREATE POLICY "Institution team creates care requests" ON public.care_requests FOR INSERT TO authenticated
  WITH CHECK (public.is_admin(auth.uid()) OR public.user_belongs_to_institution(auth.uid(), institution_id));

CREATE OR REPLACE FUNCTION public.validate_care_request() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.origin NOT IN ('buddy','apoio','diario','conteudo','nucleo') THEN RAISE EXCEPTION 'invalid origin'; END IF;
  IF NEW.destination IS NOT NULL AND NEW.destination NOT IN ('psicologia','nucleo','psiquiatria','mentoria','externo') THEN RAISE EXCEPTION 'invalid destination'; END IF;
  IF NEW.outcome NOT IN ('consulta','em_andamento','sem_retorno','outro_recurso') THEN RAISE EXCEPTION 'invalid outcome'; END IF;
  IF NEW.first_consult_at IS NOT NULL AND NEW.outcome = 'em_andamento' THEN NEW.outcome := 'consulta'; END IF;
  NEW.updated_at := now();
  RETURN NEW;
END $$;
CREATE TRIGGER care_requests_validate BEFORE INSERT OR UPDATE ON public.care_requests FOR EACH ROW EXECUTE FUNCTION public.validate_care_request();

-- Student opens a request (one open request per institution is reused)
CREATE OR REPLACE FUNCTION public.open_care_request(p_origin text) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_patient uuid; v_inst uuid; v_id uuid;
BEGIN
  SELECT pa.id, pi.institution_id INTO v_patient, v_inst
  FROM pacientes pa JOIN profiles pr ON pr.id = pa.profile_id
  JOIN patient_institutions pi ON pi.patient_id = pa.id
  WHERE pr.user_id = auth.uid() ORDER BY pi.created_at DESC LIMIT 1;
  IF v_patient IS NULL THEN RETURN NULL; END IF;
  SELECT id INTO v_id FROM care_requests WHERE patient_id = v_patient AND institution_id = v_inst
    AND outcome = 'em_andamento' AND requested_at > now() - interval '30 days' ORDER BY requested_at DESC LIMIT 1;
  IF v_id IS NOT NULL THEN RETURN v_id; END IF;
  INSERT INTO care_requests(patient_id, institution_id, origin) VALUES (v_patient, v_inst, coalesce(p_origin,'apoio')) RETURNING id INTO v_id;
  RETURN v_id;
END $$;
REVOKE ALL ON FUNCTION public.open_care_request(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.open_care_request(text) TO authenticated;

-- Triage resolved -> mark triage stage
CREATE OR REPLACE FUNCTION public.care_request_on_triage() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM 'pending' THEN
    UPDATE care_requests SET triaged_at = coalesce(triaged_at, now())
    WHERE patient_id = NEW.patient_id AND institution_id = NEW.institution_id AND triaged_at IS NULL AND outcome = 'em_andamento';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER student_triage_care_request AFTER INSERT OR UPDATE OF status ON public.student_triage FOR EACH ROW EXECUTE FUNCTION public.care_request_on_triage();

-- Paid appointment -> first consult
CREATE OR REPLACE FUNCTION public.care_request_on_paid() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.payment_status = 'paid' AND (TG_OP = 'INSERT' OR OLD.payment_status IS DISTINCT FROM 'paid') AND NEW.user_id IS NOT NULL THEN
    UPDATE care_requests c SET first_consult_at = coalesce(c.first_consult_at, (NEW.data_consulta + coalesce(NEW.horario, '00:00'))::timestamptz), outcome = 'consulta'
    WHERE c.first_consult_at IS NULL AND c.patient_id IN (
      SELECT pa.id FROM pacientes pa JOIN profiles pr ON pr.id = pa.profile_id WHERE pr.user_id = NEW.user_id);
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER agendamentos_care_request AFTER INSERT OR UPDATE OF payment_status ON public.agendamentos FOR EACH ROW EXECUTE FUNCTION public.care_request_on_paid();

-- Aggregates for the Jornada de cuidado page
CREATE OR REPLACE FUNCTION public.get_institution_care_journey(p_institution_id uuid) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE result jsonb;
BEGIN
  IF NOT (public.is_admin(auth.uid()) OR public.user_has_institution_access(auth.uid(), p_institution_id)) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  WITH studs AS (
    SELECT pi.patient_id, pa.profile_id, pr.user_id,
      coalesce((WITH RECURSIVE up AS (
        SELECT id, parent_id, level, name FROM institution_academic_units WHERE id = pl.class_unit_id
        UNION ALL SELECT u.id, u.parent_id, u.level, u.name FROM institution_academic_units u JOIN up ON u.id = up.parent_id
      ) SELECT name FROM up WHERE level = 'unit' LIMIT 1), 'Sem unidade') unit
    FROM patient_institutions pi JOIN pacientes pa ON pa.id = pi.patient_id
    LEFT JOIN profiles pr ON pr.id = pa.profile_id
    LEFT JOIN patient_institution_placements pl ON pl.patient_id = pi.patient_id AND pl.institution_id = p_institution_id
    WHERE pi.institution_id = p_institution_id
  ), semf AS (SELECT 1),
  req AS (
    SELECT s.unit, c.*, extract(year from c.requested_at)::int || '.' || CASE WHEN extract(month from c.requested_at) <= 6 THEN 1 ELSE 2 END sem
    FROM care_requests c JOIN studs s ON s.patient_id = c.patient_id WHERE c.institution_id = p_institution_id
  ), ok AS (
    SELECT sem, unit FROM req GROUP BY sem, unit HAVING count(*) >= 10
  ), flows AS (
    SELECT r.sem, r.unit, r.origin, coalesce(r.destination,'none') destination, r.outcome,
      (CASE WHEN followup_at IS NOT NULL THEN 6 WHEN first_consult_at IS NOT NULL THEN 5 WHEN contacted_at IS NOT NULL THEN 4
            WHEN referred_at IS NOT NULL THEN 3 WHEN triaged_at IS NOT NULL THEN 2 ELSE 1 END) stage, count(*) n
    FROM req r JOIN ok USING (sem, unit) GROUP BY 1,2,3,4,5,6
  ), waits AS (
    SELECT r.sem, r.unit,
      percentile_cont(0.5) WITHIN GROUP (ORDER BY extract(epoch from triaged_at - requested_at)/86400) w1,
      percentile_cont(0.5) WITHIN GROUP (ORDER BY extract(epoch from referred_at - triaged_at)/86400) w2,
      percentile_cont(0.5) WITHIN GROUP (ORDER BY extract(epoch from contacted_at - referred_at)/86400) w3,
      percentile_cont(0.5) WITHIN GROUP (ORDER BY extract(epoch from first_consult_at - contacted_at)/86400) w4,
      percentile_cont(0.5) WITHIN GROUP (ORDER BY extract(epoch from first_consult_at - requested_at)/86400) total
    FROM req r JOIN ok USING (sem, unit) GROUP BY 1,2
  ), acolher AS (
    SELECT sem, unit, count(DISTINCT patient_id) n FROM (
      SELECT extract(year from m.date)::int || '.' || CASE WHEN extract(month from m.date) <= 6 THEN 1 ELSE 2 END sem, s.unit, s.patient_id
      FROM mood_entries m JOIN studs s ON s.profile_id = m.profile_id
      UNION ALL
      SELECT extract(year from p.created_at)::int || '.' || CASE WHEN extract(month from p.created_at) <= 6 THEN 1 ELSE 2 END, s.unit, s.patient_id
      FROM praticas_checkouts p JOIN studs s ON s.user_id = p.user_id
      UNION ALL
      SELECT extract(year from j.created_at)::int || '.' || CASE WHEN extract(month from j.created_at) <= 6 THEN 1 ELSE 2 END, s.unit, s.patient_id
      FROM journey_sessions j JOIN studs s ON s.user_id = j.user_id
    ) x GROUP BY 1,2 HAVING count(DISTINCT patient_id) >= 10
  ), mapear AS (
    SELECT sem, unit, count(DISTINCT patient_id) n FROM (
      SELECT extract(year from r.taken_at)::int || '.' || CASE WHEN extract(month from r.taken_at) <= 6 THEN 1 ELSE 2 END sem, s.unit, s.patient_id
      FROM emotional_scale_responses r JOIN studs s ON s.user_id = r.user_id
      UNION ALL
      SELECT extract(year from d.taken_at)::int || '.' || CASE WHEN extract(month from d.taken_at) <= 6 THEN 1 ELSE 2 END, s.unit, s.patient_id
      FROM institution_demo_scale_responses d JOIN studs s ON s.patient_id = d.patient_id WHERE d.institution_id = p_institution_id
    ) x GROUP BY 1,2 HAVING count(DISTINCT patient_id) >= 10
  )
  SELECT jsonb_build_object(
    'population', (SELECT count(*) FROM studs),
    'units_population', (SELECT coalesce(jsonb_object_agg(unit, c), '{}') FROM (SELECT unit, count(*) c FROM studs GROUP BY unit) u),
    'flows', (SELECT coalesce(jsonb_agg(to_jsonb(f)), '[]') FROM flows f),
    'waits', (SELECT coalesce(jsonb_agg(to_jsonb(w)), '[]') FROM waits w),
    'acolher', (SELECT coalesce(jsonb_agg(to_jsonb(a)), '[]') FROM acolher a),
    'mapear', (SELECT coalesce(jsonb_agg(to_jsonb(m)), '[]') FROM mapear m)
  ) INTO result;
  RETURN result;
END $$;
REVOKE ALL ON FUNCTION public.get_institution_care_journey(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_institution_care_journey(uuid) TO authenticated;