
ALTER TABLE public.buddy_portraits
  ADD COLUMN IF NOT EXISTS sleep_quality int,
  ADD COLUMN IF NOT EXISTS stress_level int,
  ADD COLUMN IF NOT EXISTS energy_level int,
  ADD COLUMN IF NOT EXISTS three_words text[],
  ADD COLUMN IF NOT EXISTS strengths_self text[],
  ADD COLUMN IF NOT EXISTS next_3_months text,
  ADD COLUMN IF NOT EXISTS biggest_challenge text,
  ADD COLUMN IF NOT EXISTS support_people text,
  ADD COLUMN IF NOT EXISTS self_care_rituals text[],
  ADD COLUMN IF NOT EXISTS hobbies text[],
  ADD COLUMN IF NOT EXISTS avoid_situations text[],
  ADD COLUMN IF NOT EXISTS ask_help_ease int,
  ADD COLUMN IF NOT EXISTS preferred_tone text,
  ADD COLUMN IF NOT EXISTS reminder_time text,
  ADD COLUMN IF NOT EXISTS audio_answers jsonb DEFAULT '{}'::jsonb;
