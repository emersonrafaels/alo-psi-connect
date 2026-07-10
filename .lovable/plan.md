# Unificar contagem de alunos em atenção (Panorama × Triagem)

## Problema
No Portal Institucional, dois blocos mostram "X alunos precisam da sua atenção esta semana" com números diferentes (24 no Panorama do Diário, 22 na aba Triagem). A causa é que cada bloco usa um **período de análise** distinto:

- `PanoramaCard` recebe o `periodDays` do dashboard (ex.: 90 dias).
- `StudentTriageTab` tem seu **próprio seletor** (padrão 15 dias).

Como a classificação de risco depende do período, o mesmo hook (`useStudentTriageData`) devolve contagens diferentes.

## Objetivo
Deixar claro para o gestor que os dois blocos falam da mesma coisa e, quando os números divergirem, explicar por quê.

## Mudanças

### 1. Alinhar período por padrão
- No `PanoramaCard`, deixar de usar o `periodDays` do dashboard para o cálculo de risco e passar a usar o **mesmo período da triagem** (default 15 dias — memória `triage-workflow-and-averages`).
- Manter o `periodDays` original apenas para o texto de engajamento ("nos últimos 90 dias, X de Y alunos registraram...").

### 2. Rótulo do período no Panorama
- Adicionar sob o headline: `Distribuição de risco baseada nos últimos 15 dias` (com o número real usado).
- Assim o gestor entende que "24" e "22" podem divergir se ele mudar o seletor da triagem depois.

### 3. Sincronização (opcional, mesmo turno)
- Persistir o período da triagem em contexto/URL (`?triagePeriod=15`) e ler no `PanoramaCard`, para que ao trocar o seletor na aba Triagem o Panorama acompanhe automaticamente.

### 4. Copy do banner da Triagem
- Trocar "esta semana" por `nos últimos {N} dias` no banner de `StudentTriageTab.tsx`, refletindo o seletor real. Mesmo ajuste no headline do `PanoramaCard`.

## Arquivos afetados
- `src/components/institution/PanoramaCard.tsx`
- `src/components/institution/StudentTriageTab.tsx`
- `src/components/institution/InstitutionWellbeingDashboard.tsx` (passar período da triagem para o Panorama)

## Fora de escopo
- Alterar a lógica de classificação de risco em `useStudentTriage`.
- Mudar o período padrão do dashboard de diário.
