-- Create mood entries table
CREATE TABLE public.mood_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  date date NOT NULL,
  mood_score integer CHECK (mood_score >= 1 AND mood_score <= 10),
  energy_level integer CHECK (energy_level >= 1 AND energy_level <= 5),
  anxiety_level integer CHECK (anxiety_level >= 1 AND anxiety_level <= 5),
  sleep_hours numeric(3,1),
  sleep_quality integer CHECK (sleep_quality >= 1 AND sleep_quality <= 5),
  journal_text text,
  tags text[],
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, date)
);

-- Create mood factors table
CREATE TABLE public.mood_factors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mood_entry_id uuid REFERENCES public.mood_entries(id) ON DELETE CASCADE,
  factor_type text NOT NULL,
  factor_value jsonb,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.mood_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mood_factors ENABLE ROW LEVEL SECURITY;

-- RLS policies for mood_entries
CREATE POLICY "Users can view their own mood entries"
ON public.mood_entries
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own mood entries"
ON public.mood_entries
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own mood entries"
ON public.mood_entries
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own mood entries"
ON public.mood_entries
FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all mood entries"
ON public.mood_entries
FOR SELECT
USING (is_admin(auth.uid()));

-- RLS policies for mood_factors
CREATE POLICY "Users can view factors for their mood entries"
ON public.mood_factors
FOR SELECT
USING (mood_entry_id IN (
  SELECT id FROM public.mood_entries WHERE user_id = auth.uid()
));

CREATE POLICY "Users can insert factors for their mood entries"
ON public.mood_factors
FOR INSERT
WITH CHECK (mood_entry_id IN (
  SELECT id FROM public.mood_entries WHERE user_id = auth.uid()
));

CREATE POLICY "Users can update factors for their mood entries"
ON public.mood_factors
FOR UPDATE
USING (mood_entry_id IN (
  SELECT id FROM public.mood_entries WHERE user_id = auth.uid()
));

CREATE POLICY "Users can delete factors for their mood entries"
ON public.mood_factors
FOR DELETE
USING (mood_entry_id IN (
  SELECT id FROM public.mood_entries WHERE user_id = auth.uid()
));

CREATE POLICY "Admins can view all mood factors"
ON public.mood_factors
FOR SELECT
USING (is_admin(auth.uid()));

-- Create trigger for updating updated_at
CREATE TRIGGER update_mood_entries_updated_at
BEFORE UPDATE ON public.mood_entries
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();