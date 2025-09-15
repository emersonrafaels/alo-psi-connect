-- Add autoplay configurations for homepage carousel
INSERT INTO system_configurations (category, key, value, description, created_by) VALUES
('homepage', 'hero_carousel_auto_play', 'false'::jsonb, 'Enable automatic carousel transitions', auth.uid()),
('homepage', 'hero_carousel_auto_play_delay', '5'::jsonb, 'Delay in seconds between automatic transitions', auth.uid())
ON CONFLICT (category, key) DO NOTHING;