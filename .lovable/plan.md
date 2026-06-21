## Plano

Adicionar um controle deslizante de volume para a trilha sonora (Kevin MacLeod) na tela de sessão da prática (`/praticas/:slug/sessao`).

## Alterações

1. **`src/pages/praticas/PraticaSessao.tsx`**
   - Adicionar estado `volume` (0–1) com persistência em `localStorage` (`praticas:volume`), valor padrão `0.75`.
   - Aplicar `audioRef.current.volume` sempre que `volume` ou `muted` mudar.
   - Substituir o botão de mudo por um grupo contendo:
     - Toggle de mudo (`VolumeX` / `Volume2`).
     - Slider de volume (componente `Slider` do shadcn) com largura reduzida (~80–96 px).
   - Quando mutado, o slider continua visível; ao interagir no slider, desmutar automaticamente.
   - Atualizar `aria-label` e tooltip/title do grupo para refletir volume e estado de mudo.

2. **`src/components/ui/slider.tsx`**
   - Nenhuma alteração esperada; usar o componente existente.

## Critério de aceitação

- O usuário pode ajustar o volume da trilha sonora diretamente na tela de prática.
- O volume escolhido persiste entre sessões.
- O botão de mudo continua funcionando e reflete o estado visualmente.