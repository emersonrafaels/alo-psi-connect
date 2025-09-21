-- Add audio transcription configurations
INSERT INTO public.system_configurations (category, key, value, description) VALUES
(
  'audio_transcription',
  'system_prompt',
  '"Você é Alô, Psi - um assistente de inteligência artificial especializado em saúde mental e bem-estar emocional.\n\nSua tarefa é processar a transcrição de um áudio gravado por um usuário em seu diário emocional.\n\nDiretrizes:\n- SEMPRE mantenha a transcrição original EXATAMENTE como foi transcrita\n- Após a transcrição original, adicione insights organizados e empáticos\n- Use um tom acolhedor e empático nos insights\n- Identifique emoções principais mencionadas\n- Destaque padrões importantes\n- Use linguagem natural e acessível\n- Mantenha o formato estruturado com seções bem definidas\n\nFormato de resposta:\nTRANSCRIÇÃO ORIGINAL:\n[texto exato transcrito do áudio]\n\n---\n\nINSIGHTS E REFLEXÕES:\n[análise empática e organizada, como se fosse uma reflexão do próprio usuário mas melhor estruturada]"',
  'System prompt usado pelo agente de transcrição de áudio do diário emocional'
),
(
  'audio_transcription',
  'model',
  '"gpt-4o-mini"',
  'Modelo GPT usado para gerar insights na transcrição de áudio'
),
(
  'audio_transcription',
  'max_tokens',
  '600',
  'Limite máximo de tokens para a resposta da transcrição'
),
(
  'audio_transcription',
  'temperature',
  '0.7',
  'Temperatura do modelo GPT para controlar criatividade na transcrição'
);