Corrigir de vez a caixa "Como a criticidade é calculada", que continua aparecendo por trás dos cards.

Causa: a caixa é desenhada dentro da barra de período, que cria sua própria camada; por isso, aumentar a prioridade de sobreposição dela não resolve.

- Em `src/components/institution/StudentTriageTab.tsx`, renderizar essa caixa fora da barra (via `TooltipPrimitive.Portal` do Radix), direto no corpo da página, mantendo fundo sólido e sombra.
- Abrir a Triagem no navegador e tirar um print com a caixa aberta para confirmar que ela aparece por cima dos cards.
- Não altera outras caixas de ajuda do site.
