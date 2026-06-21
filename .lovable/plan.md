## Plano

Dois ajustes na tela de sessão da prática (`src/pages/praticas/PraticaSessao.tsx`):

### 1. Controles abaixo do círculo, visíveis em notebook sem rolagem
Hoje o círculo (`w-[26rem] h-[26rem]` ≈ 416 px) + título + subtítulo + progresso + rodapé somam mais que 674 px e cortam os controles.

- Voltar o `<footer>` para o fluxo na parte de baixo (remover a barra vertical lateral); manter `sticky bottom-0` para garantir visibilidade.
- Compactar o layout vertical:
  - Reduzir margens: `mb-2` no título e `mb-4` no subtítulo; remover `sm:pb-8` extra do `<main>`.
  - Reduzir o círculo no `BreathingCircle.tsx`: trocar `w-72 h-72 sm:w-[26rem] sm:h-[26rem]` por tamanho responsivo que respeite a altura, usando `style={{ width: "min(22rem, 45vh)", height: "min(22rem, 45vh)" }}` (e classes Tailwind como base mínima `w-56 h-56`). Assim em telas baixas o círculo encolhe e o rodapé sempre cabe.
  - Reduzir `mt-8 sm:mt-12` do bloco de progresso para `mt-4 sm:mt-6`.
- Remover o `sm:pr-24` do `<main>` (não há mais barra lateral).
- Manter `overflow-y-auto` no contêiner como fallback.

### 2. Áudio não toca — corrigir
Causa provável: `crossOrigin="anonymous"` no `<audio>` exige CORS no servidor. O CDN `incompetech.com` não envia `Access-Control-Allow-Origin`, então o browser bloqueia a faixa e nada é reproduzido. O som ambiente procedural (Web Audio) é separado e não foi afetado.

- Remover `crossOrigin="anonymous"` do `<audio>` (não usamos `AudioContext` sobre essa tag).
- Adicionar `preload="auto"` e handlers `onError` / `onCanPlay` que logam no console para diagnóstico futuro.
- No `useEffect` que controla `paused`/`muted`/`volume`, chamar `a.load()` quando `audioUrl` mudar (garantia de refetch sem CORS) e tentar `a.play()` capturando o erro de autoplay (já existe `.catch(() => {})`).
- Adicionar dependência `audioUrl` no effect e um `useEffect` separado para chamar `a.load()` ao trocar de URL.

## Critério de aceitação
- Em viewport 1146×674, todos os controles ficam visíveis sem rolagem.
- A trilha sonora (Kevin MacLeod) começa a tocar ao iniciar a sessão quando `som=1`.
- Console mostra eventos `canplay` para a trilha; nenhum erro de CORS.