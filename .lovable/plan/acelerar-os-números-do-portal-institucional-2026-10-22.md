# Acelerar os números do Portal Institucional

## Problema
Para instituições grandes (ex.: Afya, ~2.800 alunos), o portal baixa milhares de linhas brutas para o navegador (alunos, diários do período atual e anterior, Buddy, acessos) em várias páginas de 1.000 linhas e lotes de IDs, em sequência, e só depois calcula as médias. Isso gera dezenas de requisições por carregamento.

## O que muda
1. **Bem-estar (cartões e gráfico diário)**: os números passam a ser calculados direto no banco, numa única consulta que já devolve médias, totais, alunos com humor baixo, comparação com período anterior e série diária. Só números agregados saem do banco (mantém a privacidade).
2. **Cartão de alunos / totais**: contagem feita no banco (`count`) em vez de baixar todos os vínculos.
3. **Requisições em paralelo**: as consultas independentes do painel (crescimento, engajamento, alertas, notas, bem-estar) disparam juntas; os lotes de IDs restantes rodam em paralelo com limite, em vez de um a um.
4. **Cache**: manter os números em cache por alguns minutos ao trocar de aba/voltar ao portal, para não recarregar tudo.
5. **Índices**: conferir os índices em `mood_entries(profile_id, date)` e `patient_institutions(institution_id)` e criar os que faltarem.
6. **Medição**: antes e depois, medir o tempo das consultas mais lentas para confirmar o ganho.

## Detalhes técnicos
- Nova RPC `get_institution_wellbeing_summary(p_institution_id, p_start, p_end, p_prev_start)` `SECURITY DEFINER`, verificando `user_has_institution_access`; `useInstitutionWellbeing` passa a usá-la (insights continuam calculados no cliente a partir do agregado).
- `useInstitutionAccess` / `useInstitutionBuddyAccess`: usar `select(..., { count: 'exact', head: true })` onde só a contagem é usada.
- `fetchInChunks` em `src/lib/supabasePaging.ts`: execução concorrente (ex.: 4 lotes simultâneos).
- React Query `staleTime` ~5 min nas queries do portal.
- Usar `supabase--slow_queries` e `EXPLAIN ANALYZE` para validar índices.
