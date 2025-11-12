-- Usar a primeira imagem da medcos em ambos os tenants (imagem única, sem carrossel)
UPDATE tenants
SET 
  about_images = ARRAY['https://images.unsplash.com/photo-1638202993928-7267aad84c31?q=80&w=2070&auto=format&fit=crop'],
  about_autoplay = false
WHERE slug IN ('medcos', 'alopsi');