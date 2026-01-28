-- Atualizar tenant Rede Bem Estar com tipografia e textos do brand
UPDATE public.tenants 
SET 
  -- Tipografia - Poppins para headings
  font_family_headings = 'Poppins',
  
  -- Theme config com textos do brand e patterns placeholder
  theme_config = jsonb_build_object(
    'secondary_color', '#97d3d9',
    'hero_title', 'Acolhimento muda trajetórias',
    'hero_subtitle', 'Quando alguém escuta, tudo muda. Cuidar da mente também faz parte da jornada.',
    'cta_primary_text', 'Encontrar Apoio',
    'brand_patterns', jsonb_build_object(
      'hero', 'https://alopsi-website.s3.us-east-1.amazonaws.com/rede_bem_estar/imagens/brand/',
      'cta', 'https://alopsi-website.s3.us-east-1.amazonaws.com/rede_bem_estar/imagens/brand/'
    )
  ),
  
  updated_at = now()
WHERE slug = 'alopsi';