-- Fix inverted stress emojis in default_emotion_types
UPDATE default_emotion_types
SET default_emoji_set = '{"1":"🧘","2":"😌","3":"😐","4":"😥","5":"😓"}'
WHERE emotion_type = 'stress';

-- Fix inverted stress emojis for all existing user configurations
UPDATE emotion_configurations
SET emoji_set = '{"1":"🧘","2":"😌","3":"😐","4":"😥","5":"😓"}'
WHERE emotion_type = 'stress';
