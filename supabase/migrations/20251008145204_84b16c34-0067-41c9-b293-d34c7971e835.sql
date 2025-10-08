-- Criar tabela de tracking de visualizações de posts
CREATE TABLE IF NOT EXISTS blog_post_views_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT NOT NULL,
  viewed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  time_spent INTEGER DEFAULT 0, -- em segundos
  referrer TEXT,
  device_type TEXT,
  completed_reading BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_blog_views_post_id ON blog_post_views_tracking(post_id);
CREATE INDEX IF NOT EXISTS idx_blog_views_user_id ON blog_post_views_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_blog_views_session_id ON blog_post_views_tracking(session_id);
CREATE INDEX IF NOT EXISTS idx_blog_views_viewed_at ON blog_post_views_tracking(viewed_at);

-- Criar tabela de analytics diários
CREATE TABLE IF NOT EXISTS blog_analytics_daily (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  views_count INTEGER DEFAULT 0,
  unique_visitors INTEGER DEFAULT 0,
  avg_time_spent NUMERIC DEFAULT 0,
  completion_rate NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(post_id, date)
);

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_blog_analytics_post_id ON blog_analytics_daily(post_id);
CREATE INDEX IF NOT EXISTS idx_blog_analytics_date ON blog_analytics_daily(date);

-- RLS Policies para blog_post_views_tracking
ALTER TABLE blog_post_views_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert view tracking"
  ON blog_post_views_tracking
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can view all tracking"
  ON blog_post_views_tracking
  FOR SELECT
  USING (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'super_admin'::app_role)
  );

CREATE POLICY "Authors can view their posts tracking"
  ON blog_post_views_tracking
  FOR SELECT
  USING (
    post_id IN (
      SELECT id FROM blog_posts WHERE author_id = auth.uid()
    )
  );

-- RLS Policies para blog_analytics_daily
ALTER TABLE blog_analytics_daily ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all analytics"
  ON blog_analytics_daily
  FOR ALL
  USING (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'super_admin'::app_role)
  );

CREATE POLICY "Authors can view their posts analytics"
  ON blog_analytics_daily
  FOR SELECT
  USING (
    post_id IN (
      SELECT id FROM blog_posts WHERE author_id = auth.uid()
    )
  );

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_blog_analytics_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_blog_analytics_updated_at_trigger
  BEFORE UPDATE ON blog_analytics_daily
  FOR EACH ROW
  EXECUTE FUNCTION update_blog_analytics_updated_at();