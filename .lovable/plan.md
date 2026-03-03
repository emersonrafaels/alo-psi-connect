

## Adicionar grafico de contagem diaria de diarios emocionais

### Alteracao

**Arquivo:** `src/components/institution/InstitutionWellbeingDashboard.tsx`

Adicionar um novo `Card` com um grafico de barras (`BarChart` do recharts) mostrando a contagem de diarios emocionais por dia, usando o campo `entries_count` ja disponivel em `metrics.daily_entries`.

O grafico sera inserido entre a secao "Visao Geral" (linha 317) e a secao "Metricas de Bem-Estar" (linha 319), com:

- Titulo: "Diários Emocionais por Dia"
- Descricao: "Quantidade de registros diários no período"
- Grafico de barras com eixo X = data formatada (dd/MM), eixo Y = contagem
- Usando `ChartContainer` + `BarChart` + `Bar` do recharts (mesmo padrao do `UsageChart`)
- Cor primaria para as barras
- Tooltip com contagem

### Dados

Os dados ja existem em `metrics.daily_entries` com a estrutura:
```typescript
{ date: string, entries_count: number, avg_mood, avg_anxiety, ... }
```

Basta mapear para o formato do grafico:
```typescript
const dailyCountData = metrics.daily_entries.map(e => ({
  date: new Date(e.date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
  count: e.entries_count
}));
```

### Escopo
- 1 arquivo editado: `src/components/institution/InstitutionWellbeingDashboard.tsx`
- Imports adicionais: `ChartContainer, ChartTooltip, ChartTooltipContent` de `@/components/ui/chart`, `BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer` de `recharts`

