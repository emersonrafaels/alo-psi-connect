# Roda das Emoções — legibilidade e família fixa

## Problema

No segundo nível, todos os anéis usam a mesma cor da família (ex.: verde do Nojo) com texto branco. Em famílias claras (Nojo, Alegria, Surpresa) as palavras quase desaparecem, e o núcleo passa a dizer "Escolha uma palavra" — a família selecionada deixa de aparecer com destaque.

## O que muda

### Contraste e leitura da roda

- Cada anel passa a ter um tom próprio derivado da cor da família: anel do meio (nível 2) em tom mais escuro/saturado, anel externo (nível 3) em tom claro. Isso separa visualmente os níveis mesmo em famílias de cor clara.
- A cor do texto de cada fatia é calculada pela luminância do preenchimento: tinta escura sobre tons claros, branca sobre tons escuros — nunca branco sobre verde-claro.
- Rótulos ganham peso e tamanho mínimo maiores; nomes longos (Desaprovação, Repugnância) quebram em duas linhas em vez de encolher para tamanhos ilegíveis.
- Fatias não relacionadas à seleção atual perdem saturação em vez de opacidade, mantendo o texto legível.
- Contornos entre fatias mais finos e na cor do fundo, para a roda parecer contínua e menos "listrada".

### Família emocional permanece visível

- O núcleo mostra sempre a família selecionada em destaque (nome grande + ponto na cor da família) e, abaixo, a palavra escolhida do nível 2 quando existir — em vez de trocar o nome da família por "Escolha uma palavra".
- O anel interno (faixa da família) recebe rótulo com o nome da família e mantém a ação de voltar, agora com texto "trocar família" claramente secundário.
- Acima da roda, um chip fixo com a cor e o nome da família selecionada, alinhado ao card lateral de descrição.
- O card lateral da família continua aberto durante os níveis 2 e 3, com a palavra atual marcada entre os chips.

### Cards de nível 2 e 3

- A barra colorida lateral vira um cabeçalho com ponto de cor + nome da família, para o card ficar coerente com a roda.
- Card selecionado usa o tom da família (fundo suave) em vez de apenas anel do primary, reforçando a associação com a fatia da roda.

## Detalhes técnicos

- `src/features/jornada/components/EmotionWheel.tsx`: helpers de derivação de tom (escurecer/clarear a cor hex da família) e de cor de texto por luminância, aplicados por anel; ajuste de `wrap()` e tamanhos de fonte; núcleo reescrito para exibir família + palavra; rótulo do anel interno.
- Reaproveitar `getLuminance` / `hexToHSL` de `src/utils/colorHelpers.ts` para a decisão de tinta clara/escura.
- `src/features/jornada/components/EmotionLevelCards.tsx`: cabeçalho com ponto de cor e estado selecionado com fundo tonal.
- `src/features/jornada/pages/JornadaSessao.tsx`: chip da família acima da roda e card lateral persistente nas seções 2 e 3.
- Sem mudanças no reducer, na taxonomia, no motor de recomendação ou no banco.
