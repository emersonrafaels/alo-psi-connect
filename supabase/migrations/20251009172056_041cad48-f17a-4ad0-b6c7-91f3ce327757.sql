-- Add branding fields to tenants.theme_config
-- No schema changes needed, just documenting the structure

-- The theme_config JSONB field in tenants table will now support:
-- {
--   "secondary_color": "#...",
--   "muted_color": "#...",
--   "hero_title": "Sua jornada de bem-estar começa aqui",
--   "hero_subtitle": "Conecte-se com profissionais qualificados",
--   "hero_images": ["url1", "url2", ...],
--   "hero_autoplay": true,
--   "hero_autoplay_delay": 5000
-- }

-- Update existing tenants with default hero values
UPDATE tenants
SET theme_config = jsonb_set(
  jsonb_set(
    jsonb_set(
      COALESCE(theme_config, '{}'::jsonb),
      '{hero_title}',
      '"Sua jornada de bem-estar começa aqui"'
    ),
    '{hero_subtitle}',
    '"Conecte-se com profissionais qualificados"'
  ),
  '{hero_autoplay}',
  'true'
)
WHERE theme_config->>'hero_title' IS NULL;

-- Add hero_autoplay_delay default
UPDATE tenants
SET theme_config = jsonb_set(
  COALESCE(theme_config, '{}'::jsonb),
  '{hero_autoplay_delay}',
  '5000'
)
WHERE theme_config->>'hero_autoplay_delay' IS NULL;