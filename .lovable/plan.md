# Diários emocionais dos alunos da Carta Consulta

## Situação atual (verificada)

Os diários existem: 453 registros dos 10 alunos vinculados à Carta Consulta.

- 9 alunos com 50 registros cada, entre 29/12/2025 e 16/02/2026
- Boris Johnson com 3 registros, entre 01/03/2026 e 03/03/2026

Como hoje é 06/08/2026, todos os registros estão fora do período padrão da aba Diário Emocional (90 dias), por isso a mensagem "Nenhum registro no período selecionado".

## O que será feito

### 1. Reposicionar as datas dos dados fake

Deslocar todos os registros desses 10 alunos para terminarem ontem, mantendo o espaçamento entre eles e os padrões de cada perfil (ansiedade acadêmica, sono desregulado, em recuperação, etc.). Assim os 50 registros de cada aluno passam a cobrir os últimos ~2 meses.

Registros dependentes serão deslocados junto para não perder coerência: análises do diário (risco/mensagem do Buddy), práticas concluídas, respostas de escalas emocionais, ISEU e insights do Buddy.

### 2. Período padrão inteligente

Na aba Diário Emocional, quando o período selecionado não tiver registros mas existirem dados em outro intervalo, a tela passa a abrir automaticamente no intervalo onde há dados (uma única vez, sem sobrescrever a escolha manual do usuário). O botão "Ver todo o período" continua disponível.

## Detalhes técnicos

- Operação de dados (sem mudança de schema) via comandos de atualização: cálculo de um `offset` de dias por aluno = (ontem − data mais recente do aluno), aplicado a `mood_entries.date`/`created_at` e, pelo mesmo offset, a `mood_entry_analyses`, `praticas_checkouts`, `emotional_scale_responses`, `iseu_scores` e `buddy_insights` (`period_start`/`period_end`).
- Escopo restrito aos `patient_id` vinculados à instituição Carta Consulta — nenhum outro aluno é afetado.
- `src/components/institution/InstitutionWellbeingDashboard.tsx`: quando `metrics.total_entries === 0` e `metrics.availableDataRange` existir, um efeito ajusta `periodDays` para cobrir o intervalo disponível, protegido por uma flag para não entrar em loop nem ignorar a seleção manual.
