## Objetivo
Restringir a trilha sonora das práticas a apenas músicas calmas e tranquilas, adequadas para respiração/yoga/meditação.

## Mudanças em `src/data/praticasAudios.ts`

**1. Catálogo de faixas (`PRATICAS_AUDIO_TRACKS`)** — substituir as faixas atuais por um conjunto curado de trilhas Kevin MacLeod (CC-BY 4.0) reconhecidamente calmas/ambientais, todas hospedadas em `incompetech.com/music/royalty-free/mp3-royaltyfree`:

- `meditationImpromptu1` — *Meditation Impromptu 01* (manter; piano lento, ideal para respiração)
- `meditationImpromptu2` — *Meditation Impromptu 02* (manter; introspectivo)
- `healing` — *Healing* (manter; relaxamento profundo)
- `relaxing` — *Relaxing Piano Music* / piano ambient calmo (substitui `heartwarming`, que tem caráter mais emotivo/cinemático e destoa de yoga)

Adicionar 1–2 faixas ambientais suaves adicionais para dar variedade (ex.: *Tranquility*, *Serenity*) — todas Kevin MacLeod CC-BY, perfil drone/piano lento, sem percussão marcada.

**2. `TRACK_CATALOG`** — reescrever os rótulos e descrições (`mood`) para refletir o perfil calmo:
- "Recomendada" (auto)
- "Meditação I — Piano sereno"
- "Meditação II — Introspectivo"
- "Healing — Relaxamento profundo"
- "Piano calmo — Ambiente suave"
- (opcional) "Drone ambiente — Foco tranquilo"
- "Sem trilha"

Remover `heartwarming` do catálogo.

**3. Mapeamentos de fallback** — atualizar `AUDIO_POR_SLUG` para que práticas que hoje apontam para `heartwarming` (`pausa-tres-minutos`, `respiracao-478`) passem a usar uma das faixas calmas remanescentes (provavelmente `healing` e `meditationImpromptu2`). `AUDIO_POR_GRUPO` e `AUDIO_DEFAULT` permanecem em `meditationImpromptu1`.

## Fora de escopo
- UI de seleção (`PraticaDetalhe.tsx`) — segue lendo do catálogo automaticamente.
- Player da sessão (`PraticaSessao.tsx`) — sem alterações.
- Créditos CC-BY — mantidos como hoje.

## Validação
Verificar que cada nova URL do incompetech responde 200 antes de commitar (lista pequena, checagem manual via `curl -I`).
