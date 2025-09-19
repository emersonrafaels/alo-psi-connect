-- Add audio_url column to mood_entries table
ALTER TABLE public.mood_entries 
ADD COLUMN audio_url text;

-- Create storage bucket for mood audio notes
INSERT INTO storage.buckets (id, name, public) 
VALUES ('mood-audio-notes', 'mood-audio-notes', false);

-- Create RLS policies for mood audio bucket
CREATE POLICY "Users can view their own mood audio files" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'mood-audio-notes' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their own mood audio files" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'mood-audio-notes' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own mood audio files" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'mood-audio-notes' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own mood audio files" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'mood-audio-notes' AND auth.uid()::text = (storage.foldername(name))[1]);