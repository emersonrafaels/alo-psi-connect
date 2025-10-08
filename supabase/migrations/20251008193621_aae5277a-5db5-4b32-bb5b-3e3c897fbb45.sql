-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Enable pg_net extension for HTTP requests
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create a function to invoke the blog analytics aggregation
CREATE OR REPLACE FUNCTION public.invoke_blog_analytics_aggregation()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RAISE NOTICE '[Cron] Iniciando agregação automática de analytics do blog';
  
  -- Invoke the edge function via pg_net
  PERFORM net.http_post(
    url := 'https://mbuljmpamdocnxppueww.supabase.co/functions/v1/aggregate-blog-analytics',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1idWxqbXBhbWRvY254cHB1ZXd3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjAxMzE3NSwiZXhwIjoyMDcxNTg5MTc1fQ.gEYGW-B0S1AXjUY_2nRjlXSBH8Wa5BfZHKrRwx1HIOQ'
    ),
    body := jsonb_build_object(
      'mode', 'incremental',
      'include_today', false
    )
  );
  
  RAISE NOTICE '[Cron] Requisição de agregação enviada';
  
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING '[Cron] Erro ao invocar agregação de analytics: %', SQLERRM;
END;
$$;

-- Schedule the cron job to run daily at 00:05 (5 minutes after midnight)
SELECT cron.schedule(
  'aggregate-blog-analytics-daily',
  '5 0 * * *', -- Every day at 00:05 UTC
  $$
  SELECT public.invoke_blog_analytics_aggregation();
  $$
);

-- Log the cron job creation
DO $$
BEGIN
  RAISE NOTICE 'Cron job "aggregate-blog-analytics-daily" criado com sucesso';
  RAISE NOTICE 'Agenda: Todos os dias às 00:05 UTC';
  RAISE NOTICE 'Função: aggregate-blog-analytics com mode=incremental';
END $$;