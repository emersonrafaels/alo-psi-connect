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

## Detalhes técnicos
- `src/features/jornada/config/family-copy.ts` (ou novo `family-emojis.ts`): mapa `familyId → emoji`, exportado como `FAMILY_EMOJI` com fallback.
- `src/features/jornada/components/EmotionWheel.tsx`: renderizar `<text>` de emoji nas fatias de nível 1 e no anel/núcleo da família; realce da fatia ativa; ajustes de stroke.
- `src/features/jornada/components/EmotionLevelCards.tsx`: emoji no cabeçalho da família.
- `src/features/jornada/pages/JornadaSessao.tsx`: chip de estado ao lado da roda mostrando a trilha até o nível 3.
- Sem mudanças na taxonomia, reducer, motor de recomendação, analytics ou banco.

## Observação
Sua última frase ficou cortada ("Além diss…"). Se havia um terceiro ajuste, me diga e eu incluo antes de implementar.
