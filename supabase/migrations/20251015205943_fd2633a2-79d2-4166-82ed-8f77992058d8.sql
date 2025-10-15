-- Corrigir post da Alopsi com published_at NULL
UPDATE blog_posts 
SET published_at = created_at
WHERE id = '3175eaef-b4f2-41df-b5a9-3258756408f0' 
AND status = 'published'
AND published_at IS NULL;

-- Criar trigger para garantir que published_at seja sempre preenchido ao publicar
CREATE OR REPLACE FUNCTION set_published_at()
RETURNS TRIGGER AS $$
BEGIN
  -- Se o status está mudando para 'published' e published_at está NULL
  IF NEW.status = 'published' AND NEW.published_at IS NULL THEN
    NEW.published_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger que executa antes de INSERT ou UPDATE
DROP TRIGGER IF EXISTS ensure_published_at ON blog_posts;
CREATE TRIGGER ensure_published_at
  BEFORE INSERT OR UPDATE ON blog_posts
  FOR EACH ROW
  EXECUTE FUNCTION set_published_at();