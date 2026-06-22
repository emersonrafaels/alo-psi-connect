
## Objetivo

Corrigir o player de prévia de músicas em Práticas (sobreposição de faixas e legenda travada em "Meditation Impromptu I"), garantindo que a faixa tocada e o crédito exibido sempre reflitam a seleção atual, inclusive quando "Recomendada" estiver ativa.

## Escopo

### 1. Prévia de áudio sem sobreposição (`src/pages/praticas/PraticaDetalhe.tsx`)

- Manter uma única instância `HTMLAudioElement` em `useRef` (reaproveitada entre trocas).
- Introduzir `requestIdRef` (token incremental): cada clique de prévia incrementa o token; callbacks assíncronos (`play()`, fade-in, timers) só aplicam efeito se o token ainda for o atual.
- `stopPreview()`:
  - Cancela timers de fade-in/fade-out.
  - Executa fade-out curto, depois `pause()` e `currentTime = 0`.
  - NÃO limpa `src` (evita recarregamentos desnecessários).
- `playPreview(track)`:
  - Chama `stopPreview()` primeiro.
  - Atualiza `src` apenas se mudou.
  - `await audio.play()` com `try/catch` que ignora `AbortError` silenciosamente.
- Cleanup no `useEffect` de desmontagem para parar áudio e timers.

### 2. Legenda dinâmica da faixa selecionada

- Resolver o nome real da faixa a partir do `selectedTrackId`, inclusive quando for `recomendada` (usar o mesmo mapeamento de `praticasPresets`/grupo/slug que já define a faixa tocada).
- Formatos exibidos:
  - Faixa nomeada: `Música: <nome resolvido> — Kevin MacLeod · CC-BY 4.0`
  - "Sem trilha": `Sem trilha musical — apenas som ambiente`
  - "Recomendada": exibe o nome efetivamente resolvido (não mais texto genérico).

### 3. Sincronia com `PraticaSessao.tsx`

- Garantir que o player da sessão use a mesma função de resolução de faixa (via parâmetro `t` da URL ou fallback "Recomendada") e troque corretamente quando o usuário muda a seleção no detalhe antes de iniciar.

## Detalhes técnicos

- Extrair a lógica de resolução de faixa para um helper compartilhado (ex.: `resolveTrackForPratica(pratica, selectedTrackId)`) usado tanto em `PraticaDetalhe.tsx` quanto em `PraticaSessao.tsx`.
- Não alterar o catálogo (`praticasAudios.ts`, `praticasPresets.ts`) — apenas consumo.
- Não tocar em estilos/UI fora da legenda.

## Validação

- Cliques rápidos em diferentes faixas: apenas a última toca, sem sobreposição.
- Selecionar "Sem trilha": prévia para imediatamente; legenda muda para "Sem trilha musical".
- Selecionar "Recomendada" em práticas distintas: legenda mostra o nome resolvido (ex.: "Healing", "Heartwarming", "Meditation Impromptu II") conforme grupo/slug.
- Iniciar sessão após trocar a seleção: `PraticaSessao` toca a mesma faixa exibida no detalhe.
- Sem erros `AbortError` no console.
