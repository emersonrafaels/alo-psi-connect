-- Create AI chat sessions table for memory window
CREATE TABLE public.ai_chat_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  session_id TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  metadata JSONB
);

-- Create AI chat messages table for conversation history
CREATE TABLE public.ai_chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  metadata JSONB,
  FOREIGN KEY (session_id) REFERENCES ai_chat_sessions(session_id) ON DELETE CASCADE
);

-- Enable Row Level Security
ALTER TABLE public.ai_chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_chat_messages ENABLE ROW LEVEL SECURITY;

-- Create policies for ai_chat_sessions
CREATE POLICY "Users can view their own chat sessions" 
ON public.ai_chat_sessions 
FOR SELECT 
USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Anyone can create chat sessions" 
ON public.ai_chat_sessions 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can update their own chat sessions" 
ON public.ai_chat_sessions 
FOR UPDATE 
USING (auth.uid() = user_id OR user_id IS NULL);

-- Create policies for ai_chat_messages
CREATE POLICY "Users can view messages from their sessions" 
ON public.ai_chat_messages 
FOR SELECT 
USING (session_id IN (
  SELECT session_id FROM ai_chat_sessions 
  WHERE auth.uid() = user_id OR user_id IS NULL
));

CREATE POLICY "Anyone can create chat messages" 
ON public.ai_chat_messages 
FOR INSERT 
WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX idx_ai_chat_sessions_session_id ON public.ai_chat_sessions(session_id);
CREATE INDEX idx_ai_chat_sessions_user_id ON public.ai_chat_sessions(user_id);
CREATE INDEX idx_ai_chat_messages_session_id ON public.ai_chat_messages(session_id);
CREATE INDEX idx_ai_chat_messages_timestamp ON public.ai_chat_messages(timestamp);

-- Create trigger for updating timestamps
CREATE TRIGGER update_ai_chat_sessions_updated_at
BEFORE UPDATE ON public.ai_chat_sessions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to clean old chat sessions (older than 30 days)
CREATE OR REPLACE FUNCTION public.clean_old_chat_sessions()
RETURNS void AS $$
BEGIN
  DELETE FROM public.ai_chat_sessions 
  WHERE created_at < now() - interval '30 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;