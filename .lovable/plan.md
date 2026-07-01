## Meu Buddy — Fase 1

Nova área "Meu Buddy" que centraliza tudo o que a Rede Bem Estar sabe sobre o paciente, conectando diário, escalas, práticas e encontros com narrativa gerada por IA (Lovable AI / Gemini).

### Rotas (novas, usando `BrowserRouter` já existente)

- `/buddy` — Home do Buddy (**O que o Buddy está priorizando para você**): saudação, ações sugeridas, resumo do momento, próximas sessões, metas da semana.
- `/buddy/me-conhecer` — **Meu retrato**: formulário guiado (medos, calmantes, o que quer melhorar, sonhos, gatilhos, valores, sentimento atual, escala rápida ansiedade/tristeza/motivação). Áudio opcional (usa `useAudioRecorder` já existente + Supabase Storage).
- `/buddy/como-te-conhece` — **Como o Buddy te conhece**: mapa de conhecimento (SVG radial), cards de fortalezas e pontos de atenção, fontes das percepções (contagens de diário/escalas/práticas), última conversa.
- `/buddy/padroes` — **Padrões que o Buddy percebeu**: dashboards (bem-estar geral, estabilidade emocional, sono, consistência) usando `recharts`. Períodos: 7/15/30 dias.
- `/buddy/jornada` — **Minha jornada**: timeline unificada de diário + escalas + práticas + encontros + metas, com gráfico de evolução geral.
- `/buddy/pontos-de-forca` — **Seus pontos de força**: fortalezas, rede de apoio (SVG concêntrico), canais de ajuda 24h e contatos de emergência já cadastrados no perfil.

Todas dentro de `<ProtectedRoute>` (paciente logado).

### Personagem Buddy

Reaproveitar `src/components/hero/BuddyCharacter.tsx` e `src/assets/buddy.svg`. Novo componente `<BuddyMascot size mood message />` que envolve o SVG com balão de fala e animação sutil (Motion). Layout roxo/lavanda inspirado nas mockups, usando tokens do design system (`--primary`, `--accent`), sem hardcode de cor.

### Navegação / integração no site

- Novo item **"Meu Buddy"** no header/sidebar do paciente (`src/components/ui/header.tsx`) e cards de entrada nas telas de Diário, Escalas, Práticas e Encontros ("Ver o que o Buddy percebeu").

### Backend (Lovable Cloud / Supabase)

Novas tabelas em `public` com RLS + GRANTs (paciente vê o próprio; profissional vinculado só com consentimento; agregados via views):

- `buddy_portraits` — 1 linha por paciente. Colunas: `id`, `patient_id` (FK pacientes, unique), `mind_on`, `calms_me`, `wants_to_improve` (text[]), `dreams`, `message_to_buddy`, `triggers` (text[]), `values` (text[]), `current_mood`, `anxiety`, `sadness`, `motivation`, `audio_url`, `privacy` (`only_me`|`with_professionals`), `updated_at`.
- `buddy_insights` — snapshots gerados pela IA. Colunas: `id`, `patient_id`, `period_start`, `period_end`, `wellbeing_score` numeric, `emotional_stability`, `sleep_quality`, `habit_consistency`, `strengths` jsonb, `attention_points` jsonb, `map_topics` jsonb (nós do mapa), `sources` jsonb (contagens por fonte), `narrative` text (texto empático), `recommendations` jsonb, `created_at`, `model` text.
- `buddy_recommendations_feedback` — `id`, `patient_id`, `recommendation_id`, `action` (`accepted`|`dismissed`|`done`), `created_at`.
- `buddy_professional_consent` — `id`, `patient_id`, `professional_id`, `scope` (`portrait`|`insights`|`both`), `granted_at`, `revoked_at`. Fase 1 só cria a tabela + tela para o paciente ligar/desligar consentimento; UI para profissional consumir fica só como leitura de "resumo do paciente" no drawer que já existe (`PatientFullViewDrawer`).

Todas com `GRANT SELECT,INSERT,UPDATE,DELETE ... TO authenticated`, `GRANT ALL ... TO service_role`; sem grant para `anon`. RLS: `patient_id in (select id from pacientes where profile_id in (select id from profiles where user_id = auth.uid()))`.

Storage: reutilizar bucket existente ou criar `buddy-audios` privado com policy por paciente.

Agregado institucional: view `institution_buddy_aggregates` (avg wellbeing/estabilidade por instituição) exposta ao dashboard institucional já existente — sem dados individuais.

### Edge Functions

- `buddy-generate-insights` (POST, JWT verificado em código):
  1. Recebe `{ periodDays }`.
  2. Coleta últimos N dias do usuário: `mood_entries` + `mood_entry_analyses`, `emotional_scale_responses` + `iseu_scores`, `praticas_checkouts`, `agendamentos`/encontros, `buddy_portraits`.
  3. Calcula métricas determinísticas (bem-estar geral 1-10 já existente em `useMoodEntries`; consistência = dias com check-in / período; sono/ansiedade via configs de emoção).
  4. Chama Lovable AI (`google/gemini-3-flash-preview`) via `ai.gateway.lovable.dev/v1` com `Lovable-API-Key` e `Output.object` (Zod) para gerar: `narrative`, `strengths[]`, `attention_points[]`, `map_topics[]`, `recommendations[]`.
  5. Persiste em `buddy_insights` e retorna para o cliente.
  6. Trata 429 (rate limit) e 402 (créditos) com mensagens claras no UI.
- `buddy-portrait-audio-transcribe` (opcional Fase 1): transcreve áudios do retrato via `openai/gpt-4o-mini-transcribe` para popular campos de texto.

Segredo `LOVABLE_API_KEY` provisionado via `ai_gateway--create`.

### Hooks / componentes React

- `useBuddyPortrait` — load/save do retrato (upsert por `patient_id`).
- `useBuddyInsights({ periodDays })` — busca último snapshot; se ausente ou > 24h, chama edge function.
- `useBuddyRecommendations` — deriva de `insights.recommendations` + feedback.
- Componentes: `<BuddyKnowledgeMap>`, `<BuddyPatternsCharts>`, `<BuddyJourneyTimeline>`, `<BuddyStrengthsWeb>`, `<BuddyRecommendationsGrid>`, `<PortraitFormStep>`, `<BuddyPrivacyBanner>`, `<BuddyMascot>`.

Reuso: `useMoodEntries`, `useEmotionalScales`, `useGroupSessions`, `usePraticas`, `useAIInsights` (já existe — para não conflitar, o Buddy usa seu próprio pipeline em `buddy_insights`).

### Detalhes técnicos

- Cache: React Query com `staleTime: 5min` para retrato; `staleTime: 30min` para insights.
- Privacidade: banner LGPD reforçando anonimização, mesma redação do diário emocional.
- SEO: `<title>` "Meu Buddy — Rede Bem Estar" e meta description específica em cada rota.
- Acessibilidade: mascote com `role="img"` + `aria-label`; sliders com labels; contraste WCAG AA.
- Sem hardcode de cor — usa `hsl(var(--primary))` etc.

### Fora de escopo (fases futuras)

Chat conversacional em tempo real com o Buddy, integração WhatsApp, notificações push, gamificação, plano semanal detalhado, visão completa para profissional.

### Ordem de implementação

1. Migrations (tabelas + policies + grants + view agregada) e `ai_gateway--create`.
2. Edge function `buddy-generate-insights` + tipos Zod.
3. Hooks e componentes base + `<BuddyMascot>`.
4. Página `/buddy/me-conhecer` (retrato) — desbloqueia dados para IA.
5. Página `/buddy` (home) + `/buddy/como-te-conhece`.
6. `/buddy/padroes`, `/buddy/jornada`, `/buddy/pontos-de-forca`.
7. Item no header + cards de entrada nos módulos existentes.
