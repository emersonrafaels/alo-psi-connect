## Objetivo

Permitir aumentar/diminuir o zoom das imagens explicativas das escalas (WHO-5, PHQ-9, GAD-7, PSS-10, ISI, MHC-SF, ISEU-RBE) no `ScaleExplainerDialog`.

## Mudanças

Apenas em `src/components/scales/ScaleExplainerDialog.tsx` (sem alterar consumidores nem APIs).

### 1. Estado e modelo de zoom
- Novo state `zoom: number` (1.0 = fit). Range: `0.5` a `4.0`, passo `0.25`.
- Substituir a lógica atual de "maximizar = força 140%" por um zoom contínuo. Modo "maximizado" passa a controlar apenas o tamanho do dialog (95vw/95vh vs 3xl).
- Reset de `zoom` para `1` ao abrir/fechar e ao alternar maximize.
- `clampPan` usa o tamanho real da imagem multiplicado pelo zoom.

### 2. Controles visuais (sempre visíveis quando a imagem está carregada)
Barra flutuante no canto inferior central da área da imagem, com fundo `bg-background/90 backdrop-blur` e `border`:
- Botão `−` (ZoomOut icon) — diminui em 0.25
- Slider horizontal (Radix `Slider`, largura ~140px) ligado a `zoom`
- Botão `+` (ZoomIn icon) — aumenta em 0.25
- Label compacto `{Math.round(zoom*100)}%`
- Botão `Reset` (RotateCcw icon) — volta para 1 e zera o pan
- Todos com `aria-label`, desabilitados nos limites.

### 3. Interações adicionais
- Scroll do mouse na área da imagem: ajusta zoom (`wheel` event, `preventDefault`, delta = ±0.1 ou ±0.25).
- Atalhos de teclado quando o dialog está aberto: `+`/`=` → zoom in, `-` → zoom out, `0` → reset.
- Click simples na imagem: mantém o comportamento atual (alternar maximize) somente quando `zoom === 1`. Se já houver zoom, click não toggla maximize (evita conflito).
- Pan (arrastar) ativo sempre que `zoom > 1` (não mais condicionado a `maximized`).

### 4. Aplicação visual
- A `<img>` recebe `transform: translate3d(x,y,0) scale(zoom)` com `transform-origin: center`.
- Classes ajustadas: remover `min-h-[140%] min-w-[140%]`; usar `max-w-full max-h-[70vh]` no modo normal e `max-w-none max-h-none w-auto h-auto` no maximizado, deixando o `scale()` controlar o tamanho.
- Cursor: `zoom-in` quando `zoom < max` e não está arrastando; `grab`/`grabbing` quando `zoom > 1`.

### 5. Detalhes técnicos
- Importar `ZoomIn`, `ZoomOut`, `RotateCcw` de `lucide-react`.
- Importar `Slider` de `@/components/ui/slider`.
- Manter `Maximize2`/`Minimize2` no header como já existe.
- Sem mudanças em props públicas → nenhum arquivo consumidor precisa ser tocado.

## Fora do escopo
- Pinch-zoom em touch (pode ser adicionado depois; o slider/botões já funcionam em mobile).
- Persistir nível de zoom entre aberturas.
