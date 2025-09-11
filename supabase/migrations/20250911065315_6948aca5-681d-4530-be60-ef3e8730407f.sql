-- Adicionar colunas para tokens do Google Calendar na tabela profiles
ALTER TABLE public.profiles 
ADD COLUMN google_calendar_token TEXT,
ADD COLUMN google_calendar_refresh_token TEXT;