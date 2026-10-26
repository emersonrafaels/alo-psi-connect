## Remover texto duplicado na página inicial do Buddy

Hoje o primeiro parágrafo do Buddy aparece duas vezes: no balão de fala e logo abaixo, no texto completo.

### O que muda
- O balão continua mostrando o primeiro parágrafo (a saudação).
- O texto abaixo do selo "Últimos 30 dias" passa a mostrar só os parágrafos seguintes, sem repetir a saudação.
- Se o resumo tiver apenas um parágrafo, a área de baixo some (fica só o balão, o selo e os botões).

### Detalhes técnicos
- `src/pages/buddy/BuddyHome.tsx`: dividir `insight.narrative` por linhas em branco; usar o primeiro bloco no `BuddyMascot` e o restante (`slice(1).join("\n\n")`) no parágrafo de baixo, renderizado só quando não vazio.
