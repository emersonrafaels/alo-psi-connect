# Roda das Emoções: emojis e nível 3 visível

## O que muda

### 1. Emojis nas famílias (nível 1)
- Cada família ganha um emoji curatorial, ao estilo da referência: Raiva ⚡, Medo 🛡️, Tristeza 💧, Alegria ☀️, Nojo 🌀, Surpresa ✨.
- No anel/miolo da família, o emoji aparece acima do nome, com tamanho proporcional à fatia. Na roda sem família escolhida, emoji + rótulo em duas linhas centralizadas.
- Com família aberta, o emoji aparece no anel interno e no núcleo central, ao lado do nome da família.
- Os mesmos emojis aparecem nos cards de nível 2 (`EmotionLevelCards`) e no chip "Família selecionada", para dar continuidade visual.

### 2. Roda mais bonita
- Bordas das fatias mais finas e arredondadas na aparência, com leve sombra interna no núcleo para dar profundidade.
- Fatia ativa ganha realce (anel fino claro em volta e leve aumento de brilho); fatias não escolhidas ficam mais discretas.
- Micro-transições ao trocar de família/palavra, respeitando `prefers-reduced-motion`.

### 3. Nível 3 visível ao lado da roda
- O chip acima/ao lado da roda passa a mostrar a trilha completa: `Família → Palavra (nível 2) → Palavra (nível 3)`, com o emoji da família no início e um separador discreto.
- Quando o nível 3 ainda não foi escolhido, aparece só até o nível 2 (sem placeholder vazio).
- O núcleo da roda continua com a hierarquia; o painel lateral e o resumo de contexto usam a mesma trilha, sem duplicar informação.
### 4. Detalhes que fazem a experiência ser UAU
- **Hover informativo**: ao passar o mouse (ou focar) numa fatia, o núcleo antecipa a palavra em texto grande, sem precisar clicar — leitura instantânea mesmo em fatias estreitas.
- **Halo suave por família**: um brilho radial na cor da família atrás da roda, dando a sensação de luz própria como na referência.
- **Núcleo vivo**: o mascote/ícone central pulsa discretamente enquanto nada foi escolhido, e vira a trilha escolhida (emoji + palavra) depois — com transição de fade/scale curta.
- **Entrada encenada**: as fatias aparecem em cascata rápida (stagger) ao abrir a roda e ao trocar de família; o anel externo desliza a partir da fatia escolhida.
- **Confirmação tátil**: clique dá um feedback de escala mínima na fatia e uma vibração curta em mobile (`navigator.vibrate`, quando suportado).
- **Intensidade colorida**: a escala de intensidade herda a cor da família, de tom claro (1) a saturado (5), conectando visualmente os passos.
- **Frase curatorial contextual**: sob a roda, a frase de `family-copy` aparece com transição ao escolher a família, no lugar da dica genérica.
- **Progresso enxuto**: um indicador de 3 pontos (família → palavra → refinamento) mostra onde o usuário está sem poluir a tela.
- Tudo o que anima respeita `prefers-reduced-motion` (versão estática equivalente).

## Detalhes técnicos
- `src/features/jornada/config/family-copy.ts` (ou novo `family-emojis.ts`): mapa `familyId → emoji`, exportado como `FAMILY_EMOJI` com fallback.
- `src/features/jornada/components/EmotionWheel.tsx`: emoji nas fatias de nível 1 e no núcleo; estado de hover/foco (`hoveredId`) para prévia no núcleo; halo com `radialGradient`; stagger via `animation-delay` por índice; realce da fatia ativa e ajustes de stroke.
- `src/features/jornada/components/EmotionLevelCards.tsx`: emoji no cabeçalho da família.
- `src/features/jornada/components/IntensityScale.tsx`: cor derivada da família (props opcional `accentColor`).
- `src/features/jornada/pages/JornadaSessao.tsx`: chip com trilha até o nível 3, frase curatorial contextual, indicador de progresso da seleção.
- `src/index.css`: keyframes de pulso/cascata e halo, atrelados a tokens existentes.
- Sem mudanças na taxonomia, reducer, motor de recomendação, analytics ou banco.

