## Plano

Resolver o corte dos controles na sessão da prática em telas de notebook (sem fullscreen) movendo o conjunto de botões para uma barra vertical à direita e liberando rolagem do contêiner.

## Alterações em `src/pages/praticas/PraticaSessao.tsx`

1. **Permitir rolagem do contêiner da sessão**
   - Trocar `overflow-hidden overscroll-none` por `overflow-y-auto` no wrapper raiz, mantendo `height: 100dvh` para preencher a viewport.
   - `<main>` deixa de ser `flex-1` rígido: usa `min-h-full` + padding inferior para acomodar a barra lateral em telas estreitas.

2. **Mover o `<footer>` para uma barra vertical lateral em `sm+`**
   - Em telas `sm` e maiores: posicionar como coluna vertical fixa no lado direito (`fixed right-4 top-1/2 -translate-y-1/2`), com `flex-col` e `gap-3`. Os botões viram redondos e empilhados; o slider de volume gira para vertical (`orientation="vertical"`, altura ~96 px).
   - Em telas `< sm`: mantém o comportamento atual (linha no rodapé, com `position: sticky bottom-0` para nunca sumir).
   - Botões Pausar/Encerrar passam a usar `size="icon"` na lateral, com ícones (`Pause`/`Play` e `X`) e `title`/`aria-label` descritivos. No mobile mantêm o rótulo textual atual.

3. **Auto-hide do chrome**
   - A barra lateral também respeita `chromeVisible` (mesma transição de opacidade).

## Critério de aceitação

- Em notebook (~720 px de altura), todos os controles ficam visíveis sem precisar entrar em fullscreen.
- Se ainda assim o conteúdo exceder a viewport, é possível rolar verticalmente.
- Em mobile, o rodapé continua na parte inferior como hoje.