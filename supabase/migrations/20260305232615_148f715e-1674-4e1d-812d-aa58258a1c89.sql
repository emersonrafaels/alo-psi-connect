UPDATE default_emotion_types 
SET default_emoji_set = '{"1": "😶", "2": "🤔", "3": "😐", "4": "🙂", "5": "😊", "6": "😌", "7": "🎯", "8": "🎯", "9": "🧠", "10": "💎"}'::jsonb
WHERE emotion_type = 'focus';