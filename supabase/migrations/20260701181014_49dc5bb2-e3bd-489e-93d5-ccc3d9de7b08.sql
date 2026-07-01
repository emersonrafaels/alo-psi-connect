
CREATE OR REPLACE FUNCTION public.current_patient_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT p.id FROM public.pacientes p
  JOIN public.profiles pr ON pr.id = p.profile_id
  WHERE pr.user_id = auth.uid() LIMIT 1
$$;

CREATE TABLE public.buddy_professional_consent (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES public.pacientes(id) ON DELETE CASCADE,
  professional_id bigint NOT NULL REFERENCES public.profissionais(id) ON DELETE CASCADE,
  scope text NOT NULL DEFAULT 'both' CHECK (scope IN ('portrait','insights','both')),
  granted_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz,
  UNIQUE (patient_id, professional_id, scope)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.buddy_professional_consent TO authenticated;
GRANT ALL ON public.buddy_professional_consent TO service_role;
ALTER TABLE public.buddy_professional_consent ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Patients manage own consent" ON public.buddy_professional_consent
  FOR ALL USING (patient_id = public.current_patient_id())
  WITH CHECK (patient_id = public.current_patient_id());
CREATE POLICY "Professionals view own consent rows" ON public.buddy_professional_consent
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profissionais p
      JOIN public.profiles pr ON pr.id = p.profile_id
      WHERE p.id = buddy_professional_consent.professional_id AND pr.user_id = auth.uid())
  );

CREATE OR REPLACE FUNCTION public.has_buddy_consent(_patient_id uuid, _scope text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.buddy_professional_consent c
    JOIN public.profissionais prof ON prof.id = c.professional_id
    JOIN public.profiles pr ON pr.id = prof.profile_id
    WHERE c.patient_id = _patient_id AND pr.user_id = auth.uid()
      AND c.revoked_at IS NULL AND (c.scope = _scope OR c.scope = 'both')
  )
$$;

CREATE TABLE public.buddy_portraits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL UNIQUE REFERENCES public.pacientes(id) ON DELETE CASCADE,
  mind_on text,
  calms_me text,
  wants_to_improve text[] DEFAULT '{}'::text[],
  dreams text,
  message_to_buddy text,
  triggers text[] DEFAULT '{}'::text[],
  values_list text[] DEFAULT '{}'::text[],
  current_mood text,
  anxiety int CHECK (anxiety BETWEEN 0 AND 10),
  sadness int CHECK (sadness BETWEEN 0 AND 10),
  motivation int CHECK (motivation BETWEEN 0 AND 10),
  audio_url text,
  privacy text NOT NULL DEFAULT 'only_me' CHECK (privacy IN ('only_me','with_professionals')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.buddy_portraits TO authenticated;
GRANT ALL ON public.buddy_portraits TO service_role;
ALTER TABLE public.buddy_portraits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Patients manage own portrait" ON public.buddy_portraits
  FOR ALL USING (patient_id = public.current_patient_id())
  WITH CHECK (patient_id = public.current_patient_id());
CREATE POLICY "Consented professionals view portrait" ON public.buddy_portraits
  FOR SELECT USING (public.has_buddy_consent(patient_id, 'portrait'));

CREATE TABLE public.buddy_insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES public.pacientes(id) ON DELETE CASCADE,
  period_start date NOT NULL,
  period_end date NOT NULL,
  wellbeing_score numeric(4,2),
  emotional_stability numeric(4,2),
  sleep_quality numeric(4,2),
  habit_consistency numeric(4,2),
  strengths jsonb NOT NULL DEFAULT '[]'::jsonb,
  attention_points jsonb NOT NULL DEFAULT '[]'::jsonb,
  map_topics jsonb NOT NULL DEFAULT '[]'::jsonb,
  sources jsonb NOT NULL DEFAULT '{}'::jsonb,
  narrative text,
  recommendations jsonb NOT NULL DEFAULT '[]'::jsonb,
  model text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX buddy_insights_patient_created_idx ON public.buddy_insights (patient_id, created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.buddy_insights TO authenticated;
GRANT ALL ON public.buddy_insights TO service_role;
ALTER TABLE public.buddy_insights ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Patients view own insights" ON public.buddy_insights
  FOR SELECT USING (patient_id = public.current_patient_id());
CREATE POLICY "Patients insert own insights" ON public.buddy_insights
  FOR INSERT WITH CHECK (patient_id = public.current_patient_id());
CREATE POLICY "Consented professionals view insights" ON public.buddy_insights
  FOR SELECT USING (public.has_buddy_consent(patient_id, 'insights'));

CREATE TABLE public.buddy_recommendations_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES public.pacientes(id) ON DELETE CASCADE,
  recommendation_id text NOT NULL,
  action text NOT NULL CHECK (action IN ('accepted','dismissed','done')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX buddy_feedback_patient_idx ON public.buddy_recommendations_feedback (patient_id, created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.buddy_recommendations_feedback TO authenticated;
GRANT ALL ON public.buddy_recommendations_feedback TO service_role;
ALTER TABLE public.buddy_recommendations_feedback ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Patients manage own feedback" ON public.buddy_recommendations_feedback
  FOR ALL USING (patient_id = public.current_patient_id())
  WITH CHECK (patient_id = public.current_patient_id());

CREATE OR REPLACE FUNCTION public.buddy_touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;
CREATE TRIGGER buddy_portraits_touch BEFORE UPDATE ON public.buddy_portraits
FOR EACH ROW EXECUTE FUNCTION public.buddy_touch_updated_at();
