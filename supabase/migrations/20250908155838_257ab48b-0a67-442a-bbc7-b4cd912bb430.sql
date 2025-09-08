-- Set up cron job for auto-cancellation of unpaid appointments
-- This requires pg_cron extension which should be enabled in Supabase

-- Schedule the auto-cancel function to run every hour
SELECT cron.schedule(
  'auto-cancel-unpaid-appointments',
  '0 * * * *', -- Run at minute 0 of every hour
  $$
  SELECT
    net.http_post(
        url:='https://mbuljmpamdocnxppueww.supabase.co/functions/v1/auto-cancel-unpaid-appointments',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1idWxqbXBhbWRvY254cHB1ZXd3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYwMTMxNzUsImV4cCI6MjA3MTU4OTE3NX0.byP_5kv4bwOSpenNl0giMneBNv7396XjWkFMOwc_ttY"}'::jsonb,
        body:='{"scheduled": true}'::jsonb
    ) as request_id;
  $$
);