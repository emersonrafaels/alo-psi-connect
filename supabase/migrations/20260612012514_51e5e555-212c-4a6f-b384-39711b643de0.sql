
-- ============ TABLES ============

CREATE TABLE public.emotional_scales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  short_description TEXT,
  description TEXT,
  instructions TEXT,
  item_min INTEGER NOT NULL DEFAULT 0,
  item_max INTEGER NOT NULL DEFAULT 3,
  reverse_items INTEGER[] NOT NULL DEFAULT '{}',
  iseu_weight NUMERIC(5,3) NOT NULL DEFAULT 0,
  iseu_direction TEXT NOT NULL DEFAULT 'inverse' CHECK (iseu_direction IN ('positive','inverse')),
  frequency_days INTEGER NOT NULL DEFAULT 180,
  estimated_minutes INTEGER NOT NULL DEFAULT 3,
  active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.emotional_scales TO authenticated;
GRANT ALL ON public.emotional_scales TO service_role;
ALTER TABLE public.emotional_scales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated reads active scales" ON public.emotional_scales
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins manage scales" ON public.emotional_scales
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'super_admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'super_admin'::app_role));

CREATE TRIGGER trg_emotional_scales_updated_at
  BEFORE UPDATE ON public.emotional_scales
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ----------------------------------------------------------------

CREATE TABLE public.emotional_scale_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scale_id UUID NOT NULL REFERENCES public.emotional_scales(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  text TEXT NOT NULL,
  option_labels JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (scale_id, position)
);

GRANT SELECT ON public.emotional_scale_items TO authenticated;
GRANT ALL ON public.emotional_scale_items TO service_role;
ALTER TABLE public.emotional_scale_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated reads scale items" ON public.emotional_scale_items
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins manage scale items" ON public.emotional_scale_items
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'super_admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'super_admin'::app_role));

-- ----------------------------------------------------------------

CREATE TABLE public.emotional_scale_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scale_id UUID NOT NULL REFERENCES public.emotional_scales(id) ON DELETE RESTRICT,
  scale_code TEXT NOT NULL,
  answers JSONB NOT NULL,
  raw_score NUMERIC(8,2) NOT NULL,
  normalized_score NUMERIC(6,2) NOT NULL, -- 0..100, higher = better
  severity TEXT NOT NULL,
  taken_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_scale_responses_user_scale_taken
  ON public.emotional_scale_responses (user_id, scale_id, taken_at DESC);
CREATE INDEX idx_scale_responses_user_taken
  ON public.emotional_scale_responses (user_id, taken_at DESC);

GRANT SELECT, INSERT ON public.emotional_scale_responses TO authenticated;
GRANT ALL ON public.emotional_scale_responses TO service_role;
ALTER TABLE public.emotional_scale_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own responses" ON public.emotional_scale_responses
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users insert own responses" ON public.emotional_scale_responses
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins read all responses" ON public.emotional_scale_responses
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'super_admin'::app_role));

-- ----------------------------------------------------------------

CREATE TABLE public.iseu_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  score NUMERIC(6,2) NOT NULL, -- 0..100
  band TEXT NOT NULL CHECK (band IN ('verde','amarelo','laranja','vermelho')),
  components JSONB NOT NULL DEFAULT '{}'::jsonb,
  scales_used INTEGER NOT NULL DEFAULT 0,
  weights_total NUMERIC(5,3) NOT NULL DEFAULT 0,
  computed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_iseu_scores_user_computed
  ON public.iseu_scores (user_id, computed_at DESC);

GRANT SELECT ON public.iseu_scores TO authenticated;
GRANT ALL ON public.iseu_scores TO service_role;
ALTER TABLE public.iseu_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own iseu" ON public.iseu_scores
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Admins read all iseu" ON public.iseu_scores
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'super_admin'::app_role));

-- ============ FUNCTIONS ============

CREATE OR REPLACE FUNCTION public.compute_iseu_score(_user_id UUID)
RETURNS public.iseu_scores
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rec RECORD;
  total_weighted NUMERIC := 0;
  total_weight NUMERIC := 0;
  components_json JSONB := '{}'::jsonb;
  scales_count INTEGER := 0;
  final_score NUMERIC;
  band_label TEXT;
  inserted public.iseu_scores;
BEGIN
  FOR rec IN
    SELECT DISTINCT ON (r.scale_id)
      r.scale_id, r.scale_code, r.normalized_score, r.taken_at,
      s.iseu_weight, s.name
    FROM public.emotional_scale_responses r
    JOIN public.emotional_scales s ON s.id = r.scale_id
    WHERE r.user_id = _user_id
      AND s.iseu_weight > 0
      AND r.taken_at >= now() - INTERVAL '180 days'
    ORDER BY r.scale_id, r.taken_at DESC
  LOOP
    total_weighted := total_weighted + (rec.normalized_score * rec.iseu_weight);
    total_weight := total_weight + rec.iseu_weight;
    scales_count := scales_count + 1;
    components_json := components_json || jsonb_build_object(
      rec.scale_code, jsonb_build_object(
        'name', rec.name,
        'normalized_score', rec.normalized_score,
        'weight', rec.iseu_weight,
        'taken_at', rec.taken_at
      )
    );
  END LOOP;

  IF total_weight = 0 THEN
    RETURN NULL;
  END IF;

  final_score := ROUND(total_weighted / total_weight, 2);

  IF final_score >= 75 THEN band_label := 'verde';
  ELSIF final_score >= 55 THEN band_label := 'amarelo';
  ELSIF final_score >= 35 THEN band_label := 'laranja';
  ELSE band_label := 'vermelho';
  END IF;

  INSERT INTO public.iseu_scores (user_id, score, band, components, scales_used, weights_total)
  VALUES (_user_id, final_score, band_label, components_json, scales_count, total_weight)
  RETURNING * INTO inserted;

  RETURN inserted;
END;
$$;

-- ============ SEED: SCALES ============

INSERT INTO public.emotional_scales
  (code, name, short_description, description, instructions, item_min, item_max, reverse_items, iseu_weight, iseu_direction, frequency_days, estimated_minutes, display_order)
VALUES
  ('WHO5', 'WHO-5 — Índice de Bem-Estar',
   'Mede bem-estar subjetivo nas últimas 2 semanas.',
   'Cinco afirmações sobre como você se sentiu nas últimas duas semanas.',
   'Para cada uma das cinco afirmações, escolha a opção que melhor descreve como você se sentiu nas últimas 2 semanas.',
   0, 5, '{}', 0.200, 'positive', 180, 2, 1),

  ('PHQ9', 'PHQ-9 — Sintomas Depressivos',
   'Rastreia sintomas de depressão nas últimas 2 semanas.',
   'Nove perguntas sobre frequência de sintomas depressivos.',
   'Nas últimas 2 semanas, com que frequência você foi incomodado por cada um dos problemas abaixo?',
   0, 3, '{}', 0.180, 'inverse', 180, 4, 2),

  ('GAD7', 'GAD-7 — Sintomas de Ansiedade',
   'Rastreia sintomas de ansiedade generalizada nas últimas 2 semanas.',
   'Sete perguntas sobre frequência de sintomas de ansiedade.',
   'Nas últimas 2 semanas, com que frequência você foi incomodado pelos seguintes problemas?',
   0, 3, '{}', 0.135, 'inverse', 180, 3, 3),

  ('PSS10', 'PSS-10 — Estresse Percebido',
   'Avalia o quanto sua vida tem sido percebida como estressante no último mês.',
   'Dez perguntas sobre pensamentos e sentimentos no último mês.',
   'No último mês, com que frequência você se sentiu ou pensou de determinada maneira?',
   0, 4, '{4,5,7,8}', 0.135, 'inverse', 180, 4, 4),

  ('ISI', 'ISI — Índice de Gravidade da Insônia',
   'Avalia a gravidade dos sintomas de insônia nas últimas 2 semanas.',
   'Sete perguntas sobre sono e seu impacto.',
   'Avalie a gravidade dos seus problemas de sono nas últimas 2 semanas.',
   0, 4, '{}', 0.100, 'inverse', 180, 3, 5);

-- ============ SEED: ITEMS ============

-- WHO-5
WITH s AS (SELECT id FROM public.emotional_scales WHERE code = 'WHO5')
INSERT INTO public.emotional_scale_items (scale_id, position, text, option_labels)
SELECT s.id, p, t, '{"0":"Em nenhum momento","1":"Em alguns momentos","2":"Menos da metade do tempo","3":"Mais da metade do tempo","4":"A maior parte do tempo","5":"O tempo todo"}'::jsonb
FROM s, (VALUES
  (1, 'Eu me senti alegre e de bom humor.'),
  (2, 'Eu me senti calmo(a) e relaxado(a).'),
  (3, 'Eu me senti ativo(a) e com energia.'),
  (4, 'Acordei me sentindo descansado(a) e renovado(a).'),
  (5, 'Meu cotidiano esteve cheio de coisas que me interessam.')
) v(p, t);

-- PHQ-9
WITH s AS (SELECT id FROM public.emotional_scales WHERE code = 'PHQ9')
INSERT INTO public.emotional_scale_items (scale_id, position, text, option_labels)
SELECT s.id, p, t, '{"0":"Nenhum dia","1":"Vários dias","2":"Mais da metade dos dias","3":"Quase todos os dias"}'::jsonb
FROM s, (VALUES
  (1, 'Pouco interesse ou pouco prazer em fazer as coisas.'),
  (2, 'Sentir-se para baixo, deprimido(a) ou sem esperança.'),
  (3, 'Dificuldade para pegar no sono, manter o sono ou dormir demais.'),
  (4, 'Sentir-se cansado(a) ou com pouca energia.'),
  (5, 'Falta de apetite ou comer demais.'),
  (6, 'Sentir-se mal consigo mesmo(a) — ou achar que é um fracasso ou que decepcionou sua família.'),
  (7, 'Dificuldade para se concentrar nas coisas (ler, assistir TV etc.).'),
  (8, 'Lentidão para se movimentar ou falar; ou agitação a ponto de outras pessoas notarem.'),
  (9, 'Pensar em se ferir de alguma maneira ou que seria melhor estar morto(a).')
) v(p, t);

-- GAD-7
WITH s AS (SELECT id FROM public.emotional_scales WHERE code = 'GAD7')
INSERT INTO public.emotional_scale_items (scale_id, position, text, option_labels)
SELECT s.id, p, t, '{"0":"Nenhum dia","1":"Vários dias","2":"Mais da metade dos dias","3":"Quase todos os dias"}'::jsonb
FROM s, (VALUES
  (1, 'Sentir-se nervoso(a), ansioso(a) ou no limite.'),
  (2, 'Não conseguir parar ou controlar as preocupações.'),
  (3, 'Preocupar-se muito com diferentes coisas.'),
  (4, 'Dificuldade para relaxar.'),
  (5, 'Ficar tão inquieto(a) que se torna difícil ficar parado(a).'),
  (6, 'Ficar facilmente aborrecido(a) ou irritado(a).'),
  (7, 'Sentir medo, como se algo terrível fosse acontecer.')
) v(p, t);

-- PSS-10
WITH s AS (SELECT id FROM public.emotional_scales WHERE code = 'PSS10')
INSERT INTO public.emotional_scale_items (scale_id, position, text, option_labels)
SELECT s.id, p, t, '{"0":"Nunca","1":"Quase nunca","2":"Às vezes","3":"Frequentemente","4":"Muito frequentemente"}'::jsonb
FROM s, (VALUES
  (1,  'Com que frequência você ficou aborrecido(a) com algo inesperado?'),
  (2,  'Com que frequência você sentiu que não conseguia controlar coisas importantes da sua vida?'),
  (3,  'Com que frequência você se sentiu nervoso(a) e estressado(a)?'),
  (4,  'Com que frequência você sentiu confiança na sua capacidade de lidar com seus problemas pessoais?'),
  (5,  'Com que frequência você sentiu que as coisas estavam saindo do jeito que você queria?'),
  (6,  'Com que frequência você sentiu que não conseguia lidar com tudo o que tinha para fazer?'),
  (7,  'Com que frequência você conseguiu controlar as irritações da sua vida?'),
  (8,  'Com que frequência você sentiu que tinha tudo sob controle?'),
  (9,  'Com que frequência você ficou irritado(a) por coisas fora do seu controle?'),
  (10, 'Com que frequência você sentiu que as dificuldades se acumulavam tanto que você não conseguiria superá-las?')
) v(p, t);

-- ISI
WITH s AS (SELECT id FROM public.emotional_scales WHERE code = 'ISI')
INSERT INTO public.emotional_scale_items (scale_id, position, text, option_labels)
SELECT s.id, p, t, lbl::jsonb
FROM s, (VALUES
  (1, 'Gravidade do problema para iniciar o sono.',                 '{"0":"Nenhum","1":"Leve","2":"Moderado","3":"Grave","4":"Muito grave"}'),
  (2, 'Gravidade do problema para manter o sono.',                  '{"0":"Nenhum","1":"Leve","2":"Moderado","3":"Grave","4":"Muito grave"}'),
  (3, 'Gravidade do problema de acordar muito cedo.',               '{"0":"Nenhum","1":"Leve","2":"Moderado","3":"Grave","4":"Muito grave"}'),
  (4, 'Quão satisfeito(a)/insatisfeito(a) você está com seu sono atual?', '{"0":"Muito satisfeito","1":"Satisfeito","2":"Neutro","3":"Insatisfeito","4":"Muito insatisfeito"}'),
  (5, 'O quanto seu problema de sono é perceptível para os outros em termos de prejudicar sua qualidade de vida?', '{"0":"Nada","1":"Um pouco","2":"Mais ou menos","3":"Muito","4":"Demais"}'),
  (6, 'O quanto você está preocupado(a) com seu problema atual de sono?', '{"0":"Nada","1":"Um pouco","2":"Mais ou menos","3":"Muito","4":"Demais"}'),
  (7, 'Em que medida seu problema de sono interfere no seu funcionamento diário (cansaço, humor, trabalho, concentração)?', '{"0":"Nada","1":"Um pouco","2":"Mais ou menos","3":"Muito","4":"Demais"}')
) v(p, t, lbl);
