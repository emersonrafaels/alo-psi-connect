
ALTER TABLE public.educational_institutions
  ADD COLUMN IF NOT EXISTS benchmark_opt_in boolean NOT NULL DEFAULT false;

ALTER TABLE public.buddy_insights
  ADD COLUMN IF NOT EXISTS institution_id uuid REFERENCES public.educational_institutions(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS insight_type text,
  ADD COLUMN IF NOT EXISTS payload jsonb;

ALTER TABLE public.buddy_insights
  ALTER COLUMN patient_id DROP NOT NULL;

CREATE INDEX IF NOT EXISTS idx_buddy_insights_inst_type_created
  ON public.buddy_insights (institution_id, insight_type, created_at DESC);

-- Policies for institution-scoped insights
DROP POLICY IF EXISTS "Institution insights readable by institution users" ON public.buddy_insights;
CREATE POLICY "Institution insights readable by institution users"
  ON public.buddy_insights FOR SELECT
  TO authenticated
  USING (
    institution_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.institution_users iu
      WHERE iu.institution_id = buddy_insights.institution_id
        AND iu.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Service role manages institution insights" ON public.buddy_insights;
CREATE POLICY "Service role manages institution insights"
  ON public.buddy_insights FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.get_network_benchmark_aggregates(period_days integer DEFAULT 30)
RETURNS TABLE(
  institutions_count integer,
  avg_mood numeric,
  avg_anxiety numeric,
  avg_energy numeric,
  avg_sleep numeric,
  engagement_rate numeric,
  resolution_rate numeric
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  inst_count integer;
BEGIN
  SELECT COUNT(*) INTO inst_count FROM public.educational_institutions WHERE benchmark_opt_in = true;
  IF inst_count < 3 THEN
    RETURN QUERY SELECT inst_count, NULL::numeric, NULL::numeric, NULL::numeric, NULL::numeric, NULL::numeric, NULL::numeric;
    RETURN;
  END IF;

  RETURN QUERY
  WITH opted AS (
    SELECT id FROM public.educational_institutions WHERE benchmark_opt_in = true
  ),
  inst_students AS (
    SELECT pi.institution_id AS inst_id, pi.patient_id
    FROM public.patient_institutions pi
    WHERE pi.institution_id IN (SELECT id FROM opted)
  ),
  entries AS (
    SELECT me.profile_id, me.emotion_values, ins.inst_id
    FROM public.mood_entries me
    JOIN public.pacientes p ON p.id = me.profile_id
    JOIN inst_students ins ON ins.patient_id = p.id
    WHERE me.date >= (CURRENT_DATE - (period_days || ' days')::interval)::date
  ),
  per_inst_totals AS (
    SELECT inst_id, COUNT(*)::numeric AS total_students
    FROM inst_students GROUP BY inst_id
  ),
  metrics AS (
    SELECT e.inst_id,
      AVG((e.emotion_values->>'humor')::numeric) FILTER (WHERE e.emotion_values ? 'humor') AS m_hum,
      AVG((e.emotion_values->>'ansiedade')::numeric) FILTER (WHERE e.emotion_values ? 'ansiedade') AS m_anx,
      AVG((e.emotion_values->>'energia')::numeric) FILTER (WHERE e.emotion_values ? 'energia') AS m_en,
      AVG((e.emotion_values->>'sono')::numeric) FILTER (WHERE e.emotion_values ? 'sono') AS m_sl,
      COUNT(DISTINCT e.profile_id)::numeric AS active_students
    FROM entries e
    GROUP BY e.inst_id
  ),
  engagement AS (
    SELECT m.inst_id, m.m_hum, m.m_anx, m.m_en, m.m_sl,
      m.active_students / NULLIF(t.total_students, 0) AS eng
    FROM metrics m
    JOIN per_inst_totals t ON t.inst_id = m.inst_id
  ),
  triage_stats AS (
    SELECT st.institution_id AS inst_id,
      COUNT(*) FILTER (WHERE st.status='resolved')::numeric / NULLIF(COUNT(*),0) AS resolution
    FROM public.student_triage st
    WHERE st.institution_id IN (SELECT id FROM opted)
      AND st.created_at >= (now() - (period_days || ' days')::interval)
    GROUP BY st.institution_id
  )
  SELECT
    inst_count,
    ROUND(AVG(eng.m_hum)::numeric, 2),
    ROUND(AVG(eng.m_anx)::numeric, 2),
    ROUND(AVG(eng.m_en)::numeric, 2),
    ROUND(AVG(eng.m_sl)::numeric, 2),
    ROUND(AVG(eng.eng)::numeric, 3),
    ROUND(AVG(t.resolution)::numeric, 3)
  FROM engagement eng
  FULL OUTER JOIN triage_stats t ON t.inst_id = eng.inst_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_network_benchmark_aggregates(integer) TO authenticated, service_role;
