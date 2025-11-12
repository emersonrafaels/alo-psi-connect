-- Atualizar imagens do Medcos com foco em medicina e clínica
UPDATE tenants
SET 
  about_images = ARRAY[
    'https://images.unsplash.com/photo-1638202993928-7267aad84c31?q=80&w=2070&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1631815589968-fdb09a223b1e?q=80&w=2070&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?q=80&w=2053&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1666214280557-f1b5022eb634?q=80&w=2070&auto=format&fit=crop'
  ],
  about_autoplay = true,
  about_autoplay_delay = 6000
WHERE slug = 'medcos';

-- Atualizar imagens da Rede Bem Estar com foco em saúde mental e psicoterapia
UPDATE tenants
SET 
  about_images = ARRAY[
    'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?q=80&w=2070&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1527689368864-3a821dbccc34?q=80&w=2070&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=2076&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1584515933487-779824d29309?q=80&w=2070&auto=format&fit=crop'
  ],
  about_autoplay = true,
  about_autoplay_delay = 5500
WHERE slug = 'alopsi';