# Áudio nos campos de texto da Jornada + remover seleção de tempo

## 1. Gravar áudio em todos os campos de texto da Jornada Emocional
- Em cada caixa de texto da jornada (Compreender, anotação do Corpo, colunas de controle em Agir), adicionar um botão de microfone ao lado do campo, no mesmo estilo do Diário Emocional.
- Fluxo: tocar em "Gravar" → falar → "Parar" → o áudio é transcrito e o texto é **acrescentado** à caixa (sem apagar o que já foi escrito). O usuário continua podendo editar.
- Estados visíveis: gravando (com tempo), transcrevendo, erro amigável ("Não foi possível transcrever, tente de novo").
- O áudio em si não é guardado, apenas o texto transcrito (mais privacidade).

## 2. Remover seleção de tempo na etapa Regular
- No cartão da prática ("Suspiro de Alívio"), remover os botões "2 min / 3 min". A prática usa a primeira duração disponível automaticamente; o texto "cabe em X minutos" continua.

## Detalhes técnicos
- Novo componente reutilizável `v5/components/VoiceInputButton.tsx` usando `useAudioRecorder` (mesmo hook do diário) e a função `transcribe-audio` existente, usando apenas o campo `transcription` retornado.
- Integrar em `ComprehensionDimensions.tsx`, `BodyMap.tsx` e `ControlColumns.tsx` com callback `onTranscript(text)` que concatena ao valor atual.
- `LearningResourceCard.tsx`: remover o bloco `practice.durations.map(...)` (linhas ~120-130).
