

## Mini-grafico com 4 faixas e seletor de metrica

### Resumo

Atualmente o sparkline mostra apenas o historico de humor com 3 cores. O plano e:

1. Adicionar historicos de ansiedade, energia e sono no hook de dados
2. Calcular um "score geral" (media ponderada das 4 metricas) como default
3. Criar um seletor de metrica no sparkline para o usuario alternar entre: Score Geral (default), Humor, Ansiedade, Energia e Sono
4. Atualizar as cores do sparkline para 4 faixas alinhadas com a classificacao de risco

---

### Detalhes tecnicos

#### 1. `src/hooks/useStudentTriage.tsx` - Adicionar historicos por metrica

**Interface `StudentRiskData`:** Adicionar campos:
- `anxietyHistory: number[]`
- `energyHistory: number[]`
- `sleepHistory: number[]`
- `scoreHistory: number[]` (score geral calculado por entrada)

**No queryFn:** Extrair os historicos da mesma forma que `moodHistory`:

```typescript
const anxietyHistory = entries
  .filter((e: any) => e.anxiety_level != null)
  .map((e: any) => e.anxiety_level as number);

const energyHistory = entries
  .filter((e: any) => e.energy_level != null)
  .map((e: any) => e.energy_level as number);

const sleepHistory = entries
  .filter((e: any) => e.sleep_quality != null || e.sleep_hours != null)
  .map((e: any) => {
    return e.sleep_quality ?? Math.min(5, Math.max(1, Math.round((e.sleep_hours - 3) / 1.5 + 1)));
  });

// Score geral: media das metricas disponiveis por entrada, com ansiedade invertida
const scoreHistory = entries.map((e: any) => {
  const vals: number[] = [];
  if (e.mood_score != null) vals.push(e.mood_score);
  if (e.anxiety_level != null) vals.push(6 - e.anxiety_level); // inverte
  if (e.energy_level != null) vals.push(e.energy_level);
  const sleep = e.sleep_quality ?? (e.sleep_hours != null
    ? Math.min(5, Math.max(1, Math.round((e.sleep_hours - 3) / 1.5 + 1)))
    : null);
  if (sleep != null) vals.push(sleep);
  return vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
}).filter((v): v is number => v !== null);
```

#### 2. `src/components/institution/StudentTriageTab.tsx` - Sparkline com seletor

**Renomear `MoodSparkline` para `MetricSparkline`** e adicionar props:

```typescript
type SparklineMetric = 'score' | 'mood' | 'anxiety' | 'energy' | 'sleep';

function MetricSparkline({ student }: { student: StudentRiskData }) {
  const [metric, setMetric] = useState<SparklineMetric>('score');

  const dataMap: Record<SparklineMetric, number[]> = {
    score: student.scoreHistory,
    mood: student.moodHistory,
    anxiety: student.anxietyHistory,
    energy: student.energyHistory,
    sleep: student.sleepHistory,
  };

  const data = dataMap[metric];
  // ... render sparkline with metric selector dropdown
}
```

**Seletor:** Um pequeno dropdown/botoes inline acima do sparkline para escolher a metrica. Opcoes:
- "Score" (default) - icone Activity
- "Humor" - icone Heart
- "Ansiedade" - icone Brain
- "Energia" - icone Zap
- "Sono" - icone Moon

**Cores com 4 faixas:** Cada ponto do sparkline usa a funcao `getMetricBand` ja existente para determinar a cor do segmento:

```typescript
// Para cada segmento entre dois pontos, usa a cor da faixa do ponto final
function getSparklineColor(value: number, metric: MetricType): string {
  const band = getMetricBand(value, metricTypeMap[metric]);
  return {
    critical: '#ef4444',   // vermelho
    alert: '#f97316',      // laranja
    attention: '#eab308',  // amarelo
    healthy: '#22c55e',    // verde
  }[band];
}
```

Para o "score" geral, os limiares serao os mesmos do humor (ja que o score e normalizado na mesma escala 1-5):
- Critico: score <= 1.5
- Alerta: score <= 2.5
- Atencao: score <= 3.0
- Saudavel: > 3.0

**Tooltip atualizado:** Mostra o nome da metrica selecionada na descricao.

#### 3. Renderizacao do sparkline com gradiente de cores

Em vez de uma unica cor para toda a linha, o sparkline sera desenhado segmento por segmento, onde cada segmento usa a cor da faixa do valor final daquele trecho. Isso cria um efeito visual onde a linha muda de cor conforme o aluno transita entre faixas.

```typescript
// Renderiza cada segmento com sua propria cor
{data.slice(1).map((val, i) => {
  const color = getSparklineColor(val, metric);
  return (
    <line
      key={i}
      x1={i * step} y1={yScale(data[i])}
      x2={(i+1) * step} y2={yScale(val)}
      stroke={color} strokeWidth="1.5"
      strokeLinecap="round"
    />
  );
})}
```

---

### Arquivos afetados

| Arquivo | Alteracao |
|---|---|
| `src/hooks/useStudentTriage.tsx` | Adicionar `anxietyHistory`, `energyHistory`, `sleepHistory`, `scoreHistory` na interface e no queryFn |
| `src/components/institution/StudentTriageTab.tsx` | Substituir `MoodSparkline` por `MetricSparkline` com seletor de metrica, cores em 4 faixas e gradiente por segmento |

