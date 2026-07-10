Escopo aprovado: **Parte 1 + Parte 2 A + Parte 2 C + Parte 2 I**.

---

## Parte 1 — Dados demo com 90% de resolução

### 1.1 Atualizar triagens existentes da UNIFAGOC
`supabase--insert` com UPDATE em `student_triage`:
- Filtro: `institution_id` da UNIFAGOC.
- Selecionar ~90% das linhas aleatoriamente (via `ctid` + `random()`), setar:
  - `status = 'resolved'`
  - `resolved_at = created_at + interval aleatório 1–7 dias`
  - `follow_up_date = null`
  - `updated_at = resolved_at`
- Restante (~10%) fica dividido entre `triaged` e `in_progress`.

### 1.2 Ajustar `supabase/functions/seed-demo-data/index.ts`
Trocar a escolha uniforme (linhas ~344–370) por distribuição ponderada:
- 90% `resolved`, 7% `in_progress`, 3% `triaged`.
- Manter a mesma lógica de `resolved_at` / `follow_up_date`.

---

## Parte 2A — Visão executiva no topo do Portal

Novo componente `src/components/institution/InstitutionExecutiveHeader.tsx` renderizado no topo de `InstitutionPortal.tsx`, acima das abas.

Conteúdo:
1. **4 KPI cards** (grid responsivo):
   - Alunos ativos na semana (com sparkline 7d e delta vs. semana anterior).
   - % de engajamento no diário (registros / alunos ativos).
   - Alertas críticos abertos (triagens `triaged` + `in_progress` com risco alto/crítico).
   - Taxa de resolução de triagem (resolved / total no período).
   Cada card usa `Card` shadcn, ícone lucide, número grande, delta colorido (verde/vermelho) e mini sparkline (recharts `<LineChart>` compacto).

2. **Resumo semanal do Buddy** — card destacado abaixo dos KPIs:
   - Texto gerado por nova edge function `institution-weekly-brief` (Gemini via Lovable AI Gateway, cache 24h em `buddy_insights` com `insight_type='institution_weekly_brief'` e `institution_id`).
   - Botão "Atualizar" e "Exportar PDF" (usando `window.print()` com estilos dedicados nesta rodada — export PDF completo fica para depois).

3. **Feed de alertas prioritários** — lista compacta (últimos 10) unindo:
   - Triagens novas (`created_at` recente).
   - Quedas súbitas de humor (variação ≥ 2 pontos em 3 dias) — reusar heurística de `useInstitutionWellbeing`.
   - Ausência prolongada no diário (>14 dias sem registro para alunos previamente engajados).
   Cada item com ícone, título, timestamp relativo e CTA "Abrir".

Hook `useInstitutionExecutiveSummary.ts` consolidando as queries (respeitando k-anonimato ≥ 5 quando aplicável).

---

## Parte 2C — Aba Triagem evoluída

Editar `StudentTriageTab.tsx` e componentes associados.

1. **Kanban de acompanhamento**
   - Novo componente `TriageKanban.tsx` com 3 colunas: Triado → Em andamento → Resolvido.
   - Drag-and-drop via `@dnd-kit/core` (adicionar dependência).
   - Cada card mostra nome do aluno (respeitando anonimização), risco (badge colorido), dias desde criação, SLA visual (borda amarela após 3 dias, vermelha após 7).
   - Toggle no topo da aba: "Lista" (visão atual) | "Kanban".

2. **Timeline por aluno**
   - Novo componente `StudentTriageTimeline.tsx` aberto em `Dialog` ao clicar no aluno.
   - Une eventos: triagens, notas (`institution_notes`), registros de humor recentes, agendamentos (`agendamentos`).
   - Layout vertical com ícones e cores por tipo de evento.

3. **Impacto pós-intervenção expandido**
   - Reforçar `PredictiveInsightsPanel` / criar `TriageImpactChart.tsx`: gráfico "antes × depois" por aluno triado (média de humor/ansiedade 14d antes vs. 14d após `resolved_at`).
   - Exibir dentro da timeline e como card agregado na aba.

4. **Templates de nota por risco**
   - Em `QuickNotePopover.tsx`, dropdown "Usar template" com opções por nível de risco (baixo/moderado/alto/crítico). Templates ficam em constante em `src/lib/triageNoteTemplates.ts`.

---

## Parte 2I — Buddy institucional (inteligência)

Nova aba "Buddy institucional" no `InstitutionPortal.tsx` (ou seção dentro da visão executiva — implementarei como aba dedicada para dar espaço).

1. **Insights preditivos por coorte**
   - Edge function `institution-predictive-insights` (Gemini via Lovable AI Gateway).
   - Input: séries agregadas anônimas dos últimos 60 dias por coorte (curso/semestre quando disponível, fallback: instituição inteira).
   - Output estruturado (JSON) com: risco emergente, coorte afetada, evidência, janela de tempo (próx. 15 dias), confiança.
   - Cache em `buddy_insights` com `insight_type='institution_predictive'` e TTL 24h.
   - UI: cards com badge de confiança e link para detalhamento.

2. **Sugestões de ação contextuais**
   - Mesma edge function retorna array `suggested_actions` com título, descrição, categoria (grupo, prática, campanha, triagem) e CTA sugerido.
   - UI: lista de sugestões com botões que navegam para a área correspondente (`/encontros/novo`, `/praticas`, aba Alunos com filtro pré-aplicado, etc.).

3. **Benchmark anônimo com a rede (opt-in)**
   - Toggle na aba salvando preferência em `educational_institutions` (nova coluna `benchmark_opt_in boolean default false` — requer migração).
   - Quando ativo, mostrar cards comparando métricas-chave (humor médio, ansiedade média, taxa de engajamento, taxa de resolução) da instituição vs. média da rede (agregando outras instituições com opt-in, mínimo 3 instituições para exibir).
   - RPC `get_network_benchmark_aggregates` (SECURITY DEFINER) retornando apenas médias, nunca linhas individuais.

Componentes: `BuddyInstitutionPanel.tsx`, `PredictiveInsightCard.tsx`, `SuggestedActionCard.tsx`, `NetworkBenchmarkCard.tsx`.

---

## Migrações necessárias
1. `educational_institutions.benchmark_opt_in boolean not null default false`.
2. RPC `get_network_benchmark_aggregates(period_days int)` com SECURITY DEFINER e k-anon ≥ 3 instituições.
3. (Opcional) índice em `buddy_insights(institution_id, insight_type, created_at desc)` para acelerar cache.

## Edge functions novas
- `institution-weekly-brief` (Gemini, cache 24h).
- `institution-predictive-insights` (Gemini, cache 24h, saída JSON estruturada).

## Dependências
- `@dnd-kit/core` + `@dnd-kit/sortable` para o Kanban.

## Ordem de execução
1. Parte 1 (UPDATE + seed).
2. Migração `benchmark_opt_in` + RPC benchmark.
3. Edge functions (weekly brief + predictive).
4. Parte 2A (header executivo + resumo + feed).
5. Parte 2C (kanban, timeline, impacto, templates).
6. Parte 2I (painel Buddy institucional + benchmark).