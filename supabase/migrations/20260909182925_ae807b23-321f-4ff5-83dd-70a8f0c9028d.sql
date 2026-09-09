ALTER TABLE public.journey_sessions
  ADD COLUMN IF NOT EXISTS phase text DEFAULT 'perceive',
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'started',
  ADD COLUMN IF NOT EXISTS focus_mode text,
  ADD COLUMN IF NOT EXISTS comprehension jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS action jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS immediate_regulation jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS learning_practice jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS completed_at timestamptz;

ALTER TABLE public.journey_sessions ALTER COLUMN emotion_id DROP NOT NULL;

CREATE POLICY "Users update own journey sessions"
  ON public.journey_sessions FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TABLE IF NOT EXISTS public.journey_session_emotions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.journey_sessions(id) ON DELETE CASCADE,
  user_id uuid,
  emotion_id text NOT NULL,
  family_id text,
  emotion_level smallint NOT NULL DEFAULT 2,
  intensity_before smallint,
  intensity_after smallint,
  is_focus boolean NOT NULL DEFAULT false,
  position smallint NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.journey_session_emotions TO authenticated;
GRANT INSERT ON public.journey_session_emotions TO anon;
GRANT ALL ON public.journey_session_emotions TO service_role;

ALTER TABLE public.journey_session_emotions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own journey emotions"
  ON public.journey_session_emotions FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users insert own journey emotions"
  ON public.journey_session_emotions FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users update own journey emotions"
  ON public.journey_session_emotions FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "Guests insert anonymous journey emotions"
  ON public.journey_session_emotions FOR INSERT TO anon
  WITH CHECK (user_id IS NULL);

CREATE INDEX IF NOT EXISTS journey_session_emotions_session_idx
  ON public.journey_session_emotions(session_id);
CREATE INDEX IF NOT EXISTS journey_session_emotions_user_idx
  ON public.journey_session_emotions(user_id, emotion_id);

CREATE OR REPLACE FUNCTION public.journey_landscape(_user_id uuid)
RETURNS TABLE(emotion_id text, family_id text, occurrences bigint, avg_intensity numeric, last_at timestamptz)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT e.emotion_id,
         max(e.family_id) AS family_id,
         count(*)::bigint AS occurrences,
         round(avg(coalesce(e.intensity_before, 3))::numeric, 2) AS avg_intensity,
         max(e.created_at) AS last_at
  FROM public.journey_session_emotions e
  WHERE e.user_id = _user_id
  GROUP BY e.emotion_id
  ORDER BY occurrences DESC
$$;

CREATE OR REPLACE FUNCTION public.journey_next_resource(_user_id uuid)
RETURNS TABLE(practice_id text, times_seen bigint, avg_usefulness numeric, last_at timestamptz)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT s.practice_id,
         count(*)::bigint AS times_seen,
         round(avg(s.usefulness)::numeric, 2) AS avg_usefulness,
         max(s.created_at) AS last_at
  FROM public.journey_sessions s
  WHERE s.user_id = _user_id AND s.practice_id IS NOT NULL
  GROUP BY s.practice_id
  ORDER BY last_at DESC
$$;

REVOKE ALL ON FUNCTION public.journey_landscape(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.journey_landscape(uuid) TO authenticated, service_role;
REVOKE ALL ON FUNCTION public.journey_next_resource(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.journey_next_resource(uuid) TO authenticated, service_role;