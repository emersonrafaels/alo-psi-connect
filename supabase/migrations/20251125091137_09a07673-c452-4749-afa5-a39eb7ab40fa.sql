-- Fase 1: Adicionar campo tags para categorização
ALTER TABLE group_sessions ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}';

-- Fase 2: Criar tabela de lista de espera
CREATE TABLE IF NOT EXISTS group_session_waitlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES group_sessions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  email text NOT NULL,
  name text NOT NULL,
  position integer NOT NULL,
  status text NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'notified', 'converted', 'cancelled')),
  notified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(session_id, user_id)
);

-- Índices para lista de espera
CREATE INDEX IF NOT EXISTS idx_waitlist_session ON group_session_waitlist(session_id);
CREATE INDEX IF NOT EXISTS idx_waitlist_user ON group_session_waitlist(user_id);
CREATE INDEX IF NOT EXISTS idx_waitlist_status ON group_session_waitlist(status);

-- RLS para lista de espera
ALTER TABLE group_session_waitlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own waitlist entries"
  ON group_session_waitlist FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own waitlist entries"
  ON group_session_waitlist FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own waitlist entries"
  ON group_session_waitlist FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all waitlist entries"
  ON group_session_waitlist FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('super_admin', 'admin')
    )
  );

-- Fase 3: Criar tabela de depoimentos
CREATE TABLE IF NOT EXISTS session_testimonials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES group_sessions(id) ON DELETE SET NULL,
  user_id uuid NOT NULL,
  user_name text NOT NULL,
  user_avatar_url text,
  session_title text NOT NULL,
  session_type text NOT NULL,
  testimonial_text text NOT NULL,
  rating integer CHECK (rating >= 1 AND rating <= 5),
  is_featured boolean DEFAULT false,
  is_approved boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Índices para depoimentos
CREATE INDEX IF NOT EXISTS idx_testimonials_session ON session_testimonials(session_id);
CREATE INDEX IF NOT EXISTS idx_testimonials_featured ON session_testimonials(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_testimonials_approved ON session_testimonials(is_approved) WHERE is_approved = true;

-- RLS para depoimentos
ALTER TABLE session_testimonials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view approved testimonials"
  ON session_testimonials FOR SELECT
  USING (is_approved = true);

CREATE POLICY "Users can create own testimonials"
  ON session_testimonials FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all testimonials"
  ON session_testimonials FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('super_admin', 'admin')
    )
  );

-- Fase 5: Criar tabela de analytics
CREATE TABLE IF NOT EXISTS group_session_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES group_sessions(id) ON DELETE CASCADE,
  event_type text NOT NULL CHECK (event_type IN ('view', 'register_click', 'share', 'calendar_add', 'waitlist_join')),
  user_id uuid,
  session_id_text text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Índices para analytics
CREATE INDEX IF NOT EXISTS idx_analytics_session ON group_session_analytics(session_id);
CREATE INDEX IF NOT EXISTS idx_analytics_event_type ON group_session_analytics(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_created_at ON group_session_analytics(created_at);

-- RLS para analytics (apenas admins)
ALTER TABLE group_session_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all analytics"
  ON group_session_analytics FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('super_admin', 'admin')
    )
  );

CREATE POLICY "Anyone can insert analytics"
  ON group_session_analytics FOR INSERT
  WITH CHECK (true);

-- Triggers para updated_at
CREATE TRIGGER update_waitlist_updated_at
  BEFORE UPDATE ON group_session_waitlist
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_testimonials_updated_at
  BEFORE UPDATE ON session_testimonials
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();