-- Tabela para armazenar solicitações de vínculo institucional
CREATE TABLE IF NOT EXISTS institution_link_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relacionamentos
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  institution_id UUID NOT NULL REFERENCES educational_institutions(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Tipo de usuário solicitante
  user_type TEXT NOT NULL CHECK (user_type IN ('paciente', 'profissional')),
  
  -- Dados da solicitação
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  request_message TEXT,
  
  -- Dados adicionais para profissionais
  professional_id BIGINT REFERENCES profissionais(id) ON DELETE CASCADE,
  relationship_type TEXT CHECK (relationship_type IN ('employee', 'consultant', 'supervisor', 'intern')),
  
  -- Dados adicionais para pacientes
  patient_id UUID REFERENCES pacientes(id) ON DELETE CASCADE,
  enrollment_type TEXT CHECK (enrollment_type IN ('student', 'alumni', 'employee')),
  
  -- Resposta do admin
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  review_notes TEXT,
  
  -- Metadados
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_institution_link_requests_user_id ON institution_link_requests(user_id);
CREATE INDEX idx_institution_link_requests_institution_id ON institution_link_requests(institution_id);
CREATE INDEX idx_institution_link_requests_tenant_id ON institution_link_requests(tenant_id);
CREATE INDEX idx_institution_link_requests_status ON institution_link_requests(status);
CREATE INDEX idx_institution_link_requests_user_type ON institution_link_requests(user_type);

-- RLS Policies
ALTER TABLE institution_link_requests ENABLE ROW LEVEL SECURITY;

-- Usuários podem criar suas próprias solicitações
CREATE POLICY "users_create_own_requests"
ON institution_link_requests FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Usuários podem visualizar suas próprias solicitações
CREATE POLICY "users_view_own_requests"
ON institution_link_requests FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Admins podem visualizar todas as solicitações
CREATE POLICY "admins_view_all_requests"
ON institution_link_requests FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'super_admin'::app_role)
);

-- Admins podem atualizar solicitações (aprovar/rejeitar)
CREATE POLICY "admins_update_requests"
ON institution_link_requests FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'super_admin'::app_role)
);

-- Comentários
COMMENT ON TABLE institution_link_requests IS 'Armazena solicitações de vínculo institucional de pacientes e profissionais';
COMMENT ON COLUMN institution_link_requests.user_type IS 'Tipo de usuário: paciente ou profissional';
COMMENT ON COLUMN institution_link_requests.status IS 'Status: pending (pendente), approved (aprovado), rejected (rejeitado)';
COMMENT ON COLUMN institution_link_requests.relationship_type IS 'Para profissionais: employee, consultant, supervisor, intern';
COMMENT ON COLUMN institution_link_requests.enrollment_type IS 'Para pacientes: student (estudante), alumni (egresso), employee (funcionário)';