## Objetivo
Tornar os 4 KPIs do header executivo do Portal Institucional clicáveis com detalhes contextuais e corrigir o botão "Ver" dos alertas críticos, que troca de aba mas não rola a página até ela.

## Mudanças

### 1. `src/components/institution/InstitutionExecutiveHeader.tsx`
- Transformar os 4 `KpiCard` em botões (role=button, cursor-pointer, hover ring) que abrem um `Dialog` de detalhes.
- Novo componente interno `KpiDetailDialog` com conteúdo específico por KPI:
  - **Alunos ativos (7d)**: mini gráfico de barras diário reaproveitando `summary.sparkline` + comparação com semana anterior.
  - **Engajamento**: total de alunos vinculados, ativos na semana, taxa, dica prática.
  - **Alertas críticos abertos**: lista das triagens de alto/crítico não resolvidas (reaproveitar `summary.alerts` filtrando `type==='triage' && severity==='high'`) com botão "Abrir triagem" que chama `onNavigateToTriage` + scroll.
  - **Taxa de resolução**: donut simples (resolvidas/pendentes) + números `resolvedTriage / totalTriage`.
- Cada item do "Feed de alertas" também fica clicável, chamando `onNavigateToTriage`.
- Substituir o handler do botão "Ver" (e do "Ir para triagem") por um util local `goToTriage()` que:
  1. chama `onNavigateToTriage?.()`
  2. faz `document.getElementById('institution-tabs')?.scrollIntoView({ behavior: 'smooth', block: 'start' })`
- Sparkline continua visual, mas o card inteiro é clicável (atende ao pedido "no sparkline").

### 2. `src/pages/InstitutionPortal.tsx`
- Adicionar `id="institution-tabs"` no wrapper das `Tabs` (linha ~253) para servir de âncora do scroll.

## Fora de escopo
Sem mudanças de dados, RLS ou edge functions — todo o detalhe vem do `useInstitutionExecutiveSummary` já existente.