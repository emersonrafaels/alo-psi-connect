-- Adicionar imagem à página Sobre do tenant Medcos
UPDATE tenants
SET 
  about_images = ARRAY['https://images.unsplash.com/photo-1576091160550-2173dba999ef?q=80&w=2070&auto=format&fit=crop'],
  about_autoplay = false
WHERE slug = 'medcos';