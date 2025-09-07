-- Grant permissions to anon role for agendamentos table
GRANT INSERT, SELECT ON public.agendamentos TO anon;
GRANT SELECT ON public.profiles TO anon;

-- Grant usage on sequence if needed
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon;