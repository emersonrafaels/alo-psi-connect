-- Remove a constraint composta atual que está causando problemas
ALTER TABLE blog_posts DROP CONSTRAINT IF EXISTS blog_posts_slug_tenant_key;

-- Cria índice parcial que só valida posts PUBLICADOS
-- Isso permite drafts duplicados e facilita mudanças de tenant
CREATE UNIQUE INDEX idx_blog_posts_slug_tenant_published 
ON blog_posts (slug, COALESCE(tenant_id, '00000000-0000-0000-0000-000000000000'::uuid))
WHERE status = 'published';

-- Explicação:
-- - COALESCE garante que NULL seja tratado consistentemente
-- - WHERE status = 'published' só aplica a constraint em posts publicados
-- - Drafts podem ter qualquer slug duplicado sem problemas