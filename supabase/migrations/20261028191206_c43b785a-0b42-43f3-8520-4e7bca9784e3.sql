CREATE TABLE public.institution_service_appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid NOT NULL REFERENCES public.educational_institutions(id) ON DELETE CASCADE,
  patient_id uuid,
  unit text NOT NULL DEFAULT 'Sem unidade',
  service text NOT NULL,
  requested_at timestamptz NOT NULL,
  scheduled_at timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'realizada',
  no_show_reason text,
  rating smallint,
  would_recommend boolean,
  is_demo boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON public.institution_service_appointments (institution_id, requested_at);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.institution_service_appointments TO authenticated;
GRANT ALL ON public.institution_service_appointments TO service_role;
ALTER TABLE public.institution_service_appointments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage service appointments" ON public.institution_service_appointments FOR ALL TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE TRIGGER trg_isa_updated BEFORE UPDATE ON public.institution_service_appointments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.institution_service_capacity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid NOT NULL REFERENCES public.educational_institutions(id) ON DELETE CASCADE,
  unit text NOT NULL,
  service text NOT NULL,
  semester text NOT NULL,
  period text NOT NULL,
  weekly_hours numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (institution_id, unit, service, semester, period)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.institution_service_capacity TO authenticated;
GRANT ALL ON public.institution_service_capacity TO service_role;
ALTER TABLE public.institution_service_capacity ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Institution team reads capacity" ON public.institution_service_capacity FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()) OR public.user_has_institution_access(auth.uid(), institution_id));
CREATE POLICY "Admins manage capacity" ON public.institution_service_capacity FOR ALL TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE TRIGGER trg_isc_updated BEFORE UPDATE ON public.institution_service_capacity FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.get_institution_appointments_capacity(p_institution_id uuid) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE result jsonb;
BEGIN
  IF NOT (public.is_admin(auth.uid()) OR public.user_has_institution_access(auth.uid(), p_institution_id)) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  WITH a AS (
    SELECT *, extract(year from requested_at)::int || '.' || CASE WHEN extract(month from requested_at) <= 6 THEN 1 ELSE 2 END sem,
      extract(isodow from requested_at)::int wd,
      CASE WHEN extract(hour from requested_at) BETWEEN 6 AND 11 THEN 'manha' WHEN extract(hour from requested_at) BETWEEN 12 AND 17 THEN 'tarde'
           WHEN extract(hour from requested_at) BETWEEN 18 AND 23 THEN 'noite' ELSE 'madrugada' END per
    FROM institution_service_appointments WHERE institution_id = p_institution_id
  ), ok AS (SELECT sem, unit FROM a GROUP BY 1,2 HAVING count(*) >= 10),
  b AS (SELECT a.* FROM a JOIN ok USING (sem, unit)),
  weeks AS (
    SELECT sem, greatest(1, extract(epoch from least(now(), e) - s) / 604800) w FROM (
      SELECT DISTINCT sem, make_date(split_part(sem,'.',1)::int, CASE WHEN split_part(sem,'.',2)='1' THEN 1 ELSE 7 END, 1)::timestamptz s,
        (make_date(split_part(sem,'.',1)::int, CASE WHEN split_part(sem,'.',2)='1' THEN 1 ELSE 7 END, 1) + interval '6 months')::timestamptz e FROM b) x
  )
  SELECT jsonb_build_object(
    'weeks', (SELECT coalesce(jsonb_object_agg(sem, round(w::numeric, 1)), '{}') FROM weeks),
    'kpi', (SELECT coalesce(jsonb_agg(to_jsonb(k)), '[]') FROM (
      SELECT sem, coalesce(unit, '__all__') unit, count(*) marked,
        count(*) FILTER (WHERE status = 'realizada') done, count(*) FILTER (WHERE status = 'falta') noshow,
        count(DISTINCT patient_id) FILTER (WHERE status = 'realizada') people,
        percentile_cont(0.5) WITHIN GROUP (ORDER BY extract(epoch from scheduled_at - requested_at)/86400) wait,
        round(avg(rating)::numeric, 1) rating, count(rating) rating_n,
        round(100.0 * count(*) FILTER (WHERE would_recommend) / nullif(count(would_recommend), 0)) recommend
      FROM b GROUP BY GROUPING SETS ((sem, unit), (sem))) k),
    'svc', (SELECT coalesce(jsonb_agg(to_jsonb(s)), '[]') FROM (
      SELECT sem, coalesce(unit, '__all__') unit, service, count(*) marked, count(*) FILTER (WHERE status = 'realizada') done
      FROM b GROUP BY GROUPING SETS ((sem, unit, service), (sem, service))) s),
    'heat', (SELECT coalesce(jsonb_agg(to_jsonb(h)), '[]') FROM (
      SELECT sem, coalesce(unit, '__all__') unit, wd, per, count(*) n FROM b GROUP BY GROUPING SETS ((sem, unit, wd, per), (sem, wd, per))) h),
    'reasons', (SELECT coalesce(jsonb_agg(to_jsonb(r)), '[]') FROM (
      SELECT sem, coalesce(unit, '__all__') unit, coalesce(no_show_reason, 'outros') reason, count(*) n
      FROM b WHERE status = 'falta' GROUP BY GROUPING SETS ((sem, unit, 3), (sem, 3))) r),
    'cap', (SELECT coalesce(jsonb_agg(to_jsonb(c)), '[]') FROM (
      SELECT c.semester sem, coalesce(c.unit, '__all__') unit, c.service, c.period per, sum(c.weekly_hours) hours
      FROM institution_service_capacity c WHERE c.institution_id = p_institution_id
        AND EXISTS (SELECT 1 FROM ok WHERE ok.sem = c.semester AND ok.unit = c.unit)
      GROUP BY GROUPING SETS ((c.semester, c.unit, c.service, c.period), (c.semester, c.service, c.period))) c)
  ) INTO result;
  RETURN result;
END $$;
REVOKE ALL ON FUNCTION public.get_institution_appointments_capacity(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_institution_appointments_capacity(uuid) TO authenticated;

-- Demonstration data for Afya
DO $$
DECLARE inst uuid := '52edbfee-9645-40ca-967a-b1135f4b6aac';
  sems text[] := ARRAY['2025.2','2026.1','2026.2'];
  units text[] := ARRAY['Afya Contagem','Afya Itajubá','Afya Montes Claros'];
  nper numeric[] := ARRAY[0.09, 0.14, 0.34];
  waitd numeric[] := ARRAY[10, 6, 4];
  noshowp numeric[] := ARRAY[0.18, 0.14, 0.10];
  ufac numeric[] := ARRAY[0.92, 1.05, 1.18];
  sm text; ui int; si int; n int; st timestamptz; en timestamptz; wk numeric; svc text; dem numeric; f numeric; tot numeric;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM educational_institutions WHERE id = inst) THEN RETURN; END IF;
  CREATE TEMP TABLE pool ON COMMIT DROP AS
    WITH RECURSIVE up AS (
      SELECT pl.patient_id, u.id, u.parent_id, u.level, u.name FROM patient_institution_placements pl
      JOIN institution_academic_units u ON u.id = pl.class_unit_id WHERE pl.institution_id = inst
        AND NOT EXISTS (SELECT 1 FROM synthetic_student_cases sc WHERE sc.patient_id = pl.patient_id)
      UNION ALL SELECT up.patient_id, u.id, u.parent_id, u.level, u.name FROM institution_academic_units u JOIN up ON u.id = up.parent_id)
    SELECT patient_id, name unit, row_number() OVER (PARTITION BY name ORDER BY random()) rn FROM up WHERE level = 'unit';
  FOREACH sm IN ARRAY sems LOOP
    st := make_date(split_part(sm,'.',1)::int, CASE WHEN split_part(sm,'.',2)='1' THEN 2 ELSE 8 END, 1);
    en := least(st + interval '4 months 25 days', now() - interval '1 day');
    wk := greatest(1, extract(epoch from (make_date(split_part(sm,'.',1)::int, CASE WHEN split_part(sm,'.',2)='1' THEN 1 ELSE 7 END, 1) + interval '6 months')::timestamptz - make_date(split_part(sm,'.',1)::int, CASE WHEN split_part(sm,'.',2)='1' THEN 1 ELSE 7 END, 1)::timestamptz) / 604800);
    IF sm = '2026.2' THEN wk := greatest(1, extract(epoch from now() - make_date(2026,7,1)::timestamptz) / 604800); END IF;
    FOR ui IN 1..3 LOOP
      n := (CASE ui WHEN 1 THEN 230 WHEN 2 THEN 150 ELSE 165 END) * (CASE sm WHEN '2025.2' THEN 0.85 WHEN '2026.1' THEN 0.95 ELSE 0.8 END);
      INSERT INTO institution_service_appointments (institution_id, patient_id, unit, service, requested_at, scheduled_at, status, no_show_reason, rating, would_recommend, is_demo)
      SELECT inst, p.patient_id, units[ui], x.svc, x.req,
        x.req + make_interval(days => greatest(1, round(waitd[ui] * (CASE sm WHEN '2025.2' THEN 1.35 WHEN '2026.1' THEN 1.2 ELSE 1 END) * (0.4 + random() * 1.2))::int)),
        CASE WHEN x.r1 < noshowp[ui] THEN 'falta' ELSE 'realizada' END,
        CASE WHEN x.r1 < noshowp[ui] THEN (ARRAY['aula_prova','aula_prova','aula_prova','aula_prova','esqueceu','esqueceu','deslocamento','deslocamento','nao_precisava','outros'])[1 + floor(random()*10)::int] END,
        CASE WHEN x.r1 >= noshowp[ui] AND random() < 0.45 THEN (ARRAY[3,4,4,5,5,5,5,5])[1 + floor(random()*8)::int] END,
        CASE WHEN x.r1 >= noshowp[ui] AND random() < 0.45 THEN random() < 0.88 END,
        true
      FROM generate_series(1, n) g
      CROSS JOIN LATERAL (
        SELECT (CASE WHEN r < 0.55 THEN 'psicologia' WHEN r < 0.70 THEN 'psiquiatria' WHEN r < 0.90 THEN 'nucleo' ELSE 'mentoria' END) svc,
          date_trunc('day', st + random() * (en - st)) +
          make_interval(hours => (CASE WHEN h < 0.21 THEN 7 + floor(random()*5) WHEN h < 0.51 THEN 12 + floor(random()*6) WHEN h < 0.92 THEN 18 + floor(random()*6) ELSE floor(random()*6) END)::int,
                        mins => floor(random()*60)::int) req,
          random() r1
        FROM (SELECT random() r, random() h, g) z
      ) x
      JOIN pool p ON p.unit = units[ui] AND p.rn = 1 + (g * 7 + length(sm) * 13 + ui) % greatest(1, n / 3);

      FOREACH svc IN ARRAY ARRAY['psicologia','psiquiatria','nucleo','mentoria'] LOOP
        SELECT count(*) / wk INTO dem FROM institution_service_appointments
          WHERE institution_id = inst AND unit = units[ui] AND service = svc AND is_demo
            AND extract(year from requested_at)::int || '.' || CASE WHEN extract(month from requested_at) <= 6 THEN 1 ELSE 2 END = sm;
        f := CASE svc WHEN 'psicologia' THEN 0.94 WHEN 'psiquiatria' THEN 0.66 WHEN 'nucleo' THEN 1.18 ELSE 1.8 END * ufac[ui];
        tot := round(dem * f, 1);
        INSERT INTO institution_service_capacity (institution_id, unit, service, semester, period, weekly_hours) VALUES
          (inst, units[ui], svc, sm, 'manha', round(tot * (1 - nper[ui]) * 0.46, 1)),
          (inst, units[ui], svc, sm, 'tarde', round(tot * (1 - nper[ui]) * 0.54, 1)),
          (inst, units[ui], svc, sm, 'noite', round(tot * nper[ui], 1)),
          (inst, units[ui], svc, sm, 'madrugada', 0)
        ON CONFLICT DO NOTHING;
      END LOOP;
    END LOOP;
  END LOOP;
END $$;