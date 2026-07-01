## Objetivo
Transformar `/buddy/me-conhecer` numa experiência moderna, com gravação de áudio transcrita por IA e um questionário muito mais rico e acolhedor.

## 1. Gravação de áudio com transcrição por IA

- Novo componente `BuddyAudioAnswer` que aparece em cada pergunta aberta (texto longo):
  - Botão "Gravar resposta" usando `MediaRecorder` (reaproveitando o padrão de `useAudioRecorder`).
  - Waveform animada durante a gravação + timer + botão pausar/parar.
  - Ao parar: envia o áudio para uma nova edge function `buddy-transcribe-audio`, que chama Lovable AI (`openai/gpt-4o-mini-transcribe`) e devolve o texto.
  - O texto transcrito é inserido/anexado no campo `Textarea` correspondente, com destaque "Transcrito pelo Buddy" e opção de editar.
  - Player para reouvir + botão descartar.
- Áudio é salvo opcionalmente no Storage (`buddy-audio` bucket privado por paciente) e a URL vai no campo `audio_url` já existente em `buddy_portraits`. Um áudio por resposta longa (usar novos campos `audio_urls jsonb` por pergunta).

### Edge function `buddy-transcribe-audio`
- Recebe `multipart/form-data` com o blob.
- Valida usuário (auth), tamanho (<20MB) e mime.
- Faz POST para `https://ai.gateway.lovable.dev/v1/audio/transcriptions` com `model=openai/gpt-4o-mini-transcribe`, `language=pt`.
- Retorna `{ text }`. Trata 429/402 com mensagens amigáveis.

## 2. Novas perguntas úteis (retrato ampliado)

Reorganizar em seções com progresso visual ("2 de 6 · 45% completo"):

1. **Sobre mim agora** — mente, humor do dia, escalas ansiedade/tristeza/motivação, energia, qualidade do sono (novo), nível de estresse (novo).
2. **Minha essência** — valores, forças pessoais (novo), o que me define em 3 palavras (novo).
3. **Meu momento de vida** — o que ocupa minha mente, sonhos, o que quero mudar nos próximos 3 meses (novo), maior desafio atual (novo).
4. **O que me sustenta** — o que me acalma, pessoas de referência (novo), rituais de autocuidado (novo com chips), hobbies (novo).
5. **Meus limites** — gatilhos, situações que evito (novo), quando peço ajuda (novo com escala).
6. **Mensagem ao Buddy** — como quer ser tratado (tom: acolhedor / direto / bem-humorado — novo), horário preferido para lembretes (novo), mensagem livre.

Todas as perguntas abertas ganham o botão de áudio + transcrição. Chips ganham busca/adicionar personalizado.

## 3. Design moderno

- Layout em "cards flutuantes" com bordas suaves, gradientes sutis usando tokens (`--primary`, `--accent`), sombra `shadow-elegant`.
- Header sticky com barra de progresso animada e navegação por seções (stepper horizontal com ícones).
- Buddy mascote com balão dinâmico que muda de dica conforme a seção ativa.
- Micro-animações (Framer Motion já disponível? — se não, `tailwindcss-animate` já existe) em entradas de cards e chips selecionados.
- Autosave silencioso a cada 3s (indicador "Salvo há X segundos" no rodapé sticky) + botão "Concluir retrato".
- Tema respeita dark mode; nada de cores fixas.
- Mobile: seções viram accordion vertical.

## 4. Banco de dados (mínimo)

Migração adicionando colunas nullable a `buddy_portraits`:

- `sleep_quality int`, `stress_level int`, `energy_level int`
- `three_words text[]`, `strengths_self text[]`
- `next_3_months text`, `biggest_challenge text`
- `support_people text`, `self_care_rituals text[]`, `hobbies text[]`
- `avoid_situations text[]`, `ask_help_ease int`
- `preferred_tone text`, `reminder_time text`
- `audio_answers jsonb` (map `{ mind_on: url, calms_me: url, ... }`)

Bucket privado `buddy-audio` com policies (paciente só acessa seus arquivos).

## 5. Frontend técnico

- `src/pages/buddy/BuddyPortrait.tsx` reescrito em seções (`SectionShell`), com `useReducer` para o form + autosave (`useAutoSave` já existe).
- Novos componentes em `src/components/buddy/`:
  - `BuddyAudioAnswer.tsx`
  - `BuddySectionStepper.tsx`
  - `BuddyProgressHeader.tsx`
  - `BuddyChipInput.tsx` (chips com adicionar custom)
- Hook `useBuddyTranscribe` chamando a edge function.
- Atualizar `useBuddyPortrait` para os novos campos.

## 6. Verificação
- Testar gravar → transcrever → salvar → recarregar página.
- Verificar RLS do bucket + limites de tamanho.
- Checar dark mode e mobile.
