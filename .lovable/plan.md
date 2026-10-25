# Alinhar "Revisar alunos sem registros" com a fila

## Por que os números diferem
- **1037** = todos os alunos sem registro no diário no período, incluindo os que já têm triagem em andamento ou concluída.
- **25** = só os alunos sem dados que ainda estão **aguardando triagem** (aba "Para Triar").

O card leva para "Para Triar", então mostra um total que a lista não exibe.

## O que muda
1. O card passa a mostrar o número que ainda precisa de ação (os 25 aguardando triagem), igual ao que aparece ao abrir.
2. Abaixo do número, uma linha pequena: "1037 sem registros no período no total", para não perder a visão geral.
3. O texto explicativo do card fica: "Sem registro no diário nos últimos X dias e ainda sem triagem."
4. O mesmo ajuste vale para o funil ("Ver sem registros").

## Detalhes técnicos
- Em `StudentTriageTab.tsx`, `noData` deixa de usar `counts.no_data` e passa a contar alunos `no_data` cujo status é "para triar" (mesma regra já usada para Em Risco, compartilhada com o resumo executivo).
- `TriageViews.tsx` recebe também o total geral para a linha secundária.
- Teste em `priorities.test.ts`: aluno sem dados e com triagem concluída não entra na contagem do card.
