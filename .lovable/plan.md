# Barras de carregamento no portal institucional

## O que muda
Sempre que o portal estiver buscando dados (triagem, números dos cards, gráficos, listas de alunos, histórico, comparador), aparece uma barra de progresso animada nas cores da Rede Bem-Estar, no lugar de "Carregando...", giradores ou números zerados.

- Cards de números: barra fina animada no lugar do valor, com o rótulo do card visível.
- Seções inteiras (triagem, gráficos, listas, comparador): barra no topo da seção + texto curto ("Carregando dados da triagem...").
- Topo da página: barra fina global enquanto qualquer dado do portal estiver carregando.
- Evita mostrar "0" ou "Sem dados" antes da resposta chegar (ex.: cards da Triagem).

## Onde
Portal Institucional (visão geral, cabeçalho executivo, bem-estar, panorama, Buddy), Alunos, Profissionais, Triagem (página nova), Comparador, histórico do aluno e modais de atividade.

## Detalhes técnicos
- Novo `src/components/ui/loading-bar.tsx`: barra indeterminada (variantes `inline`, `section`, `top`) com tokens semânticos (`--primary`, `--muted`), animação keyframe em `tailwind.config`, respeitando `prefers-reduced-motion` e `role="progressbar"`/`aria-busy`.
- Barra global no topo usando `useIsFetching()` do React Query nas rotas `portal-institucional`.
- Substituir `Loader2`/textos de carregamento e estados `isLoading` nos arquivos: InstitutionPortal, InstitutionStudents, InstitutionProfessionals, InstitutionTriage, InstitutionComparator, StudentTriageTab, TriageMetricsDashboard, PanoramaCard, InstitutionExecutiveHeader, InstitutionWellbeingDashboard, InstitutionMoodAggregates, BuddyInstitutionPanel, StudentBuddyPanel, StudentTimelineModal, StudentActivityModal, PredictiveInsightsPanel.
- Cards de triagem: renderizar barra enquanto `isLoading`, em vez de contagens 0.
