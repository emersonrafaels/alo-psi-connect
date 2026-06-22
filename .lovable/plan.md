## Diagnóstico

1. **Sobreposição de prévias / AbortError**: o controlador atual cria um `new Audio(url)` a cada clique e chama `stopPreview(true)` (que faz `pause()` + `src = ""`) antes do `play()` anterior resolver. Em cliques rápidos sobram instâncias órfãs tocando em paralelo e o navegador dispara `AbortError`.

2. **Crédito "Música: Kevin MacLeod" parece travado**: o texto é estático e não reflete a trilha selecionada/tocando, dando impressão de bug.

## Correções

### 1. `PraticaDetalhe.tsx` — controller de prévia robusto

- Manter **um único** `HTMLAudioElement` em `useRef` e reaproveitar trocando apenas `src` (não criar nova `Audio` a cada clique).
- Usar um `requestIdRef` (token incremental) para ignorar callbacks de play/fade de requisições antigas.
- Sequenciar corretamente: `await audio.play()` em try/catch; só iniciar fade-in/timers se o token ainda for o atual.
- `stopPreview`: limpar timers/intervals, fazer fade-out e só então `pause()` (sem zerar `src`, para não interromper outro `play()` em curso). Usar `audio.pause()` + `audio.currentTime = 0`.
- Ignorar `AbortError` silenciosamente (não logar warning ruidoso) — manter warning só para erros reais.
- Garantir que clicar no card já ativo (mesmo `id`) pare; clicar em outro pare o anterior e inicie o novo, sem corrida.
- Cleanup no unmount permanece.

### 2. `PraticaDetalhe.tsx` — crédito dinâmico

Trocar o texto fixo por algo como:
- Se houver prévia tocando ou `trackId` válido: `Música: <Nome da trilha> — Kevin MacLeod · CC-BY 4.0`.
- Se "Sem trilha": `Sem trilha musical — apenas som ambiente`.
- Se "Recomendada (auto)": `Música: seleção automática — Kevin MacLeod · CC-BY 4.0`.

## Validação

- Clicar rapidamente em 4 trilhas seguidas → apenas a última toca; sem erros no console.
- Selecionar "Sem trilha" durante prévia → áudio para imediatamente; legenda muda.
- Selecionar cada card → legenda mostra o nome correspondente.

## Arquivos

- `src/pages/praticas/PraticaDetalhe.tsx`
