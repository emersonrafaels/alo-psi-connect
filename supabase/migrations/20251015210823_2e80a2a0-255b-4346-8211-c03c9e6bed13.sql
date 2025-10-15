-- Remover política antiga que não funciona para usuários anônimos
DROP POLICY IF EXISTS "Anyone can view published posts from tenant" ON blog_posts;

-- Criar nova política que permite usuários anônimos verem posts publicados
-- O filtro por tenant será feito no frontend
CREATE POLICY "Anyone can view published posts"
ON blog_posts
FOR SELECT
USING (
  status = 'published'
);