CREATE TABLE public.journey_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid,
  session_key text,
  tenant_id uuid,
  family_id text,
  emotion_id text NOT NULL,
  intensity_before smallint,
  intensity_after smallint,
  practice_id text,
  duration_minutes smallint,
  perceived_change_ids text[] NOT NULL DEFAULT '{}',
  usefulness smallint,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX journey_sessions_user_idx ON public.journey_sessions (user_id, created_at DESC);
CREATE INDEX journey_sessions_emotion_idx ON public.journey_sessions (emotion_id);

GRANT SELECT, INSERT ON public.journey_sessions TO authenticated;
GRANT INSERT ON public.journey_sessions TO anon;
GRANT ALL ON public.journey_sessions TO service_role;

ALTER TABLE public.journey_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own journey sessions"
  ON public.journey_sessions FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users insert own journey sessions"
  ON public.journey_sessions FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Guests insert anonymous journey sessions"
  ON public.journey_sessions FOR INSERT TO anon
  WITH CHECK (user_id IS NULL);

CREATE OR REPLACE FUNCTION public.journey_practice_stats(_emotion_id text)
RETURNS TABLE(practice_id text, sessions bigint, avg_relief numeric, relief_rate numeric)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT s.practice_id,
         count(*) AS sessions,
         round(avg(s.intensity_before - s.intensity_after)::numeric, 2) AS avg_relief,
         round((count(*) FILTER (WHERE s.intensity_after < s.intensity_before))::numeric
               / nullif(count(*), 0) * 100, 0) AS relief_rate
  FROM public.journey_sessions s
  WHERE s.emotion_id = _emotion_id
    AND s.practice_id IS NOT NULL
    AND s.intensity_before IS NOT NULL
    AND s.intensity_after IS NOT NULL
  GROUP BY s.practice_id
  HAVING count(*) >= 5
  ORDER BY relief_rate DESC NULLS LAST, sessions DESC
$$;

GRANT EXECUTE ON FUNCTION public.journey_practice_stats(text) TO anon, authenticated, service_role;