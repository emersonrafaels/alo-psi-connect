# Botão flutuante de acessibilidade

## O que o usuário verá
Um botão redondo com ícone de acessibilidade, fixo no canto inferior esquerdo de todas as páginas (o lado direito já tem WhatsApp e "voltar ao topo"). Ao clicar, abre um painel com:

- **Tamanho do texto**: A-, A, A+, A++ (90% a 150%)
- **Alto contraste**: liga/desliga
- **Tons de cinza**: liga/desliga
- **Fonte para dislexia/legível**: troca para fonte mais espaçada
- **Espaçamento de linhas e letras** maior
- **Destacar links** (sublinhado e contorno)
- **Cursor grande**
- **Pausar animações**
- **Guia de leitura** (faixa horizontal que segue o mouse)
- **Restaurar padrão**

As escolhas ficam salvas no navegador e são aplicadas imediatamente, em toda navegação. O painel funciona por teclado (Tab/Esc), tem rótulos para leitores de tela e respeita o tema claro/escuro e a tradução.

## Detalhes técnicos
- `src/features/accessibility/` com `useAccessibilityPrefs` (localStorage + aplica classes/variáveis no `<html>`), `AccessibilityWidget.tsx` (Button + Popover/Sheet shadcn, Switch, ToggleGroup) e regras CSS em `index.css` (`.a11y-contrast`, `.a11y-grayscale`, `.a11y-readable-font`, `.a11y-spacing`, `.a11y-links`, `.a11y-big-cursor`, `.a11y-no-motion`, `--a11y-font-scale` no `html { font-size }`).
- Aplicação inicial antes da renderização para evitar "piscar".
- Montado uma vez no App, com `data-no-translate` apenas nos controles numéricos; rótulos traduzíveis.
- Teste pequeno das regras de limites de escala e reset.
- Regra registrada em `AGENTS.md`.
