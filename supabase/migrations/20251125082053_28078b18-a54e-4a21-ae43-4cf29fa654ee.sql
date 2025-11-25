-- Criar tabela de sessões em grupo
CREATE TABLE group_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) NOT NULL,
  
  -- Informações básicas
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  session_type TEXT NOT NULL CHECK (session_type IN ('palestra', 'workshop', 'roda_conversa')),
  
  -- Data e hora (timezone Brasil)
  session_date DATE NOT NULL,
  start_time TIME NOT NULL,
  duration_minutes INTEGER DEFAULT 60,
  
  -- Organizador (profissional OU instituição/tenant)
  organizer_type TEXT NOT NULL CHECK (organizer_type IN ('professional', 'institution', 'tenant')),
  professional_id INTEGER REFERENCES profissionais(id),
  institution_id UUID REFERENCES educational_institutions(id),
  
  -- Capacidade
  max_participants INTEGER DEFAULT 100 CHECK (max_participants <= 500),
  current_registrations INTEGER DEFAULT 0,
  
  -- Configurações de preço (preparado para futuro)
  is_free BOOLEAN DEFAULT true,
  price NUMERIC(10,2) DEFAULT 0,
  
  -- Link da sessão
  meeting_link TEXT,
  google_event_id TEXT,
  
  -- Imagem e visual
  featured_image_url TEXT,
  
  -- Acessibilidade
  has_libras BOOLEAN DEFAULT false,
  
  -- Restrição de público
  audience_type TEXT DEFAULT 'all' CHECK (audience_type IN ('all', 'institutions')),
  allowed_institution_ids UUID[] DEFAULT '{}',
  
  -- Status
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('draft', 'scheduled', 'live', 'completed', 'cancelled')),
  
  -- Auditoria
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_group_sessions_tenant ON group_sessions(tenant_id);
CREATE INDEX idx_group_sessions_date ON group_sessions(session_date);
CREATE INDEX idx_group_sessions_status ON group_sessions(status);
CREATE INDEX idx_group_sessions_type ON group_sessions(session_type);

-- Criar tabela de inscrições
CREATE TABLE group_session_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES group_sessions(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  
  -- Status da inscrição
  status TEXT DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled', 'attended', 'no_show')),
  
  -- Pagamento (preparado para futuro)
  payment_status TEXT DEFAULT 'free' CHECK (payment_status IN ('free', 'pending', 'paid', 'refunded')),
  
  -- Timestamps
  registered_at TIMESTAMPTZ DEFAULT now(),
  cancelled_at TIMESTAMPTZ,
  attended_at TIMESTAMPTZ,
  
  -- Constraint única: um usuário só pode se inscrever uma vez por sessão
  UNIQUE(session_id, user_id)
);

-- Índices para busca rápida
CREATE INDEX idx_registrations_session ON group_session_registrations(session_id);
CREATE INDEX idx_registrations_user ON group_session_registrations(user_id);

-- Ativar RLS
ALTER TABLE group_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_session_registrations ENABLE ROW LEVEL SECURITY;

-- RLS Policies para group_sessions

-- Todos podem ver sessões públicas agendadas
CREATE POLICY "Anyone can view scheduled sessions" ON group_sessions
  FOR SELECT USING (
    status IN ('scheduled', 'live') AND (
      audience_type = 'all' OR
      -- Verificar se usuário pertence a uma das instituições permitidas
      EXISTS (
        SELECT 1 FROM patient_institutions pi
        JOIN pacientes p ON pi.patient_id = p.id
        JOIN profiles pr ON p.profile_id = pr.id
        WHERE pr.user_id = auth.uid()
        AND pi.institution_id = ANY(allowed_institution_ids)
      )
    )
  );

-- Admins podem gerenciar todas as sessões
CREATE POLICY "Admins can manage all sessions" ON group_sessions
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

-- RLS Policies para group_session_registrations

-- Usuários logados podem se inscrever
CREATE POLICY "Users can register" ON group_session_registrations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Usuários podem ver e cancelar suas próprias inscrições
CREATE POLICY "Users can manage own registrations" ON group_session_registrations
  FOR ALL USING (auth.uid() = user_id);

-- Admins podem ver todas as inscrições
CREATE POLICY "Admins can view all registrations" ON group_session_registrations
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

-- Trigger para updated_at
CREATE TRIGGER update_group_sessions_updated_at
  BEFORE UPDATE ON group_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();