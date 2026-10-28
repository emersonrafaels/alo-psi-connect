DELETE FROM public.institution_service_appointments WHERE is_demo = true;
DELETE FROM public.institution_service_capacity WHERE institution_id = '52edbfee-9645-40ca-967a-b1135f4b6aac';
DO $$
DECLARE inst uuid := '52edbfee-9645-40ca-967a-b1135f4b6aac';
  sems text[] := ARRAY['2025.2','2026.1','2026.2'];
  units text[] := ARRAY['Afya Contagem','Afya Itajubá','Afya Montes Claros'];
  nper numeric[] := ARRAY[0.09, 0.14, 0.34];
  waitd numeric[] := ARRAY[10, 6, 4];
  noshowp numeric[] := ARRAY[0.18, 0.14, 0.10];
  ufac numeric[] := ARRAY[0.92, 1.05, 1.18];
  sm text; ui int; n int; ps int; st timestamptz; en timestamptz; wk numeric; svc text; dem numeric; f numeric; tot numeric;
BEGIN
  CREATE TEMP TABLE pool ON COMMIT DROP AS
    WITH RECURSIVE up AS (
      SELECT pl.patient_id, u.id, u.parent_id, u.level, u.name FROM patient_institution_placements pl
      JOIN institution_academic_units u ON u.id = pl.class_unit_id WHERE pl.institution_id = inst
        AND NOT EXISTS (SELECT 1 FROM synthetic_student_cases sc WHERE sc.patient_id = pl.patient_id)
      UNION ALL SELECT up.patient_id, u.id, u.parent_id, u.level, u.name FROM institution_academic_units u JOIN up ON u.id = up.parent_id)
    SELECT DISTINCT patient_id, name unit FROM up WHERE level = 'unit';
  CREATE TEMP TABLE pool2 ON COMMIT DROP AS SELECT patient_id, unit, row_number() OVER (PARTITION BY unit ORDER BY random()) rn FROM pool;
  CREATE TEMP TABLE rnd (g int, r numeric, h numeric, r1 numeric, r2 numeric, r3 numeric, r4 numeric, r5 numeric, r6 numeric, r7 numeric) ON COMMIT DROP;
  FOREACH sm IN ARRAY sems LOOP
    st := make_date(split_part(sm,'.',1)::int, CASE WHEN split_part(sm,'.',2)='1' THEN 2 ELSE 8 END, 1);
    en := least(st + interval '4 months 25 days', now() - interval '1 day');
    IF sm = '2026.2' THEN wk := greatest(1, extract(epoch from now() - make_date(2026,7,1)::timestamptz) / 604800); ELSE wk := 26; END IF;
    FOR ui IN 1..3 LOOP
      n := round((CASE ui WHEN 1 THEN 230 WHEN 2 THEN 150 ELSE 165 END) * (CASE sm WHEN '2025.2' THEN 0.85 WHEN '2026.1' THEN 0.95 ELSE 0.8 END));
      ps := greatest(1, n * 10 / 37);
      TRUNCATE rnd;
      INSERT INTO rnd SELECT g, random(), random(), random(), random(), random(), random(), random(), random(), random() FROM generate_series(1, n) g;
      INSERT INTO institution_service_appointments (institution_id, patient_id, unit, service, requested_at, scheduled_at, status, no_show_reason, rating, would_recommend, is_demo)
      SELECT inst, p.patient_id, units[ui],
        CASE WHEN x.r < 0.55 THEN 'psicologia' WHEN x.r < 0.70 THEN 'psiquiatria' WHEN x.r < 0.90 THEN 'nucleo' ELSE 'mentoria' END,
        q.req,
        q.req + make_interval(days => greatest(1, round(waitd[ui] * (CASE sm WHEN '2025.2' THEN 1.35 WHEN '2026.1' THEN 1.2 ELSE 1 END) * (0.4 + x.r2 * 1.2))::int)),
        CASE WHEN x.r1 < noshowp[ui] THEN 'falta' ELSE 'realizada' END,
        CASE WHEN x.r1 < noshowp[ui] THEN (ARRAY['aula_prova','aula_prova','aula_prova','aula_prova','esqueceu','esqueceu','deslocamento','deslocamento','nao_precisava','outros'])[1 + floor(x.r3*10)::int] END,
        CASE WHEN x.r1 >= noshowp[ui] AND x.r4 < 0.45 THEN (ARRAY[3,4,4,5,5,5,5,5])[1 + floor(x.r5*8)::int] END,
        CASE WHEN x.r1 >= noshowp[ui] AND x.r4 < 0.45 THEN x.r6 < 0.88 END,
        true
      FROM rnd x
      CROSS JOIN LATERAL (SELECT date_trunc('day', st + x.r7 * (en - st)) +
          make_interval(hours => (CASE WHEN x.h < 0.21 THEN 7 + floor(x.r2*5) WHEN x.h < 0.51 THEN 12 + floor(x.r3*6) WHEN x.h < 0.92 THEN 18 + floor(x.r5*6) ELSE floor(x.r6*6) END)::int,
                        mins => floor(x.r4*60)::int) req) q
      JOIN pool2 p ON p.unit = units[ui] AND p.rn = 1 + (x.g * 7 + ui) % ps;
      FOREACH svc IN ARRAY ARRAY['psicologia','psiquiatria','nucleo','mentoria'] LOOP
        SELECT count(*) / wk INTO dem FROM institution_service_appointments
          WHERE institution_id = inst AND unit = units[ui] AND service = svc AND is_demo
            AND extract(year from requested_at)::int || '.' || CASE WHEN extract(month from requested_at) <= 6 THEN 1 ELSE 2 END = sm;
        f := CASE svc WHEN 'psicologia' THEN 0.94 WHEN 'psiquiatria' THEN 0.66 WHEN 'nucleo' THEN 1.18 ELSE 1.8 END * ufac[ui];
        tot := dem * f;
        INSERT INTO institution_service_capacity (institution_id, unit, service, semester, period, weekly_hours) VALUES
          (inst, units[ui], svc, sm, 'manha', round(tot * (1 - nper[ui]) * 0.46, 2)),
          (inst, units[ui], svc, sm, 'tarde', round(tot * (1 - nper[ui]) * 0.54, 2)),
          (inst, units[ui], svc, sm, 'noite', round(tot * nper[ui], 2)),
          (inst, units[ui], svc, sm, 'madrugada', 0)
        ON CONFLICT DO NOTHING;
      END LOOP;
    END LOOP;
  END LOOP;
END $$;