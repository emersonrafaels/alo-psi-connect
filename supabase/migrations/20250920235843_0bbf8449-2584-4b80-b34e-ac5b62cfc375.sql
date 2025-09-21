-- Add default sharing message configurations for mood diary
INSERT INTO public.system_configurations (category, key, value, description) VALUES
('diary_sharing', 'share_title', '"🌟 *Meu Diário Emocional - {date}*"', 'Título da mensagem de compartilhamento do diário'),
('diary_sharing', 'share_footer', '"🌟 *Criado com {brand_name}* - Sua plataforma de bem-estar emocional\n💙 Experimente também: {website}"', 'Rodapé da mensagem de compartilhamento'),
('diary_sharing', 'brand_name', '"AloPsi"', 'Nome da marca para compartilhamento'),
('diary_sharing', 'website', '"alopsi.com.br"', 'Website para compartilhamento'),
('diary_sharing', 'metrics_title', '"📊 *Métricas do dia:*"', 'Título da seção de métricas'),
('diary_sharing', 'sleep_title', '"😴 *Sono:*"', 'Título da seção de sono'),
('diary_sharing', 'tags_title', '"🏷️ *Tags:*"', 'Título da seção de tags'),
('diary_sharing', 'reflections_title', '"📝 *Reflexões:*"', 'Título da seção de reflexões'),
('diary_sharing', 'stats_title', '"📈 *Minhas estatísticas:*"', 'Título da seção de estatísticas');