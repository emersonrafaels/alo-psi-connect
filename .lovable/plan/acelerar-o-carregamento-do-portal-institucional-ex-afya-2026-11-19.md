# Acelerar o carregamento do Portal Institucional (ex.: Afya)

## O que o diagnóstico mostrou
As consultas mais lentas do banco são todas a **lista completa de alunos da instituição** (vínculo aluno → paciente → perfil), baixada inteira para o navegador e depois filtrada/contada lá:
- ~1,0 s em média por chamada (pico 7 s), 1.404 chamadas
- ~1,4 s em média (pico 6,9 s), 666 chamadas
- outras variações de 0,5–0,75 s, além de diário (6.198 chamadas pequenas), triagem (6.064) e alocações/turmas (~0,24 s)

Ou seja: cada tela abre baixando ~2.800 alunos várias vezes, muitas vezes em pedaços de 1.000, e em sequência.

## O que vamos fazer

1. **Números prontos no banco, não no navegador**
   - Uma consulta única de "resumo do portal" que devolve só os totais (alunos, ativos, engajamento, níveis de sinal, pedidos de apoio, triagens pendentes) por instituição/unidade.
   - Visão geral, cabeçalho e ações passam a usar esse resumo em vez da lista inteira.

2. **Lista de alunos paginada e buscada no servidor**
   - Telas de Alunos, Triagem ("Todos os alunos"), Mensagens (alunos específicos) e Radar carregam 50 por vez, com busca e filtros (unidade, curso, turma, nível) feitos no banco.
   - Mantém rótulos `Aluno #N` e nada de identidade nova exposta.

3. **Fim das consultas repetidas**
   - Unificar os vários hooks que buscam a mesma lista (`useInstitutionPatients`, `useStudentTriage`, `useInstitutionExecutiveSummary`, `useInstitutionBuddyAccess`, Radar) num cache compartilhado.
   - Substituir as milhares de consultas pequenas de diário/triagem por aluno por uma consulta agrupada.
   - Ajustar o "atualizar ao voltar à aba" para recarregar só o resumo, não tudo.

4. **Índices no banco**
   - Índices em vínculos por instituição+status, diário por perfil+data, triagem por aluno+data, alocações por aluno e pedidos de apoio por instituição+status. Confirmar com análise de plano antes/depois.

5. **Carregamento progressivo na tela**
   - Mostrar os cartões de números primeiro e carregar gráficos e listas abaixo depois; seções fora da tela só carregam quando o usuário rola até elas.

## Meta e verificação
- Medir antes/depois na Afya (tempo até os números aparecerem e total de consultas ao abrir).
- Meta: números da Visão geral em menos de 1,5 s e nenhuma consulta acima de 300 ms ao abrir o portal.
- Conferir que os números batem com os atuais (mesmos totais antes e depois).

## Detalhes técnicos
- Nova RPC `get_institution_portal_summary(p_institution_id, p_unit_id)` SECURITY DEFINER com checagem de acesso (gestor, admin, Admin RBE, Coordenação clínica), seguindo o padrão das RPCs agregadas existentes.
- Nova RPC `list_institution_students_page(...)` com limit/offset, filtros e contagem total, devolvendo apenas IDs + rótulo anônimo + métricas.
- Migração com `CREATE INDEX` (sem CONCURRENTLY) nas colunas acima; validar com `EXPLAIN ANALYZE`.
- React Query com `queryKey` compartilhada e `staleTime` de ~60 s; `usePortalFreshData` invalida apenas o resumo.
- Ordem de execução: índices (ganho imediato) → resumo agregado → paginação → unificação de hooks → carregamento progressivo.
