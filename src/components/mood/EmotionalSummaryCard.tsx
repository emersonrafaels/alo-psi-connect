import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Heart, TrendingUp, TrendingDown, Activity, Sparkles } from 'lucide-react';
import type { MoodEntry } from '@/hooks/useMoodEntries';
import { computeTrend, type TrendDirection } from '@/utils/moodInsightHelpers';
import { getEmotionDisplayName } from '@/utils/emotionFormatters';

interface EmotionalSummaryCardProps {
  entries: MoodEntry[];
  userConfigs?: Array<{ emotion_type: string; display_name?: string }>;
  daysWindow?: number;
}

interface MetricSummary {
  key: string;
  label: string;
  trend: TrendDirection;
  current: number;
  higherIsBetter: boolean;
}

const TREND_LABEL: Record<TrendDirection, string> = {
  improving: 'em melhora',
  worsening: 'em queda',
  stable: 'estável',
  oscillating: 'oscilando',
  insufficient_data: 'sem dados suficientes',
};

const STATUS_DOT: Record<TrendDirection, string> = {
  improving: 'bg-emerald-500',
  worsening: 'bg-red-500',
  stable: 'bg-blue-500',
  oscillating: 'bg-amber-500',
  insufficient_data: 'bg-muted',
};

function getEmotionValue(entry: MoodEntry, key: string, legacy?: keyof MoodEntry): number | null {
  if (entry.emotion_values && typeof entry.emotion_values === 'object') {
    const v = (entry.emotion_values as Record<string, any>)[key];
    if (v !== undefined && v !== null && Number.isFinite(Number(v))) return Number(v);
  }
  if (legacy && entry[legacy] !== undefined && entry[legacy] !== null) {
    return Number(entry[legacy]);
  }
  return null;
}

export const EmotionalSummaryCard = ({ entries, userConfigs = [], daysWindow = 14 }: EmotionalSummaryCardProps) => {
  const summary = useMemo(() => {
    if (!entries || entries.length === 0) return null;

    // Pega últimas N entradas por data
    const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - daysWindow);
    const cutoffISO = cutoff.toISOString().slice(0, 10);
    const recent = sorted.filter((e) => e.date >= cutoffISO);
    const series = recent.length >= 4 ? recent : sorted.slice(-Math.max(recent.length, 7));

    if (series.length === 0) return null;

    const metrics: MetricSummary[] = [
      { key: 'mood', label: 'Humor', higherIsBetter: true, trend: 'insufficient_data', current: 0 },
      { key: 'energy', label: 'Energia', higherIsBetter: true, trend: 'insufficient_data', current: 0 },
      { key: 'anxiety', label: 'Ansiedade', higherIsBetter: false, trend: 'insufficient_data', current: 0 },
      { key: 'sleep_quality', label: 'Qualidade do sono', higherIsBetter: true, trend: 'insufficient_data', current: 0 },
    ];

    const legacyMap: Record<string, keyof MoodEntry> = {
      mood: 'mood_score',
      energy: 'energy_level',
      anxiety: 'anxiety_level',
      sleep_quality: 'sleep_quality',
    };

    metrics.forEach((m) => {
      const values = series.map((e) => getEmotionValue(e, m.key, legacyMap[m.key]));
      const trendRes = computeTrend(values, m.higherIsBetter);
      m.trend = trendRes.direction;
      m.current = trendRes.current;
    });

    // Emoções complementares (do emotion_values)
    const compAgg: Record<string, { sum: number; count: number }> = {};
    series.forEach((e) => {
      if (!e.emotion_values || typeof e.emotion_values !== 'object') return;
      Object.entries(e.emotion_values as Record<string, any>).forEach(([k, v]) => {
        if (['mood', 'energy', 'anxiety', 'sleep_quality', 'sleep_hours'].includes(k)) return;
        const num = Number(v);
        if (!Number.isFinite(num)) return;
        if (!compAgg[k]) compAgg[k] = { sum: 0, count: 0 };
        compAgg[k].sum += num;
        compAgg[k].count += 1;
      });
    });

    const compAvgs = Object.entries(compAgg)
      .map(([key, { sum, count }]) => ({ key, avg: sum / count, name: getEmotionDisplayName(key, userConfigs) }))
      .filter((c) => Number.isFinite(c.avg));

    const topPositive = [...compAvgs].sort((a, b) => b.avg - a.avg).slice(0, 2);
    const topLow = [...compAvgs].sort((a, b) => a.avg - b.avg).slice(0, 2);

    // Status geral
    const worseningCount = metrics.filter((m) => m.trend === 'worsening').length;
    const improvingCount = metrics.filter((m) => m.trend === 'improving').length;
    let overall: 'positive' | 'attention' | 'mixed' | 'stable' = 'stable';
    if (worseningCount >= 2) overall = 'attention';
    else if (improvingCount >= 2 && worseningCount === 0) overall = 'positive';
    else if (worseningCount >= 1 && improvingCount >= 1) overall = 'mixed';

    return { metrics, topPositive, topLow, overall, count: series.length };
  }, [entries, userConfigs, daysWindow]);

  if (!summary) return null;

  const { metrics, topPositive, topLow, overall, count } = summary;

  const overallText: Record<typeof overall, { label: string; tone: string; icon: JSX.Element }> = {
    positive: { label: 'Tendência positiva', tone: 'text-emerald-700 dark:text-emerald-400', icon: <TrendingUp className="h-4 w-4" /> },
    attention: { label: 'Pontos de atenção', tone: 'text-amber-700 dark:text-amber-400', icon: <TrendingDown className="h-4 w-4" /> },
    mixed: { label: 'Estável com pontos de atenção', tone: 'text-blue-700 dark:text-blue-400', icon: <Activity className="h-4 w-4" /> },
    stable: { label: 'Estável', tone: 'text-blue-700 dark:text-blue-400', icon: <Activity className="h-4 w-4" /> },
  };

  // Pontos positivos/atenção como bullets
  const positives: string[] = [];
  const attentions: string[] = [];
  metrics.forEach((m) => {
    if (m.trend === 'improving') positives.push(`${m.label} em melhora`);
    if (m.trend === 'worsening') attentions.push(`${m.label} merece atenção`);
    if (m.trend === 'oscillating') attentions.push(`${m.label} tem oscilado`);
  });
  topPositive.forEach((c) => {
    if (c.avg >= 3.5) positives.push(`${c.name} em níveis altos`);
  });
  topLow.forEach((c) => {
    if (c.avg <= 2.5) attentions.push(`${c.name} em níveis baixos`);
  });

  const suggestion =
    overall === 'attention'
      ? 'Que tal um momento de pausa hoje e observar o que tem pesado nos últimos dias?'
      : overall === 'positive'
        ? 'Continue cuidando do que está funcionando. Pequenas constâncias fazem diferença.'
        : 'Registrar com regularidade ajuda a tornar os padrões mais claros ao longo do tempo.';

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Heart className="h-5 w-5 text-primary" />
            Como você tem estado?
          </CardTitle>
          <Badge variant="outline" className={`${overallText[overall].tone} flex items-center gap-1`}>
            {overallText[overall].icon}
            {overallText[overall].label}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">Baseado em {count} registro{count !== 1 ? 's' : ''} recente{count !== 1 ? 's' : ''}.</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Indicadores rápidos */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {metrics.map((m) => (
            <div key={m.key} className="flex items-center gap-2 rounded-md border bg-card px-2.5 py-2">
              <span className={`inline-block h-2 w-2 rounded-full ${STATUS_DOT[m.trend]}`} />
              <div className="text-xs">
                <div className="font-medium">{m.label}</div>
                <div className="text-muted-foreground">{TREND_LABEL[m.trend]}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Bullets */}
        <div className="grid gap-2 text-sm">
          {positives.slice(0, 3).map((p, i) => (
            <div key={`pos-${i}`} className="flex gap-2"><span aria-hidden>✅</span><span>{p}</span></div>
          ))}
          {attentions.slice(0, 3).map((a, i) => (
            <div key={`att-${i}`} className="flex gap-2"><span aria-hidden>⚠️</span><span>{a}</span></div>
          ))}
          <div className="flex gap-2 text-muted-foreground">
            <Sparkles className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            <span>{suggestion}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
