import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { ArrowDown, ArrowUp, Minus } from 'lucide-react';

interface EntryLike {
  date: string;
  mood_score?: number | null;
  energy_level?: number | null;
  anxiety_level?: number | null;
  sleep_hours?: number | null;
  sleep_quality?: number | null;
}

interface EntryComparisonCardProps {
  current: EntryLike;
  previous?: EntryLike | null;
}

const METRICS: Array<{ key: keyof EntryLike; label: string; higherIsBetter: boolean; suffix?: string }> = [
  { key: 'mood_score', label: 'Humor', higherIsBetter: true },
  { key: 'energy_level', label: 'Energia', higherIsBetter: true },
  { key: 'anxiety_level', label: 'Ansiedade', higherIsBetter: false },
  { key: 'sleep_hours', label: 'Horas de sono', higherIsBetter: true, suffix: 'h' },
  { key: 'sleep_quality', label: 'Qualidade do sono', higherIsBetter: true },
];

export function EntryComparisonCard({ current, previous }: EntryComparisonCardProps) {
  if (!previous) return null;

  const rows = METRICS.map((m) => {
    const cur = current[m.key] as number | null | undefined;
    const prev = previous[m.key] as number | null | undefined;
    if (cur == null || prev == null) return null;
    const delta = Number(cur) - Number(prev);
    const isStable = Math.abs(delta) < 0.25;
    const isPositive = isStable ? null : (delta > 0) === m.higherIsBetter;
    return { ...m, cur: Number(cur), prev: Number(prev), delta, isStable, isPositive };
  }).filter(Boolean) as any[];

  if (rows.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Comparado ao seu último registro</CardTitle>
        <CardDescription>Variação entre {previous.date} e {current.date}.</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="divide-y">
          {rows.map((r) => {
            const Icon = r.isStable ? Minus : r.delta > 0 ? ArrowUp : ArrowDown;
            const colorClass = r.isStable
              ? 'text-muted-foreground'
              : r.isPositive
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-amber-600 dark:text-amber-400';
            return (
              <li key={r.key} className="flex items-center justify-between py-2 text-sm">
                <span>{r.label}</span>
                <span className={`flex items-center gap-1.5 font-medium ${colorClass}`}>
                  <Icon className="h-3.5 w-3.5" />
                  {r.prev.toFixed(r.suffix === 'h' ? 1 : 0)}{r.suffix || ''} → {r.cur.toFixed(r.suffix === 'h' ? 1 : 0)}{r.suffix || ''}
                  <span className="text-xs opacity-70">
                    ({r.delta > 0 ? '+' : ''}{r.delta.toFixed(1)})
                  </span>
                </span>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
