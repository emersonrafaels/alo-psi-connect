-- Update hero_carousel_mode to enable carousel functionality
UPDATE system_configurations 
SET value = '"true"'::jsonb 
WHERE category = 'homepage' AND key = 'hero_carousel_mode';