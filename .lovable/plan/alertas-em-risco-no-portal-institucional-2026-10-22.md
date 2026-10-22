# Alertas Em Risco no Portal Institucional

## O que muda
1. O card e a janela passam a se chamar **"Alertas Em Risco abertos"**. A descrição vira "triagens Em Risco ou em Alerta não resolvidas", e a mensagem vazia fala em "Nenhuma triagem Em Risco em aberto".
2. **Por que aparece 5 e a janela fica vazia:** o número conta as triagens abertas de risco alto ou "Em Risco" entre as 200 mais recentes. A janela, porém, só olha as **5 triagens mais recentes**, e essas já estão resolvidas, por isso aparece "Tudo tranquilo". Agora a janela vai listar exatamente as mesmas triagens que o número conta, então os dois sempre vão bater.
3. O limite de 200 triagens também faz a "Taxa de resolução" mostrar "175 de 200". Ela vai passar a considerar todas as triagens da instituição.

## Detalhes técnicos
- `useInstitutionExecutiveSummary.ts`: buscar `student_triage` com paginação (sem `.limit(200)`), em vez de usar só a triagem mais recente. Criar `criticalTriageAlerts` com todas as abertas de risco alto/crítico, com a mais recente primeiro, e usar o tamanho dessa lista como `criticalOpen`. O feed continua com no máximo 10 itens.
- `InstitutionExecutiveHeader.tsx`: a janela usa `summary.criticalTriageAlerts` (até 20, com rolagem e link para a Triagem filtrada `?view=fila&risk=critical`). Os textos são atualizados e os alunos continuam anonimizados.
