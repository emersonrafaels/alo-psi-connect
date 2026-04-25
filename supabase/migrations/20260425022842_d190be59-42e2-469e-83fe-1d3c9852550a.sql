-- 1. Enum
DO $$ BEGIN
  CREATE TYPE public.mood_analysis_risk_level AS ENUM ('healthy', 'attention', 'alert', 'critical');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- 2. Tabela
CREATE TABLE IF NOT EXISTS public.mood_entry_analyses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  mood_entry_id UUID NOT NULL REFERENCES public.mood_entries(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  risk_level public.mood_analysis_risk_level,
  buddy_message TEXT,
  source TEXT NOT NULL DEFAULT 'manual',
  raw_payload JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mood_entry_analyses_entry ON public.mood_entry_analyses(mood_entry_id);
CREATE INDEX IF NOT EXISTS idx_mood_entry_analyses_user ON public.mood_entry_analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_mood_entry_analyses_risk ON public.mood_entry_analyses(risk_level);

DROP TRIGGER IF EXISTS update_mood_entry_analyses_updated_at ON public.mood_entry_analyses;
CREATE TRIGGER update_mood_entry_analyses_updated_at
  BEFORE UPDATE ON public.mood_entry_analyses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. RLS
ALTER TABLE public.mood_entry_analyses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own mood analyses" ON public.mood_entry_analyses;
CREATE POLICY "Users can view their own mood analyses"
  ON public.mood_entry_analyses FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own mood analyses" ON public.mood_entry_analyses;
CREATE POLICY "Users can insert their own mood analyses"
  ON public.mood_entry_analyses FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own mood analyses" ON public.mood_entry_analyses;
CREATE POLICY "Users can update their own mood analyses"
  ON public.mood_entry_analyses FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own mood analyses" ON public.mood_entry_analyses;
CREATE POLICY "Users can delete their own mood analyses"
  ON public.mood_entry_analyses FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Super admins manage all mood analyses" ON public.mood_entry_analyses;
CREATE POLICY "Super admins manage all mood analyses"
  ON public.mood_entry_analyses FOR ALL
  USING (public.has_role(auth.uid(), 'super_admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'::app_role));

DROP POLICY IF EXISTS "Institution admins view their students mood analyses" ON public.mood_entry_analyses;
CREATE POLICY "Institution admins view their students mood analyses"
  ON public.mood_entry_analyses FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.mood_entries me
      WHERE me.id = mood_entry_analyses.mood_entry_id
        AND me.profile_id IN (
          SELECT profile_id FROM public.get_student_profile_ids_for_institution_admin(auth.uid())
        )
    )
  );

-- 4. Backfill
INSERT INTO public.mood_entry_analyses (mood_entry_id, user_id, risk_level, buddy_message, source, raw_payload)
SELECT
  me.id,
  me.user_id,
  CASE LOWER(me.emotion_values->>'risk_level')
    WHEN 'normal'    THEN 'healthy'::public.mood_analysis_risk_level
    WHEN 'healthy'   THEN 'healthy'::public.mood_analysis_risk_level
    WHEN 'low'       THEN 'attention'::public.mood_analysis_risk_level
    WHEN 'attention' THEN 'attention'::public.mood_analysis_risk_level
    WHEN 'medium'    THEN 'alert'::public.mood_analysis_risk_level
    WHEN 'alert'     THEN 'alert'::public.mood_analysis_risk_level
    WHEN 'high'      THEN 'critical'::public.mood_analysis_risk_level
    WHEN 'critical'  THEN 'critical'::public.mood_analysis_risk_level
    ELSE NULL
  END,
  me.emotion_values->>'buddy_message',
  COALESCE(NULLIF(me.emotion_values->>'source', ''), 'evolution_api'),
  me.emotion_values
FROM public.mood_entries me
WHERE me.user_id IS NOT NULL
  AND me.emotion_values IS NOT NULL
  AND (me.emotion_values ? 'risk_level' OR me.emotion_values ? 'buddy_message')
  AND NOT EXISTS (SELECT 1 FROM public.mood_entry_analyses a WHERE a.mood_entry_id = me.id);

-- 5. Limpeza
UPDATE public.mood_entries
SET emotion_values = (emotion_values - 'risk_level' - 'buddy_message' - 'source' - 'phone' - 'channel' - 'analysis' - 'ai_response')
WHERE emotion_values IS NOT NULL
  AND (emotion_values ? 'risk_level' OR emotion_values ? 'buddy_message' OR emotion_values ? 'source'
       OR emotion_values ? 'phone' OR emotion_values ? 'channel' OR emotion_values ? 'analysis' OR emotion_values ? 'ai_response');