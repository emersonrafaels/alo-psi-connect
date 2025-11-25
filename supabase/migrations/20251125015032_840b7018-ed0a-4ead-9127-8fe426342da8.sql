-- Migration: Adicionar coluna meeting_link em agendamentos
ALTER TABLE agendamentos 
ADD COLUMN IF NOT EXISTS meeting_link TEXT;

COMMENT ON COLUMN agendamentos.meeting_link IS 'Link do Google Meet gerado automaticamente para consultas online';

-- Migration: Adicionar configurações Google Calendar na tabela tenants
ALTER TABLE tenants
ADD COLUMN IF NOT EXISTS google_meet_mode TEXT DEFAULT 'professional' CHECK (google_meet_mode IN ('professional', 'tenant')),
ADD COLUMN IF NOT EXISTS google_calendar_email TEXT,
ADD COLUMN IF NOT EXISTS google_calendar_token TEXT,
ADD COLUMN IF NOT EXISTS google_calendar_refresh_token TEXT,
ADD COLUMN IF NOT EXISTS google_calendar_scope TEXT;

COMMENT ON COLUMN tenants.google_meet_mode IS 'Modo de criação do Google Meet: professional (email do profissional) ou tenant (email centralizado do tenant)';
COMMENT ON COLUMN tenants.google_calendar_email IS 'Email da conta Google Calendar centralizada do tenant (ex: redebemestar1@gmail.com, medcos.host@gmail.com)';
COMMENT ON COLUMN tenants.google_calendar_token IS 'Access token do Google Calendar do tenant';
COMMENT ON COLUMN tenants.google_calendar_refresh_token IS 'Refresh token do Google Calendar do tenant';
COMMENT ON COLUMN tenants.google_calendar_scope IS 'Escopo de permissões concedidas (calendar.readonly ou calendar.freebusy)';

-- Defaults para tenants existentes
UPDATE tenants 
SET 
  google_meet_mode = 'professional',
  google_calendar_email = CASE 
    WHEN slug = 'alopsi' THEN 'redebemestar1@gmail.com'
    WHEN slug = 'medcos' THEN 'medcos.host@gmail.com'
    ELSE NULL
  END
WHERE google_meet_mode IS NULL;