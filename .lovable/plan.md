## Objetivo

Garantir que a escolha de trilha na tela de detalhe (a) seja pré-visualizada no próprio card antes de iniciar e (b) realmente troque a música durante a sessão.

## Parte 1 — Preview na tela de detalhe (`PraticaDetalhe.tsx`)

Ao clicar em um card de trilha (com URL não nula), tocar um trecho curto sem sair da página.

Comportamento:
- Botão ▶/⏸ no canto do card ativo, e clique no card inicia o preview da trilha selecionada.
- Apenas uma trilha toca por vez — selecionar outra interrompe a anterior.
- Auto-stop após ~15s ou ao sair da página/iniciar a sessão.
- Fade-in/out de 400ms para evitar estouro.
- "Sem trilha" e "Recomendada" (auto) não disparam preview — apenas selecionam.
- Volume fixo baixo (0.5) e ícone indicando "prévia".

Implementação:
- Hook local `useTrackPreview()` mantendo um único `HTMLAudioElement` em ref.
- `useEffect` de cleanup ao desmontar.
- Estado `previewingId` para destacar o card ativo (animação de onda sonora discreta usando `Waves` já importado).

## Parte 2 — Garantir troca durante a sessão (`PraticaSessao.tsx`)

A lógica em `audioUrl` já resolve corretamente o track via `getTrackById(trackParam)`. Porém o `<audio>` recebe `src={audioUrl}` mas o `useEffect` que controla play/pause depende de `audioUrl` apenas para `play()`, não força reload quando a URL muda em runtime (caso futuro de seletor in-session).

Ajustes:
1. Adicionar `key={audioUrl}` no `<audio>` para remontar quando trocar.
2. Quando `audioUrl` mudar, chamar `a.load()` antes de `a.play()` no effect, garantindo que o navegador carregue o novo src (algumas versões mantêm o anterior em cache de elemento).
3. Logs `[pratica] track resolvido` na montagem para facilitar verificação.

Validação:
- Abrir detalhe, selecionar cada trilha → checar console na sessão para confirmar URL correta sendo carregada.
- Testar "Sem trilha" → `<audio>` não renderiza e apenas ambient procedural toca.
- Testar "Recomendada" → cai no fallback de `resolverAudioPratica`.

## Fora do escopo

- Seletor de trilha dentro da sessão (chrome flutuante) — pode ser feito depois se desejado.
- Mudanças visuais nos cards além do estado "tocando preview".

## Arquivos afetados

- `src/pages/praticas/PraticaDetalhe.tsx` — preview controller + UI do card.
- `src/pages/praticas/PraticaSessao.tsx` — `key` + `load()` ao trocar src.
