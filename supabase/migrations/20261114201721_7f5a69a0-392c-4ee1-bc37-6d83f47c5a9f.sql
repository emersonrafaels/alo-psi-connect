SELECT cron.unschedule('auto-cancel-unpaid-appointments');
SELECT cron.schedule(
  'auto-cancel-unpaid-appointments',
  '0 * * * *',
  $job$
  SELECT net.http_post(
    url := 'https://mbuljmpamdocnxppueww.supabase.co/functions/v1/auto-cancel-unpaid-appointments',
    headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || public.cron_service_key()),
    body := '{"scheduled": true}'::jsonb
  );
  $job$
);

SELECT cron.unschedule('send-student-reminders');
SELECT cron.schedule(
  'send-student-reminders',
  '0 12,17,22 * * *',
  $job$
  SELECT net.http_post(
    url := 'https://mbuljmpamdocnxppueww.supabase.co/functions/v1/send-reminders',
    headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || public.cron_service_key()),
    body := '{}'::jsonb
  );
  $job$
);