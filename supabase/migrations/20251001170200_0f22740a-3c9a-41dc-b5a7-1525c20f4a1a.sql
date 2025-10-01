-- Create default emotion types table
CREATE TABLE IF NOT EXISTS public.default_emotion_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  emotion_type text NOT NULL UNIQUE,
  display_name text NOT NULL,
  description text,
  default_scale_min integer DEFAULT 1,
  default_scale_max integer DEFAULT 10,
  default_emoji_set jsonb,
  default_color_scheme jsonb,
  category text DEFAULT 'general',
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now()
);

-- Create user emotion configurations table
CREATE TABLE IF NOT EXISTS public.emotion_configurations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  emotion_type text NOT NULL,
  display_name text NOT NULL,
  description text,
  scale_min integer DEFAULT 1,
  scale_max integer DEFAULT 10,
  emoji_set jsonb,
  color_scheme jsonb,
  is_enabled boolean DEFAULT true,
  order_position integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, emotion_type)
);

-- Add emotion_values column to mood_entries
ALTER TABLE public.mood_entries ADD COLUMN IF NOT EXISTS emotion_values jsonb DEFAULT '{}';

-- Enable RLS
ALTER TABLE public.default_emotion_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emotion_configurations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for default_emotion_types (public read)
CREATE POLICY "Anyone can view default emotion types"
ON public.default_emotion_types FOR SELECT
USING (true);

-- RLS Policies for emotion_configurations
CREATE POLICY "Users can view their own emotion configurations"
ON public.emotion_configurations FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own emotion configurations"
ON public.emotion_configurations FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own emotion configurations"
ON public.emotion_configurations FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own emotion configurations"
ON public.emotion_configurations FOR DELETE
USING (auth.uid() = user_id);

-- Admins can manage all emotion configurations
CREATE POLICY "Admins can view all emotion configurations"
ON public.emotion_configurations FOR SELECT
USING (is_admin(auth.uid()));

CREATE POLICY "Admins can manage default emotion types"
ON public.default_emotion_types FOR ALL
USING (is_admin(auth.uid()));

-- Insert default emotion types
INSERT INTO public.default_emotion_types (emotion_type, display_name, description, default_scale_min, default_scale_max, default_emoji_set, default_color_scheme, category) VALUES
-- Basic emotions
('mood', 'Humor', 'Como você está se sentindo hoje?', 1, 10, 
  '{"1": "😢", "2": "😞", "3": "😕", "4": "😐", "5": "🙂", "6": "😊", "7": "😄", "8": "😃", "9": "😁", "10": "🤩"}',
  '{"low": "hsl(0, 70%, 50%)", "mid": "hsl(45, 100%, 50%)", "high": "hsl(120, 60%, 50%)"}',
  'basic'),
('energy', 'Energia', 'Qual seu nível de energia?', 1, 10,
  '{"1": "😴", "2": "🥱", "3": "😪", "4": "😑", "5": "😐", "6": "🙂", "7": "😊", "8": "💪", "9": "⚡", "10": "🔥"}',
  '{"low": "hsl(210, 50%, 40%)", "mid": "hsl(45, 100%, 50%)", "high": "hsl(30, 100%, 50%)"}',
  'basic'),
('anxiety', 'Ansiedade', 'Como está sua ansiedade?', 1, 10,
  '{"1": "😌", "2": "🙂", "3": "😐", "4": "😕", "5": "😟", "6": "😰", "7": "😨", "8": "😱", "9": "😵", "10": "🤯"}',
  '{"low": "hsl(120, 60%, 50%)", "mid": "hsl(45, 100%, 50%)", "high": "hsl(0, 70%, 50%)"}',
  'basic'),

-- Advanced emotions
('stress', 'Estresse', 'Nível de estresse percebido', 1, 10,
  '{"1": "😌", "2": "🙂", "3": "😐", "4": "😕", "5": "😤", "6": "😠", "7": "😡", "8": "🤬", "9": "😵", "10": "💥"}',
  '{"low": "hsl(120, 60%, 50%)", "mid": "hsl(45, 100%, 50%)", "high": "hsl(0, 70%, 50%)"}',
  'advanced'),
('motivation', 'Motivação', 'Quão motivado você se sente?', 1, 10,
  '{"1": "😞", "2": "😕", "3": "😐", "4": "🙂", "5": "😊", "6": "😄", "7": "💪", "8": "🔥", "9": "🚀", "10": "⭐"}',
  '{"low": "hsl(210, 50%, 40%)", "mid": "hsl(45, 100%, 50%)", "high": "hsl(280, 70%, 50%)"}',
  'advanced'),
('focus', 'Foco', 'Capacidade de concentração', 1, 10,
  '{"1": "😵", "2": "😵‍💫", "3": "😕", "4": "😐", "5": "🙂", "6": "😊", "7": "🎯", "8": "👁️", "9": "🧠", "10": "💎"}',
  '{"low": "hsl(0, 70%, 50%)", "mid": "hsl(45, 100%, 50%)", "high": "hsl(200, 70%, 50%)"}',
  'advanced'),

-- Wellbeing emotions
('gratitude', 'Gratidão', 'Sentimento de gratidão', 1, 10,
  '{"1": "😔", "2": "😕", "3": "😐", "4": "🙂", "5": "😊", "6": "😄", "7": "💝", "8": "🙏", "9": "✨", "10": "🌟"}',
  '{"low": "hsl(210, 50%, 40%)", "mid": "hsl(45, 100%, 50%)", "high": "hsl(320, 70%, 60%)"}',
  'wellbeing'),
('hope', 'Esperança', 'Nível de esperança e otimismo', 1, 10,
  '{"1": "😞", "2": "😕", "3": "😐", "4": "🙂", "5": "😊", "6": "😄", "7": "🌈", "8": "✨", "9": "🌟", "10": "💫"}',
  '{"low": "hsl(210, 50%, 40%)", "mid": "hsl(45, 100%, 50%)", "high": "hsl(200, 70%, 60%)"}',
  'wellbeing'),
('confidence', 'Confiança', 'Autoconfiança', 1, 10,
  '{"1": "😰", "2": "😟", "3": "😕", "4": "😐", "5": "🙂", "6": "😊", "7": "😎", "8": "💪", "9": "👑", "10": "⭐"}',
  '{"low": "hsl(0, 70%, 50%)", "mid": "hsl(45, 100%, 50%)", "high": "hsl(280, 70%, 50%)"}',
  'wellbeing'),

-- Professional emotions
('productivity', 'Produtividade', 'Quão produtivo você se sentiu?', 1, 10,
  '{"1": "😴", "2": "😕", "3": "😐", "4": "🙂", "5": "😊", "6": "💼", "7": "⚡", "8": "🚀", "9": "🎯", "10": "🏆"}',
  '{"low": "hsl(0, 70%, 50%)", "mid": "hsl(45, 100%, 50%)", "high": "hsl(120, 60%, 50%)"}',
  'professional'),
('creativity', 'Criatividade', 'Nível de criatividade', 1, 10,
  '{"1": "😶", "2": "😐", "3": "🙂", "4": "😊", "5": "💡", "6": "🎨", "7": "✨", "8": "🌈", "9": "🎭", "10": "🚀"}',
  '{"low": "hsl(210, 50%, 40%)", "mid": "hsl(45, 100%, 50%)", "high": "hsl(280, 70%, 50%)"}',
  'professional'),
('satisfaction', 'Satisfação', 'Satisfação geral com o dia', 1, 10,
  '{"1": "😞", "2": "😕", "3": "😐", "4": "🙂", "5": "😊", "6": "😄", "7": "😁", "8": "🤩", "9": "🌟", "10": "💯"}',
  '{"low": "hsl(0, 70%, 50%)", "mid": "hsl(45, 100%, 50%)", "high": "hsl(120, 60%, 50%)"}',
  'professional')
ON CONFLICT (emotion_type) DO NOTHING;

-- Create function to auto-update updated_at
CREATE OR REPLACE FUNCTION public.update_emotion_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER update_emotion_configurations_updated_at
BEFORE UPDATE ON public.emotion_configurations
FOR EACH ROW
EXECUTE FUNCTION public.update_emotion_config_updated_at();