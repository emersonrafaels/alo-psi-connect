-- Move the embedded service key out of function bodies into Vault, then rewrite the functions to read it.
DO $$
DECLARE k text;
BEGIN
  SELECT (regexp_match(pg_get_functiondef('public.invoke_google_calendar_sync()'::regprocedure), 'Bearer (eyJ[A-Za-z0-9_\-]+\.[A-Za-z0-9_\-]+\.[A-Za-z0-9_\-]+)'))[1] INTO k;
  IF k IS NOT NULL AND NOT EXISTS (SELECT 1 FROM vault.secrets WHERE name = 'cron_service_role_key') THEN
    PERFORM vault.create_secret(k, 'cron_service_role_key', 'Service key used by scheduled database jobs');
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.cron_service_key()
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'cron_service_role_key' LIMIT 1
$$;
REVOKE ALL ON FUNCTION public.cron_service_key() FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.invoke_blog_analytics_aggregation()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$
BEGIN
  PERFORM net.http_post(
    url := 'https://mbuljmpamdocnxppueww.supabase.co/functions/v1/aggregate-blog-analytics',
    headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || public.cron_service_key()),
    body := jsonb_build_object('mode', 'incremental', 'include_today', false)
  );
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING '[Cron] Erro ao invocar agregação de analytics: %', SQLERRM;
END;
$function$;

CREATE OR REPLACE FUNCTION public.invoke_google_calendar_sync()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$
DECLARE
  sync_interval INTEGER;
  last_sync TIMESTAMP WITH TIME ZONE;
  auto_sync_enabled BOOLEAN;
  should_sync BOOLEAN;
  last_sync_text TEXT;
BEGIN
  SELECT (value::jsonb)::boolean INTO auto_sync_enabled FROM system_configurations WHERE category = 'google_calendar' AND key = 'auto_sync_enabled';
  IF auto_sync_enabled IS NULL OR auto_sync_enabled = FALSE THEN RETURN; END IF;

  SELECT (value::jsonb)::integer INTO sync_interval FROM system_configurations WHERE category = 'google_calendar' AND key = 'sync_interval_minutes';
  SELECT value::jsonb #>> '{}' INTO last_sync_text FROM system_configurations WHERE category = 'google_calendar' AND key = 'last_sync_timestamp';
  IF last_sync_text IS NOT NULL AND last_sync_text != 'null' THEN
    BEGIN last_sync := last_sync_text::timestamp with time zone; EXCEPTION WHEN OTHERS THEN last_sync := NULL; END;
  END IF;
  should_sync := (last_sync IS NULL) OR (NOW() - last_sync >= (COALESCE(sync_interval, 15) || ' minutes')::INTERVAL);
  IF NOT should_sync THEN RETURN; END IF;

  PERFORM net.http_post(
    url := 'https://mbuljmpamdocnxppueww.supabase.co/functions/v1/google-calendar-cron',
    headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || public.cron_service_key()),
    body := '{}'::jsonb
  );
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Erro ao invocar sincronização do Google Calendar: %', SQLERRM;
END;
$function$;

-- Only the scheduler should run these.
REVOKE ALL ON FUNCTION public.invoke_blog_analytics_aggregation() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.invoke_google_calendar_sync() FROM PUBLIC, anon, authenticated;