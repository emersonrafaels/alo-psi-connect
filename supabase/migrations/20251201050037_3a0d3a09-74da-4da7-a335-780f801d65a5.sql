-- Add author selection fields to blog_posts table
ALTER TABLE blog_posts 
ADD COLUMN IF NOT EXISTS custom_author_name text,
ADD COLUMN IF NOT EXISTS custom_author_url text,
ADD COLUMN IF NOT EXISTS display_author_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

COMMENT ON COLUMN blog_posts.custom_author_name IS 'Nome personalizado do autor (quando não é um usuário do sistema)';
COMMENT ON COLUMN blog_posts.custom_author_url IS 'Link do autor personalizado (ex: LinkedIn, site pessoal)';
COMMENT ON COLUMN blog_posts.display_author_id IS 'ID do usuário a ser exibido como autor (diferente do criador)';