-- Migration: Google Calendar Auto-Sync Configuration
-- Adiciona sincronização automática configurável do Google Calendar

-- 1. Criar configurações padrão para Google Calendar
INSERT INTO system_configurations (category, key, value, description, created_at, updated_at)
VALUES 
  ('google_calendar', 'auto_sync_enabled', 'true', 'Habilita sincronização automática do Google Calendar', now(), now()),
  ('google_calendar', 'sync_interval_minutes', '15', 'Intervalo em minutos entre sincronizações', now(), now()),
  ('google_calendar', 'last_sync_timestamp', 'null', 'Timestamp da última sincronização', now(), now()),
  ('google_calendar', 'sync_statistics', '{}', 'Estatísticas das sincronizações', now(), now())
ON CONFLICT (category, key) DO NOTHING;

-- 2. Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- 3. Criar função para invocar a sincronização do Google Calendar
CREATE OR REPLACE FUNCTION invoke_google_calendar_sync()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  sync_interval INTEGER;
  last_sync TIMESTAMP WITH TIME ZONE;
  auto_sync_enabled BOOLEAN;
  should_sync BOOLEAN;
  last_sync_text TEXT;
BEGIN
  -- Verificar se auto-sync está habilitado
  SELECT (value::jsonb)::boolean INTO auto_sync_enabled
  FROM system_configurations
  WHERE category = 'google_calendar' AND key = 'auto_sync_enabled';

  IF auto_sync_enabled IS NULL OR auto_sync_enabled = FALSE THEN
    RAISE NOTICE 'Google Calendar auto-sync está desabilitado';
    RETURN;
  END IF;

  -- Buscar intervalo configurado
  SELECT (value::jsonb)::integer INTO sync_interval
  FROM system_configurations
  WHERE category = 'google_calendar' AND key = 'sync_interval_minutes';

  -- Buscar último sync timestamp como texto
  SELECT value::jsonb #>> '{}' INTO last_sync_text
  FROM system_configurations
  WHERE category = 'google_calendar' AND key = 'last_sync_timestamp';

  -- Converter para timestamp se não for null
  IF last_sync_text IS NOT NULL AND last_sync_text != 'null' THEN
    BEGIN
      last_sync := last_sync_text::timestamp with time zone;
    EXCEPTION WHEN OTHERS THEN
      last_sync := NULL;
    END;
  END IF;

  -- Verificar se deve sincronizar (se nunca sincronizou ou se passou o intervalo)
  should_sync := (last_sync IS NULL) OR 
                 (NOW() - last_sync >= (COALESCE(sync_interval, 15) || ' minutes')::INTERVAL);

  IF NOT should_sync THEN
    RAISE NOTICE 'Sync não necessário ainda. Último sync: %, Intervalo: % minutos', last_sync, sync_interval;
    RETURN;
  END IF;

  RAISE NOTICE 'Iniciando sincronização do Google Calendar...';

  -- Invocar edge function via pg_net
  PERFORM net.http_post(
    url := 'https://mbuljmpamdocnxppueww.supabase.co/functions/v1/google-calendar-cron',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1idWxqbXBhbWRvY254cHB1ZXd3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjAxMzE3NSwiZXhwIjoyMDcxNTg5MTc1fQ.gEYGW-B0S1AXjUY_2nRjlXSBH8Wa5BfZHKrRwx1HIOQ'
    ),
    body := '{}'::jsonb
  );

  RAISE NOTICE 'Requisição de sincronização enviada';

EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Erro ao invocar sincronização do Google Calendar: %', SQLERRM;
END;
$$;

-- 4. Criar cron job que roda a cada minuto (a função decide se deve sincronizar)
SELECT cron.schedule(
  'google-calendar-auto-sync',
  '* * * * *',
  $$SELECT invoke_google_calendar_sync()$$
);

-- 5. Adicionar comentários
COMMENT ON FUNCTION invoke_google_calendar_sync IS 'Função que verifica se deve invocar sincronização do Google Calendar baseado no intervalo configurado';