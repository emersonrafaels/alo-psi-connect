## Status atual

A maior parte do plano original já foi implementada. Resta o que está listado abaixo, agrupado por contexto.

### Já implementado (não refazer)
- Ícones de áudio inativo (`VolumeOff`, `Waves` / `WavesOff`, `Bell` / `BellOff`).
- Catálogo de trilhas com prévia (`TRACK_CATALOG`, hot-swap sem sobreposição, legenda resolvida).
- Presets de respiração (`BREATHING_PRESETS`) e temas de cena (`SCENE_THEMES`).
- Sino/gong de transição, vibração háptica, indicador de ciclo, pausa por `visibilitychange`, botão "+1 min", fullscreen com fallback iOS, som ambiente procedural.
- Check-out pós-sessão básico (`praticas_checkouts`) e tela "Concluída" com share nativo.

---

## Etapas restantes (priorizadas)

### Sprint 1 — UX e acessibilidade (baixo custo, alto impacto)

1. **D1 · Reduced motion** (`PraticaSessao.tsx`, CSS global)
   - Hook `usePrefersReducedMotion`; quando ativo: remove `PARTICLES`, desabilita animação de aurora (gradiente estático), congela `praticaFloat`.

2. **D3 · Legendas grandes de fase** (`BreathingCircle.tsx`)
   - Texto "Inspire / Segure / Expire" abaixo do círculo, opção em "modo legibilidade" (font-size maior, peso 600, contraste reforçado). Toggle persistido em `localStorage` (`praticas:legendasGrandes`).

3. **A4 · Modo "sem tela"** (`PraticaSessao.tsx`)
   - Após N segundos sem interação, escurece toda a cena (overlay `bg-black/70`) deixando apenas o círculo respirando visível. Sai do modo a qualquer toque. Reusa `idleTimerRef` já existente.

4. **B4 · Slider de intensidade visual** (`PraticaSessao.tsx`)
   - Slider 1–5 controlando densidade de partículas e blur da aurora em runtime (CSS var `--pratica-intensity`). Persistir em `localStorage`.

### Sprint 2 — Pós-sessão e continuidade

5. **C1 · Integrar check-out ao diário emocional** (`PraticaCheckout.tsx`)
   - Ao concluir, além de gravar em `praticas_checkouts`, criar/atualizar entrada do dia em `mood_entries` (campo `humor` mapeado do estado escolhido). Usar `upsert` com `onConflict: 'user_id,date'` (regra já existente).

6. **C2 · Resumo do ciclo respiratório** (`PraticaConcluida.tsx`)
   - Receber via query string (`?ciclos=` e `?dur=`) total de ciclos completos, duração efetiva e tempo médio por ciclo. Exibir em card destacado antes do "O que a ciência sugere".

7. **C4 · Streak e calendário** (`PraticaConcluida.tsx` + nova query)
   - Calcular streak (dias consecutivos com prática) a partir de `praticas_checkouts.created_at` do usuário. Pequeno calendário 30 dias com pontos preenchidos.

8. **D4 · Persistência de progresso** (`PraticaSessao.tsx` + `PraticaDetalhe.tsx`)
   - Ao encerrar antes do fim, salvar `{slug, elapsed, duracao, ts}` em `localStorage:praticas:retomar`. Na tela de detalhe, banner "Continuar sessão anterior (3:20 restantes)" se for o mesmo `slug` e <30 min.

### Sprint 3 — Personalização e conteúdo

9. **A5 · Lembrete diário** (nova seção em `PraticaDetalhe.tsx` ou `/configuracoes`)
    - Reaproveitar a tabela já existente `whatsapp_reminder_preferences` ou criar `praticas_lembretes` (cron via edge function `daily-reminders`). UI: hora + dias da semana.

10. **A2 · Voz-guia (TTS)** (edge function `praticas-tts` + cache)
    - Lovable AI `gpt-4o-mini-tts`, vozes alloy/sage/shimmer, pt-BR. Geração sob demanda dos cues "Inspire / Segure / Expire" + contagem regressiva. Cache por preset em Supabase Storage (`praticas-tts/{preset}_{voz}.mp3`).

11. **E2 · Recomendação contextual** (`PraticasIndex.tsx`)
    - Ler última triagem do usuário; se ansiedade alta → destacar "Respiração 4-7-8" e similares; se sono ruim → "Body scan"; se nenhum → comportamento atual.

12. **C3 · Selo compartilhável** (`PraticaConcluida.tsx`)
    - Gerar imagem via Canvas (1080×1080) com título da prática, minutos, data e logo. Botão "Baixar selo" além do share atual.

### Backlog (sem prioridade definida)

- **D2** Modo alto contraste (toggle global).
- **E1** Upload de áudio próprio por psicólogo da rede (admin) — `audio_url` já existe.
- **E3** Sessões em sequência (rotina matinal: encadear 2–3 práticas).

## Como prosseguir

Confirme qual sprint (1, 2 ou 3) — ou itens individuais por número — devo implementar agora. Se quiser priorizar diferente, indique a ordem.