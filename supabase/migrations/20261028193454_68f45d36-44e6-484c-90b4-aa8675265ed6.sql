CREATE TABLE public.institution_content_theme_weeks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid NOT NULL REFERENCES public.educational_institutions(id) ON DELETE CASCADE,
  unit text NOT NULL, semester text NOT NULL, week_index int NOT NULL, theme text NOT NULL,
  accesses int NOT NULL DEFAULT 0, people int NOT NULL DEFAULT 0, empty_searches int NOT NULL DEFAULT 0,
  contents_available int NOT NULL DEFAULT 0, useful_pct int,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.institution_trail_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid NOT NULL REFERENCES public.educational_institutions(id) ON DELETE CASCADE,
  unit text NOT NULL, semester text NOT NULL, trail text NOT NULL, theme text NOT NULL, format text NOT NULL,
  started int NOT NULL DEFAULT 0, completed int NOT NULL DEFAULT 0, last_month int NOT NULL DEFAULT 0, prev_month int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.institution_practice_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid NOT NULL REFERENCES public.educational_institutions(id) ON DELETE CASCADE,
  unit text NOT NULL, semester text NOT NULL, practice text NOT NULL,
  times int NOT NULL DEFAULT 0, people int NOT NULL DEFAULT 0, helped_pct int,
  sources jsonb NOT NULL DEFAULT '{}', next_steps jsonb NOT NULL DEFAULT '{}', hours jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.institution_event_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid NOT NULL REFERENCES public.educational_institutions(id) ON DELETE CASCADE,
  unit text NOT NULL, semester text NOT NULL, title text NOT NULL, kind text NOT NULL, event_date date NOT NULL,
  capacity int NOT NULL DEFAULT 0, registered int NOT NULL DEFAULT 0, present int NOT NULL DEFAULT 0, rating numeric, waitlist int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
DO $$ DECLARE t text; BEGIN
  FOREACH t IN ARRAY ARRAY['institution_content_theme_weeks','institution_trail_progress','institution_practice_usage','institution_event_usage'] LOOP
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', t);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', t);
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('CREATE POLICY "Institution team reads" ON public.%I FOR SELECT TO authenticated USING (public.is_admin(auth.uid()) OR public.user_has_institution_access(auth.uid(), institution_id))', t);
    EXECUTE format('CREATE POLICY "Admins manage" ON public.%I FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()))', t);
    EXECUTE format('CREATE TRIGGER trg_%s_updated BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column()', t, t);
  END LOOP;
END $$;

DO $$
DECLARE inst uuid := '52edbfee-9645-40ca-967a-b1135f4b6aac';
  sems text[] := ARRAY['2025.2','2026.1','2026.2'];
  units text[] := ARRAY['Afya Contagem','Afya Itajubá','Afya Montes Claros'];
  usz numeric[] := ARRAY[1.45, 1.0, 1.02];
  themes text[] := ARRAY['Ansiedade em provas','Sono','Pertencimento','Carreira','Relacionamentos','Finanças','Foco e estudo','Luto e perdas'];
  base int[] := ARRAY[60, 42, 30, 22, 20, 16, 34, 6];
  cnt int[] := ARRAY[6, 4, 5, 9, 6, 3, 10, 1];
  useful int[] := ARRAY[78, 81, 74, 69, 72, 66, 70, 80];
  sm text; ui int; ti int; w int; f numeric; nweeks int; acc int; sf numeric;
  pr text; pi int;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM educational_institutions WHERE id = inst) THEN RETURN; END IF;
  FOREACH sm IN ARRAY sems LOOP
    nweeks := CASE WHEN sm = '2026.2' THEN 13 ELSE 18 END;
    sf := CASE sm WHEN '2025.2' THEN 0.7 WHEN '2026.1' THEN 0.85 ELSE 1 END;
    FOR ui IN 1..3 LOOP
      FOR ti IN 1..8 LOOP
        FOR w IN 1..nweeks LOOP
          f := CASE themes[ti]
            WHEN 'Ansiedade em provas' THEN CASE WHEN w IN (7,8,15,16) THEN 2.4 WHEN w IN (6,14) THEN 1.5 ELSE 0.7 END
            WHEN 'Sono' THEN CASE WHEN w IN (6,7,14,15) THEN 1.9 ELSE 0.85 END
            WHEN 'Pertencimento' THEN CASE WHEN w <= 3 THEN 2.6 ELSE 0.7 END
            WHEN 'Carreira' THEN CASE WHEN w >= 14 THEN 1.9 ELSE 0.8 END
            WHEN 'Foco e estudo' THEN CASE WHEN w IN (5,6,13,14) THEN 1.6 ELSE 0.9 END
            ELSE 0.85 + random() * 0.3 END;
          acc := round(base[ti] * f * usz[ui] * sf * (0.85 + random() * 0.3));
          INSERT INTO institution_content_theme_weeks (institution_id, unit, semester, week_index, theme, accesses, people, empty_searches, contents_available, useful_pct)
          VALUES (inst, units[ui], sm, w, themes[ti], acc, greatest(1, round(acc * 0.62)),
            round(acc * CASE WHEN cnt[ti] <= 3 THEN 0.18 WHEN cnt[ti] <= 5 THEN 0.08 ELSE 0.02 END),
            cnt[ti], useful[ti] + floor(random() * 7 - 3)::int);
        END LOOP;
      END LOOP;
      INSERT INTO institution_trail_progress (institution_id, unit, semester, trail, theme, format, started, completed, last_month, prev_month)
      SELECT inst, units[ui], sm, x.t, x.th, x.fm, s, round(s * x.c), round(s * x.m * (0.9 + random() * 0.2)), round(s * x.m * x.tr)
      FROM (VALUES ('Atravessar a semana de provas','Ansiedade em provas','Áudio e texto · 5 passos',0.42,0.38,0.6),
                   ('Dormir melhor','Sono','Áudio · 7 noites',0.16,0.22,1.0),
                   ('Primeiras semanas no curso','Pertencimento','Texto e vídeo · 4 passos',0.51,0.12,1.6),
                   ('Foco sem culpa','Foco e estudo','Texto · 6 passos',0.34,0.25,1.0),
                   ('Escolhas de carreira','Carreira','Vídeo · 5 passos',0.29,0.31,0.7)) x(t, th, fm, c, m, tr)
      CROSS JOIN LATERAL (SELECT round((CASE x.th WHEN 'Ansiedade em provas' THEN 120 WHEN 'Sono' THEN 95 WHEN 'Pertencimento' THEN 70 WHEN 'Foco e estudo' THEN 60 ELSE 45 END) * usz[ui] * sf * (0.9 + random() * 0.2))::int s) z;
      pi := 0;
      FOR pr IN SELECT titulo FROM praticas WHERE ativo ORDER BY ordem NULLS LAST, titulo LIMIT 6 LOOP
        pi := pi + 1;
        INSERT INTO institution_practice_usage (institution_id, unit, semester, practice, times, people, helped_pct, sources, next_steps, hours)
        VALUES (inst, units[ui], sm, pr,
          round((ARRAY[620,410,330,260,190,140])[pi] * usz[ui] * sf * 0.33 * (0.9 + random() * 0.2)),
          round((ARRAY[620,410,330,260,190,140])[pi] * usz[ui] * sf * 0.33 * 0.19 * (0.9 + random() * 0.2)),
          (ARRAY[82,79,76,73,71,68])[pi] + floor(random() * 5 - 2)::int,
          jsonb_build_object('Buddy', 30 + pi, 'Diário emocional', 26, 'Jornada emocional', 22 - pi, 'Biblioteca de apoios', 12, 'Notificação', 10 - pi + 6),
          jsonb_build_object('Registrou no diário', 34, 'Fez outra prática', 22, 'Conversou com o Buddy', 18, 'Abriu um apoio', 9 + pi, 'Encerrou', 17 - pi),
          jsonb_build_object('Manhã', 18, 'Tarde', 24, 'Noite', 44 - pi, 'Madrugada', 14 + pi));
      END LOOP;
    END LOOP;
    INSERT INTO institution_event_usage (institution_id, unit, semester, title, kind, event_date, capacity, registered, present, rating, waitlist)
    SELECT inst, units[1 + (rn % 3)], sm, g.title,
      CASE WHEN g.session_type ILIKE '%roda%' THEN 'Roda de conversa' WHEN g.session_type ILIKE '%workshop%' OR g.session_type ILIKE '%oficina%' THEN 'Oficina' ELSE 'Encontro' END,
      (make_date(split_part(sm,'.',1)::int, CASE WHEN split_part(sm,'.',2)='1' THEN 2 ELSE 8 END, 5) + (rn * 13) * interval '1 day')::date,
      cap, reg, round(reg * (0.6 + random() * 0.3)), round((4.2 + random() * 0.7)::numeric, 1), CASE WHEN reg >= cap THEN 8 + floor(random() * 30)::int ELSE 0 END
    FROM (SELECT title, session_type, row_number() OVER (ORDER BY session_date, title) rn FROM group_sessions LIMIT 9) g
    CROSS JOIN LATERAL (SELECT (ARRAY[60,80,100,120])[1 + (g.rn % 4)::int] cap) c
    CROSS JOIN LATERAL (SELECT least(c.cap, round(c.cap * sf * (0.55 + random() * 0.6)))::int reg) r
    WHERE (make_date(split_part(sm,'.',1)::int, CASE WHEN split_part(sm,'.',2)='1' THEN 2 ELSE 8 END, 5) + (rn * 13) * interval '1 day') < now();
  END LOOP;
END $$;