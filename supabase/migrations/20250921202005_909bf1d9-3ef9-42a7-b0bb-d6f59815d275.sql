-- Create table for AI insights history with feedback system
CREATE TABLE public.ai_insights_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  session_id TEXT,
  insight_content TEXT NOT NULL,
  mood_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Feedback system
  feedback_rating BOOLEAN, -- true = gostou, false = não gostou
  feedback_comment TEXT,
  feedback_submitted_at TIMESTAMP WITH TIME ZONE
);

-- Enable Row Level Security
ALTER TABLE public.ai_insights_history ENABLE ROW LEVEL SECURITY;

-- Create policies for insights history
CREATE POLICY "Users can view their own insights history" 
ON public.ai_insights_history 
FOR SELECT 
USING ((auth.uid() = user_id) OR ((user_id IS NULL) AND (session_id IS NOT NULL)));

CREATE POLICY "Users can insert their own insights history" 
ON public.ai_insights_history 
FOR INSERT 
WITH CHECK ((auth.uid() = user_id) OR ((user_id IS NULL) AND (session_id IS NOT NULL)));

CREATE POLICY "Users can update their own insights feedback" 
ON public.ai_insights_history 
FOR UPDATE 
USING ((auth.uid() = user_id) OR ((user_id IS NULL) AND (session_id IS NOT NULL)));

-- Create index for better performance
CREATE INDEX idx_ai_insights_history_user_id ON public.ai_insights_history(user_id);
CREATE INDEX idx_ai_insights_history_session_id ON public.ai_insights_history(session_id);
CREATE INDEX idx_ai_insights_history_created_at ON public.ai_insights_history(created_at DESC);