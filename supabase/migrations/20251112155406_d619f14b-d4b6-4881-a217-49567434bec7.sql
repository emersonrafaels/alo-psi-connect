-- Adicionar carrossel de imagens à página Sobre do tenant Rede Bem Estar (alopsi)
UPDATE tenants
SET 
  about_images = ARRAY[
    'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?q=80&w=2070&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1544027993-37dbfe43562a?q=80&w=2070&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1506126613408-eca07ce68773?q=80&w=2070&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=2071&auto=format&fit=crop'
  ],
  about_autoplay = true,
  about_autoplay_delay = 5000
WHERE slug = 'alopsi';