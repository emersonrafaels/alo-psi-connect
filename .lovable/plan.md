

## Seletor de Periodo de Analise com Comparativo entre Periodos

### Visao Geral

Adicionar um seletor de periodo de analise ao sistema de triagem (default: 15 dias) que afeta todos os indicadores e metricas. Alem disso, implementar comparativo automatico entre o periodo atual e o periodo anterior de mesmo tamanho (ex: ultimos 15 dias vs 15-30 dias atras).

### Mudancas

**1. Hook `useStudentTriageData` - aceitar periodo dinamico**

Arquivo: `src/hooks/useStudentTriage.tsx`

- Adicionar parametro `periodDays` (default 15) ao hook `useStudentTriageData`
- Incluir no `queryKey` para revalidar ao mudar periodo
- Substituir o hardcoded "14 dias" por `periodDays`
- Buscar tambem os dados do periodo anterior (para comparacao): se periodo = 15 dias, buscar tambem de 30 a 15 dias atras
- Retornar dados adicionais por aluno: `prevAvgMood`, `prevAvgAnxiety`, `prevAvgEnergy`, `prevAvgSleep`, `prevEntryCount` (do periodo anterior)
- Atualizar interface `StudentRiskData` com os campos de periodo anterior

**2. Componente `StudentTriageTab` - seletor de periodo + comparativos**

Arquivo: `src/components/institution/StudentTriageTab.tsx`

- Adicionar estado `analysisPeriod` com default `15` (opcoes: 7, 15, 30, 60, 90 dias)
- Adicionar seletor visual (Select ou botoes) no topo, proximo ao titulo/filtros
- Passar `analysisPeriod` para o hook `useStudentTriageData`
- Atualizar todas as referencias "14 dias" para usar o periodo selecionado
- Nos cards de resumo (critical/alert/attention/healthy/no_data), exibir uma seta e delta numerico comparando com o periodo anterior (ex: "3 (+1)")
- Na secao "Medias da turma", mostrar a variacao vs periodo anterior (ex: "Humor: 3.2 (+0.3)")
- Nos indicadores de cada aluno, adicionar icone de seta mostrando se melhorou ou piorou em relacao ao periodo anterior
- Na legenda "Sem Dados", atualizar dinamicamente (ex: "Sem registros nos ultimos 15 dias")
- Atualizar tooltip de engajamento (ex: "X/15 dias" em vez de fixo "X/14 dias")

**3. Componente `TriageMetricsDashboard` - comparativo**

Arquivo: `src/components/institution/TriageMetricsDashboard.tsx`

- Receber `periodDays` como prop
- Filtrar triagens pelo periodo selecionado (em vez de fixo "este mes")
- Adicionar comparativo: mostrar delta em relacao ao periodo anterior
- Ex: "12 triagens (+3 vs periodo anterior)"

**4. Textos e legendas dinamicos**

- `riskLegend.no_data`: "Sem registros nos ultimos X dias" (dinamico)
- `riskTooltips.no_data.description`: atualizar com periodo
- Label "Indicadores (X dias)" nos cards de alunos
- Badge de engajamento: "X/Y dias" onde Y = periodo selecionado

### Detalhes do Seletor de Periodo

Opcoes disponiveis:

| Label | Valor |
|---|---|
| 7 dias | 7 |
| 15 dias (default) | 15 |
| 30 dias | 30 |
| 60 dias | 60 |
| 90 dias | 90 |

Visual: Select dropdown ao lado dos filtros existentes, com icone de calendario.

### Detalhes do Comparativo

Para cada metrica, o comparativo mostrara:
- Seta verde para cima: melhora (humor/energia/sono subiu, ansiedade desceu)
- Seta vermelha para baixo: piora (humor/energia/sono desceu, ansiedade subiu)
- Traco cinza: sem variacao significativa (delta < 5%)
- Texto pequeno com o delta numerico (ex: "+0.3" ou "-0.5")

Nos cards de resumo de risco, mostrar a variacao na contagem:
- "3 alunos criticos (+1 vs periodo anterior)" ou "(=)" se nao mudou

### Detalhes Tecnicos

| Arquivo | Mudanca |
|---|---|
| `src/hooks/useStudentTriage.tsx` | Adicionar `periodDays` param, buscar periodo anterior, retornar dados comparativos em `StudentRiskData` |
| `src/components/institution/StudentTriageTab.tsx` | Adicionar estado `analysisPeriod`, seletor, passar para hook, exibir comparativos nos cards/indicadores, textos dinamicos |
| `src/components/institution/TriageMetricsDashboard.tsx` | Receber `periodDays`, filtrar por periodo, exibir deltas comparativos |

Nenhum arquivo novo. Nenhuma mudanca no banco de dados.

