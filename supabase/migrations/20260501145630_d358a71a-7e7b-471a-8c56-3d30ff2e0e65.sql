
-- 1) Detected themes per mood entry
CREATE TABLE public.mood_detected_themes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  mood_entry_id UUID NOT NULL REFERENCES public.mood_entries(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  theme TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'outros',
  sentiment TEXT NOT NULL DEFAULT 'neutro',
  confidence NUMERIC(3,2) NOT NULL DEFAULT 0.5,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
CREATE INDEX idx_mood_themes_user ON public.mood_detected_themes(user_id);
CREATE INDEX idx_mood_themes_entry ON public.mood_detected_themes(mood_entry_id);
CREATE INDEX idx_mood_themes_theme ON public.mood_detected_themes(user_id, theme);

ALTER TABLE public.mood_detected_themes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_themes_select" ON public.mood_detected_themes
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "users_own_themes_insert" ON public.mood_detected_themes
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users_own_themes_update" ON public.mood_detected_themes
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "users_own_themes_delete" ON public.mood_detected_themes
  FOR DELETE USING (auth.uid() = user_id);

-- 2) Period analyses (week/month aggregated insights)
CREATE TABLE public.mood_period_analyses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  period_type TEXT NOT NULL DEFAULT 'week',
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  summary TEXT,
  positive_patterns JSONB DEFAULT '[]'::jsonb,
  attention_points JSONB DEFAULT '[]'::jsonb,
  suggested_actions JSONB DEFAULT '[]'::jsonb,
  dominant_themes JSONB DEFAULT '[]'::jsonb,
  metrics_snapshot JSONB DEFAULT '{}'::jsonb,
  entries_count INTEGER NOT NULL DEFAULT 0,
  risk_level TEXT DEFAULT 'healthy',
  confidence TEXT DEFAULT 'low',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, period_type, period_start)
);
CREATE INDEX idx_mood_period_user ON public.mood_period_analyses(user_id, period_start DESC);

ALTER TABLE public.mood_period_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_period_select" ON public.mood_period_analyses
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "users_own_period_insert" ON public.mood_period_analyses
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users_own_period_update" ON public.mood_period_analyses
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "users_own_period_delete" ON public.mood_period_analyses
  FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_mood_period_updated_at
  BEFORE UPDATE ON public.mood_period_analyses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3) Buddy contextual memory (one row per user)
CREATE TABLE public.mood_buddy_memory (
  user_id UUID NOT NULL PRIMARY KEY,
  recent_themes JSONB DEFAULT '[]'::jsonb,
  recent_observations JSONB DEFAULT '[]'::jsonb,
  preferred_tone TEXT DEFAULT 'acolhedor',
  last_message_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.mood_buddy_memory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_buddy_select" ON public.mood_buddy_memory
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "users_own_buddy_insert" ON public.mood_buddy_memory
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users_own_buddy_update" ON public.mood_buddy_memory
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "users_own_buddy_delete" ON public.mood_buddy_memory
  FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_mood_buddy_updated_at
  BEFORE UPDATE ON public.mood_buddy_memory
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4) User consistency goals
CREATE TABLE public.mood_user_goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  goal_type TEXT NOT NULL DEFAULT 'entries_per_week',
  target_value INTEGER NOT NULL DEFAULT 5,
  period TEXT NOT NULL DEFAULT 'week',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
CREATE INDEX idx_mood_goals_user ON public.mood_user_goals(user_id, is_active);

ALTER TABLE public.mood_user_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_goals_select" ON public.mood_user_goals
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "users_own_goals_insert" ON public.mood_user_goals
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users_own_goals_update" ON public.mood_user_goals
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "users_own_goals_delete" ON public.mood_user_goals
  FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_mood_goals_updated_at
  BEFORE UPDATE ON public.mood_user_goals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5) Aggregated anonymized institutional view (function-based, respects k-anonymity)
CREATE OR REPLACE FUNCTION public.get_institution_mood_aggregates(
  p_institution_id UUID,
  p_period_days INTEGER DEFAULT 30
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSONB;
  v_user_count INTEGER;
BEGIN
  -- Permission check: only institution admins or super admins
  IF NOT (
    has_role(auth.uid(), 'super_admin'::app_role)
    OR EXISTS (
      SELECT 1 FROM institution_users
      WHERE user_id = auth.uid()
        AND institution_id = p_institution_id
        AND role = 'admin'
        AND is_active = true
    )
  ) THEN
    RAISE EXCEPTION 'access denied';
  END IF;

  -- Count distinct users with entries in period (k-anonymity threshold = 5)
  SELECT COUNT(DISTINCT me.user_id) INTO v_user_count
  FROM mood_entries me
  JOIN patient_institutions pi ON pi.patient_id IN (
    SELECT id FROM pacientes WHERE profile_id IN (
      SELECT id FROM profiles WHERE user_id = me.user_id
    )
  )
  WHERE pi.institution_id = p_institution_id
    AND me.date >= CURRENT_DATE - (p_period_days || ' days')::interval;

  IF v_user_count < 5 THEN
    RETURN jsonb_build_object(
      'available', false,
      'reason', 'insufficient_users',
      'min_required', 5,
      'current', v_user_count
    );
  END IF;

  SELECT jsonb_build_object(
    'available', true,
    'period_days', p_period_days,
    'unique_users', v_user_count,
    'total_entries', COUNT(*),
    'avg_mood', ROUND(AVG(me.mood_score)::numeric, 2),
    'avg_energy', ROUND(AVG(me.energy_level)::numeric, 2),
    'avg_anxiety', ROUND(AVG(me.anxiety_level)::numeric, 2),
    'avg_sleep_hours', ROUND(AVG(me.sleep_hours)::numeric, 2),
    'avg_sleep_quality', ROUND(AVG(me.sleep_quality)::numeric, 2),
    'risk_distribution', (
      SELECT jsonb_object_agg(risk_level, cnt)
      FROM (
        SELECT mea.risk_level::text AS risk_level, COUNT(*) AS cnt
        FROM mood_entry_analyses mea
        JOIN mood_entries me2 ON me2.id = mea.mood_entry_id
        JOIN patient_institutions pi2 ON pi2.patient_id IN (
          SELECT id FROM pacientes WHERE profile_id IN (
            SELECT id FROM profiles WHERE user_id = me2.user_id
          )
        )
        WHERE pi2.institution_id = p_institution_id
          AND me2.date >= CURRENT_DATE - (p_period_days || ' days')::interval
        GROUP BY mea.risk_level
      ) rd
    )
  ) INTO result
  FROM mood_entries me
  JOIN patient_institutions pi ON pi.patient_id IN (
    SELECT id FROM pacientes WHERE profile_id IN (
      SELECT id FROM profiles WHERE user_id = me.user_id
    )
  )
  WHERE pi.institution_id = p_institution_id
    AND me.date >= CURRENT_DATE - (p_period_days || ' days')::interval;

  RETURN result;
END;
$$;
