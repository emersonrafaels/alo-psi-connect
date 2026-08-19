# Roda das Emoções — redesign da experiência

## Problemas hoje

- A roda é pequena (360px fixos) e fica comprimida em uma coluna lateral, competindo com as listas de nível 2 e 3 em chips.
- O botão "Ver lista completa" troca a tela inteira por outra interface (lista com busca), sem relação visual com a roda — o usuário perde o contexto e não entende que é o mesmo passo.
- A navegação por níveis acontece fora da roda (chips à direita), então a roda parece decorativa em vez de ser o instrumento principal.

## O que vamos fazer

### 1. Roda grande e protagonista

- A roda passa a ocupar a largura principal da etapa (até ~640px, fluida e responsiva), centralizada, com as escolhas acontecendo dentro dela.
- Três anéis concêntricos, como a roda clássica das emoções:
  - anel interno: 6 famílias (nível 1);
  - anel do meio: níveis 2 da família escolhida, que se revelam com animação ao selecionar a família;
  - anel externo: níveis 3 da fatia escolhida, revelados no mesmo movimento.
- Os anéis não selecionados perdem saturação, criando foco no caminho ativo. Clique no centro volta um nível.
- O núcleo da roda deixa de dizer "Nível 1 / Família emocional" (linguagem técnica) e passa a mostrar o estado atual: convite inicial ("Toque na emoção mais próxima") e, depois de escolher, a palavra selecionada com um botão "Seguir com esta palavra".
- Em telas pequenas a roda continua tocável (fatias com área mínima confortável) e os rótulos longos aparecem em duas linhas ou abreviados com o nome completo no toque.

### 2. Fim do "Ver lista completa"

- Removemos o toggle roda/lista. No lugar, um campo de busca discreto acima da roda: "Buscar uma palavra (ex.: sobrecarregado)".
- Ao digitar, aparecem sugestões (palavra + família colorida). Escolher uma sugestão acende o caminho correspondente na roda e segue o fluxo — a roda continua sendo a referência visual, sem troca de tela.
- Mantemos um link textual secundário "não encontrei o que sinto" que sugere a família mais próxima, em vez de abrir outra interface.

### 3. Acessibilidade preservada

- A lista completa continua existindo como alternativa acessível, mas dentro de um painel expansível ("Ver todas as palavras") no fim da etapa, claramente secundário, sem substituir a roda.
- Navegação por teclado nas fatias (setas para percorrer o anel, Enter para escolher, Esc para subir um nível) e rótulos ARIA descrevendo nível e família.

### 4. Polimento visual e microinterações

- Transições suaves de revelação dos anéis, hover com leve elevação da fatia, respeitando `prefers-reduced-motion`.
- Cores das famílias vindas da taxonomia atual, com textos garantindo contraste em claro e escuro.
- Breadcrumb acima da roda fica compacto e clicável, apenas como indicador do caminho.

## Detalhes técnicos

- `src/features/jornada/components/EmotionWheel.tsx`: reescrito para roda de três anéis, tamanho fluido via `viewBox` + container, props para família/nível 2/nível 3 selecionados e callbacks por nível.
- `src/features/jornada/components/EmotionSearch.tsx` (novo): busca com sugestões sobre `SELECTABLE_EMOTIONS`, normalizando acentos (reaproveita a lógica atual do fallback).
- `src/features/jornada/components/EmotionListFallback.tsx`: mantido, passa a ser renderizado dentro de um accordion secundário.
- `src/features/jornada/pages/JornadaSessao.tsx`: etapa `wheel` reorganizada em coluna única (busca → breadcrumb → roda → lista secundária); remoção do estado `useList` e do botão de toggle; chips de nível 2/3 removidos, pois passam a viver na roda.
- Sem mudanças no reducer, no motor de recomendação ou no banco; os mesmos eventos de analytics continuam sendo disparados (com `source` refletindo roda ou busca).
