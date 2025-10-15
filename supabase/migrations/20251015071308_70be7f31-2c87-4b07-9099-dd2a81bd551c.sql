-- Remover constraint antiga que impede slugs duplicados entre tenants
ALTER TABLE blog_posts DROP CONSTRAINT IF EXISTS blog_posts_slug_key;

-- Criar nova constraint composta que permite mesmos slugs em tenants diferentes
ALTER TABLE blog_posts ADD CONSTRAINT blog_posts_slug_tenant_key 
UNIQUE (slug, tenant_id);

-- Comentário: Agora cada tenant pode ter posts com o mesmo slug
-- Exemplo: alopsi pode ter "/guia-ansiedade" e medcos também pode ter "/guia-ansiedade"