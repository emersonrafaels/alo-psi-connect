



## Seletor de Periodo de Analise com Comparativo entre Periodos

### Status: ✅ Implementado

Implementado seletor de período (7, 15, 30, 60, 90 dias, default 15) com comparativo automático entre período atual e anterior.

Arquivos alterados:
- `src/hooks/useStudentTriage.tsx` - periodDays param, busca período anterior, retorna dados comparativos
- `src/components/institution/StudentTriageTab.tsx` - seletor visual, comparativos nos cards/indicadores, textos dinâmicos
- `src/components/institution/TriageMetricsDashboard.tsx` - periodDays prop, filtra por período, delta comparativo
