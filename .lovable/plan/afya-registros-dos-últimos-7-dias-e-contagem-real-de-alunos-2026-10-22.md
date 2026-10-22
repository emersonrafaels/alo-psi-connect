# Afya: registros dos últimos 7 dias e contagem real de alunos

## 1. Registros recentes (últimos 7 dias)
- Gerar dados sintéticos de demonstração para os alunos Afya (Contagem, Montes Claros, Itajubá) entre 15/10 e 22/10/2026: diários emocionais, jornadas, práticas e algumas respostas de escalas.
- Participação variável (~35–55% dos alunos com registro na semana), seguindo o perfil de cada unidade e preservando os casos A–F.
- Diários usam upsert por aluno+dia (sem duplicar). Sem notificações, alertas ou mensagens reais.
- Resultado esperado: "Alunos ativos (7d)" e "Engajamento" deixam de mostrar 0.

## 2. Contagem travada em 1000
- Causa: as consultas de vínculos do portal buscam a lista de alunos e contam no navegador; o servidor devolve no máximo 1000 linhas por consulta, então a contagem para em 1000 (Afya tem ~2.800).
- Correção: usar contagem feita no servidor (count exato, sem trazer as linhas) nos cartões "Alunos" e no resumo executivo, e buscar listas paginadas em blocos de 1000 onde a lista inteira é necessária (métricas de bem-estar, alunos ativos 7d, Buddy, aba Alunos).

## Detalhes técnicos
- Hooks a revisar: `useInstitutionPatients`, `useInstitutionAccess`, `useInstitutionWellbeing`, `useInstitutionExecutiveSummary`, `useInstitutionBuddyAccess`.
- Contagem: `select('id', { count: 'exact', head: true })`; listas: helper `fetchAllPaged` com `.range()`.
- Filtros com `.in()` sobre ~2.800 IDs serão quebrados em lotes para evitar URLs longas.
- Seed via SQL de dados (inserts em `mood_entries`, `journey_sessions`, `praticas_checkouts`, `emotional_scale_responses`).
