-- Enable autoplay for the homepage carousel by default for testing
UPDATE system_configurations 
SET value = 'true'::jsonb 
WHERE category = 'homepage' AND key = 'hero_carousel_auto_play';