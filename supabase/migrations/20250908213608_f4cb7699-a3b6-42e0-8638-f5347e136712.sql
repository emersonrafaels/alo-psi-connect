-- Criar cron job para cancelamento automático de agendamentos vencidos
-- Executa a cada hora (0 * * * *)
SELECT cron.schedule(
  'auto-cancel-unpaid-appointments',
  '0 * * * *', -- A cada hora
  $$
  SELECT
    net.http_post(
        url:='https://mbuljmpamdocnxppueww.supabase.co/functions/v1/auto-cancel-unpaid-appointments',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1idWxqbXBhbWRvY254cHB1ZXd3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYwMTMxNzUsImV4cCI6MjA3MTU4OTE3NX0.byP_5kv4bwOSpenNl0giMneBNv7396XjWkFMOwc_ttY"}'::jsonb,
        body:='{"scheduled": true}'::jsonb
    ) as request_id;
  $$
);