# Mini gráficos com valores e linhas clicáveis no Comparador

## O que muda
- **Mini gráficos das 3 coletas:** cada ponto passa a mostrar seu valor logo acima dele (ex.: 47,2 · 48,1 · 48,9). O número cortado ao lado do último ponto é removido. Coletas sem dados não mostram valor.
- **Linhas da tabela "Indicadores por instrumento" clicáveis:** ao clicar numa escala (ex.: PSS-10), a página vai para a aba **Análise Integrada** já com essa escala escolhida no gráfico de comparação. A linha ganha cursor de clique, destaque ao passar o mouse e acesso por teclado (Enter). O IQoL, ainda indisponível, não fica clicável.

## Técnico
- `Sparkline` em `InstitutionComparator.tsx`: aumentar margem superior do SVG, renderizar `<text>` centralizado acima de cada ponto não nulo e remover o rótulo final lateral.
- `<tr>` com `onClick`/`onKeyDown`, `role="button"`, `tabIndex=0`: `setLineScale(inst.code); setView('integrated'); window.scrollTo(0,0)`.
