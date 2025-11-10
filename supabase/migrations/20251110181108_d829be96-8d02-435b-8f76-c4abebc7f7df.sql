-- ============================================
-- FASE 1: Corrigir spacers existentes
-- ============================================

-- Substituir spacers escapados por spacers válidos
UPDATE blog_posts 
SET content = REPLACE(
  content,
  '&lt;div class="editor-spacer" style="height: 40px; margin: 20px 0;"&gt;&lt;/div&gt;',
  '<div data-type="spacer" data-height="60px" class="spacer-block" style="height: 60px; margin: 20px 0;"></div>'
)
WHERE content LIKE '%&lt;div class="editor-spacer"%';

-- Substituir outras variações
UPDATE blog_posts 
SET content = REPLACE(
  content,
  '<div class="editor-spacer"',
  '<div data-type="spacer" class="spacer-block"'
)
WHERE content LIKE '%<div class="editor-spacer"%';

-- ============================================
-- FASE 2: Sistema de Revisões
-- ============================================

CREATE TABLE IF NOT EXISTS blog_post_revisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  revision_note TEXT
);

CREATE INDEX IF NOT EXISTS idx_post_revisions ON blog_post_revisions(post_id, created_at DESC);

-- Habilitar RLS
ALTER TABLE blog_post_revisions ENABLE ROW LEVEL SECURITY;

-- Policies para revisões
CREATE POLICY "Admins can view all revisions"
  ON blog_post_revisions FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Authors can view their post revisions"
  ON blog_post_revisions FOR SELECT
  USING (
    post_id IN (
      SELECT id FROM blog_posts WHERE author_id = auth.uid()
    )
  );

CREATE POLICY "System can create revisions"
  ON blog_post_revisions FOR INSERT
  WITH CHECK (true);

-- ============================================
-- FASE 2: Agendamento de Posts
-- ============================================

ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS scheduled_for TIMESTAMPTZ;

-- Função para publicar posts agendados
CREATE OR REPLACE FUNCTION publish_scheduled_posts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE blog_posts
  SET 
    status = 'published', 
    published_at = NOW(),
    scheduled_for = NULL
  WHERE status = 'draft' 
    AND scheduled_for IS NOT NULL
    AND scheduled_for <= NOW();
END;
$$;

-- ============================================
-- FASE 2: Biblioteca de Mídia
-- ============================================

CREATE TABLE IF NOT EXISTS media_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url TEXT NOT NULL,
  filename TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes INTEGER,
  width INTEGER,
  height INTEGER,
  alt_text TEXT,
  caption TEXT,
  uploaded_by UUID REFERENCES auth.users(id),
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_media_filename ON media_library(filename);
CREATE INDEX IF NOT EXISTS idx_media_uploaded_by ON media_library(uploaded_by);

-- Habilitar RLS
ALTER TABLE media_library ENABLE ROW LEVEL SECURITY;

-- Policies para biblioteca de mídia
CREATE POLICY "Anyone can view media"
  ON media_library FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can upload media"
  ON media_library FOR INSERT
  WITH CHECK (auth.uid() = uploaded_by);

CREATE POLICY "Users can delete their own media"
  ON media_library FOR DELETE
  USING (auth.uid() = uploaded_by);

CREATE POLICY "Admins can manage all media"
  ON media_library FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));