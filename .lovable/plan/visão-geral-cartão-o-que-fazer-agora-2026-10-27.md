# Visão Geral: cartão "O que fazer agora"

## O que o usuário vai ver
Um novo cartão **"O que fazer agora"** logo abaixo dos indicadores (antes do Resumo executivo do Buddy). Ele mostra até 5 ações em ordem de urgência. Cada ação traz um nível (Urgente / Importante / Sugestão), um motivo curto com o número e um botão que leva direto para a página certa.

Ações possíveis (só aparecem quando a condição se aplica):
1. **Urgente — Triar alunos Em Risco**: "10 alunos Em Risco aguardando triagem." → abre a Fila de triagem já filtrada em Em Risco.
2. **Importante — Concluir triagens em andamento**: aparece quando há triagens abertas e a taxa de resolução fica abaixo de 80%. → Triagem, aba Em andamento.
3. **Importante — Reengajar alunos**: aparece quando o engajamento dos últimos 7 dias fica abaixo de 40% ou cai em relação à semana anterior. → Apoios, para divulgar um apoio.
4. **Sugestão — Vincular alunos à estrutura acadêmica**: aparece quando há alunos sem turma/curso. → Alunos › Estrutura acadêmica.
5. **Sugestão — Atualizar o resumo do Buddy**: aparece quando o último resumo tem mais de 7 dias ou ainda não existe.

Quando nada estiver pendente: "Tudo em dia ✓ — nenhuma ação pendente agora."

## Detalhes técnicos
- Novo `src/features/institution/portal/overviewActions.ts`: função pura `buildOverviewActions(input)` que recebe os números já carregados (criticalOpen, totalTriage, resolvedTriage, engagementRate, activeStudentsWeek/PrevWeek, alunos sem vínculo, data do último resumo) e devolve a lista ordenada, com no máximo 5 itens. Os limites (80% de resolução, 40% de engajamento, 7 dias) ficam em constantes no arquivo.
- Novo `OverviewActions.tsx` no mesmo diretório, renderizado dentro de `InstitutionExecutiveHeader`, que já tem o resumo executivo e o histórico do Buddy. Cores pelos tokens semânticos (destructive/warning/primary).
- Para contar alunos sem vínculo, reaproveitar os dados da estrutura acadêmica que já existem (`useAcademicStructure`). Se ficar pesado, essa ação é omitida.
- Teste `overviewActions.test.ts`, uma regra por teste: Em Risco > 0 gera ação urgente em primeiro; resolução de 79% gera a ação e de 80% não gera; engajamento de 39% gera a ação; tudo em dia retorna lista vazia; nunca mais de 5 itens.
- Nenhuma mudança no banco; dados continuam agregados e anônimos.
