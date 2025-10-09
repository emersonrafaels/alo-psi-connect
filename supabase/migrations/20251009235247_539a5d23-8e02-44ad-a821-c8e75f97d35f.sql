-- Add configurable specialty tag colors and AI match button text to tenants
ALTER TABLE tenants
ADD COLUMN IF NOT EXISTS specialty_tag_bg_light TEXT DEFAULT '#e0f2fe',
ADD COLUMN IF NOT EXISTS specialty_tag_text_light TEXT DEFAULT '#0ea5e9',
ADD COLUMN IF NOT EXISTS specialty_tag_bg_dark TEXT DEFAULT '#1e3a8a',
ADD COLUMN IF NOT EXISTS specialty_tag_text_dark TEXT DEFAULT '#93c5fd',
ADD COLUMN IF NOT EXISTS ai_match_button_text TEXT DEFAULT 'Alô Psi Match';

COMMENT ON COLUMN tenants.specialty_tag_bg_light IS 'Background color for specialty tags in light mode';
COMMENT ON COLUMN tenants.specialty_tag_text_light IS 'Text color for specialty tags in light mode';
COMMENT ON COLUMN tenants.specialty_tag_bg_dark IS 'Background color for specialty tags in dark mode';
COMMENT ON COLUMN tenants.specialty_tag_text_dark IS 'Text color for specialty tags in dark mode';
COMMENT ON COLUMN tenants.ai_match_button_text IS 'Custom text for AI Match button (e.g., "Medcos Match", "Alô Psi Match")';