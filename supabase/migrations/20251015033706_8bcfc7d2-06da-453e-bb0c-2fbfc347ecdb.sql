-- Criar tabela para armazenar tentativas de cadastro profissional com erro
CREATE TABLE professional_registration_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identificação
  email text NOT NULL,
  nome text,
  tenant_id uuid REFERENCES tenants(id),
  
  -- Dados completos do formulário (backup JSON)
  form_data jsonb NOT NULL,
  
  -- Metadata
  status text DEFAULT 'failed', -- 'failed', 'incomplete', 'duplicate'
  error_message text,
  created_at timestamptz DEFAULT now(),
  
  -- Tracking
  ip_address text,
  user_agent text,
  
  -- Email notification tracking
  notification_sent boolean DEFAULT false,
  notification_sent_at timestamptz
);

-- Índices para performance
CREATE INDEX idx_reg_attempts_email ON professional_registration_attempts(email);
CREATE INDEX idx_reg_attempts_created ON professional_registration_attempts(created_at);
CREATE INDEX idx_reg_attempts_status ON professional_registration_attempts(status);
CREATE INDEX idx_reg_attempts_tenant ON professional_registration_attempts(tenant_id);

-- Enable RLS
ALTER TABLE professional_registration_attempts ENABLE ROW LEVEL SECURITY;

-- Service role pode gerenciar (edge functions)
CREATE POLICY "Service role can manage registration attempts"
  ON professional_registration_attempts
  FOR ALL
  USING (true);

-- Admins podem visualizar
CREATE POLICY "Admins can view registration attempts"
  ON professional_registration_attempts FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()));