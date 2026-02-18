

## Seletor de Comparador com Controle Liga/Desliga

### O que muda

Atualmente, o comparativo entre periodos esta sempre ativo e fixo (compara com o periodo anterior de mesmo tamanho). A proposta e:

1. **Comparador desligado por default** - ao entrar na tela, nenhum comparativo e exibido
2. **Switch "Comparar"** - um toggle ao lado do seletor de periodo para ligar/desligar
3. **Seletor de periodo comparativo** - quando ligado, aparece um segundo seletor para escolher o periodo de comparacao (7, 15, 30, 60, 90 dias)
4. **Banner de periodos** - um indicador visual claro mostrando "Periodo atual: DD/MM - DD/MM" e "Periodo comparativo: DD/MM - DD/MM"

### Mudancas por arquivo

**`src/hooks/useStudentTriage.tsx`**
- Adicionar parametro opcional `comparePeriodDays` ao hook `useStudentTriageData`
- Quando `comparePeriodDays` for `null/undefined`, nao buscar dados do periodo anterior (economiza query)
- Quando definido, buscar dados do periodo comparativo com o tamanho especificado (pode ser diferente do periodo atual)
- Incluir `comparePeriodDays` no `queryKey`

**`src/components/institution/StudentTriageTab.tsx`**
- Adicionar estado `compareEnabled` (default: `false`) e `comparePeriod` (default: igual ao `analysisPeriod`)
- Adicionar Switch "Comparar" ao lado do seletor de periodo
- Quando ligado, mostrar segundo Select para o periodo comparativo
- Passar `comparePeriodDays` ao hook apenas quando `compareEnabled === true`
- Condicionar toda a exibicao de deltas/comparativos ao `compareEnabled`:
  - Cards de resumo: ocultar os `(+1)` / `(=)` quando desligado
  - Medias da turma: ocultar os deltas quando desligado
  - Cards de alunos: ocultar setas comparativas quando desligado
- Adicionar banner de periodo abaixo dos filtros quando comparador ligado, mostrando:
  - "Periodo atual: 04/02 - 18/02 (15 dias)"
  - "vs. Periodo comparativo: 20/01 - 04/02 (15 dias)"

**`src/components/institution/TriageMetricsDashboard.tsx`**
- Receber prop `compareEnabled` (boolean)
- Ocultar `DeltaIndicator` quando `compareEnabled === false`

### Layout dos controles

```text
[Buscar aluno...] [15 dias v] [Comparar: OFF/ON] [30 dias v*] [Nivel de risco v] [Exportar v]
                                                   * so aparece quando ON

Quando comparador ligado:
+------------------------------------------------------------------+
| Periodo atual: 04/02 - 18/02 (15 dias)                          |
| vs. Periodo comparativo: 20/01 - 04/02 (30 dias)                |
+------------------------------------------------------------------+
```

### Detalhes tecnicos

- O `comparePeriod` pode ser diferente do `analysisPeriod` (ex: analisar 15 dias e comparar com 30 dias atras)
- Calculo do periodo comparativo: de `(analysisPeriod + comparePeriod)` dias atras ate `analysisPeriod` dias atras
- Quando o comparador esta desligado, os dados `prev*` nos `StudentRiskData` retornam `null` / `0`, evitando processamento desnecessario
- Nenhuma mudanca no banco de dados

### Arquivos afetados

| Arquivo | Acao |
|---|---|
| `src/hooks/useStudentTriage.tsx` | Tornar busca do periodo comparativo opcional via `comparePeriodDays` |
| `src/components/institution/StudentTriageTab.tsx` | Adicionar estados, Switch, segundo Select, banner de periodos, condicionar exibicao de deltas |
| `src/components/institution/TriageMetricsDashboard.tsx` | Receber `compareEnabled`, ocultar deltas quando desligado |

