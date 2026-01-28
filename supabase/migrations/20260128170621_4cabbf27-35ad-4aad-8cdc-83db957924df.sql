-- Aplicar nova identidade visual do brand Rede Bem Estar
-- Apenas no tenant 'alopsi' (Rede Bem Estar)

UPDATE tenants 
SET 
  -- Cores principais do brand
  primary_color = '#5b218e',           -- Roxo
  accent_color = '#e281bb',            -- Rosa
  header_color = '#5b218e',            -- Header em roxo
  
  -- Cores de texto do header
  header_text_color_light = '#FFFFFF',
  header_text_color_dark = '#FFFFFF',
  
  -- Cores dos botões
  button_bg_color_light = '#e281bb',   -- Rosa para CTAs
  button_text_color_light = '#5b218e', -- Texto roxo escuro
  button_bg_color_dark = '#e281bb',
  button_text_color_dark = '#5b218e',
  
  -- Cores das tags de especialidade
  specialty_tag_bg_light = '#f4f4f4',
  specialty_tag_text_light = '#5b218e',
  specialty_tag_bg_dark = '#5b218e',
  specialty_tag_text_dark = '#e281bb',
  
  -- Cores do footer
  footer_bg_color_light = '#5b218e',
  footer_text_color_light = '#FFFFFF',
  footer_bg_color_dark = '#5b218e',
  footer_text_color_dark = '#FFFFFF',
  
  -- Theme config com secondary (ciano)
  theme_config = jsonb_set(
    COALESCE(theme_config, '{}'::jsonb),
    '{secondary_color}',
    '"#97d3d9"'
  )
WHERE slug = 'alopsi';