import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowUpRight, ArrowDownRight, Minus, Plus, Check } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import type { MoodEntry } from '@/hooks/useMoodEntries';
import type { EmotionConfig } from '@/hooks/useEmotionConfig';
import {
  filterEntriesByDays,
  getEmotionColor,
  getEmotionRaw,
  INVERTED_EMOTIONS,
} from '@/utils/moodSeriesBuilder';

interface Props {
  entries: MoodEntry[];
  configs: EmotionConfig[];
  days: number;
  selected: string[];
  onToggle: (key: string) => void;
}

export const EmotionRankingCard = ({ entries, configs, days, selected, onToggle }: Props) => {
  const rows = useMemo(() => {
    const current = filterEntriesByDays(entries, days);
    const previous = entries.filter((e) => {
      const d = new Date(e.date);
      const since = new Date();
      since.setDate(since.getDate() - days * 2);
      const upto = new Date();
      upto.setDate(upto.getDate() - days);
      return d >= since && d < upto;
    });

    return configs
      .filter((c) => c.is_enabled)
      .map((c) => {
        const cur = current.map((e) => getEmotionRaw(e, c.emotion_type)).filter((v): v is number => v !== null);
        const prev = previous.map((e) => getEmotionRaw(e, c.emotion_type)).filter((v): v is number => v !== null);
        const avg = cur.length ? cur.reduce((a, b) => a + b, 0) / cur.length : null;
        const prevAvg = prev.length ? prev.reduce((a, b) => a + b, 0) / prev.length : null;
        const delta = avg !== null && prevAvg !== null ? avg - prevAvg : null;
        const sparkData = cur.slice(-12).map((v, i) => ({ i, v }));
        return {
          key: c.emotion_type,
          label: c.display_name,
          avg,
          delta,
          count: cur.length,
          inverted: INVERTED_EMOTIONS.has(c.emotion_type),
          sparkData,
          color: getEmotionColor(configs, c.emotion_type),
          scaleMax: c.scale_max,
        };
      })
      .sort((a, b) => (b.avg ?? 0) - (a.avg ?? 0));
  }, [entries, configs, days]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Suas emoções no período</CardTitle>
        <CardDescription>Médias dos últimos {days} dias e variação vs. período anterior.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {rows.length === 0 && (
          <div className="text-sm text-muted-foreground py-4">Nenhuma emoção configurada.</div>
        )}
        {rows.map((row) => {
          const isSelected = selected.includes(row.key);
          let TrendIcon = Minus;
          let trendClass = 'text-muted-foreground';
          if (row.delta !== null && Math.abs(row.delta) >= 0.15) {
            const positive = row.inverted ? row.delta < 0 : row.delta > 0;
            TrendIcon = row.delta > 0 ? ArrowUpRight : ArrowDownRight;
            trendClass = positive ? 'text-emerald-600' : 'text-red-600';
          }
          return (
            <div
              key={row.key}
              className="flex items-center gap-3 rounded-md border bg-card px-3 py-2"
            >
              <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: row.color }} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm truncate">{row.label}</span>
                  <span className="text-xs text-muted-foreground">({row.count} reg.)</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  Média: {row.avg !== null ? `${row.avg.toFixed(1)}/${row.scaleMax}` : 'N/A'}
                </div>
              </div>
              <div className="w-24 h-8 hidden sm:block">
                {row.sparkData.length > 1 && (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={row.sparkData}>
                      <Line type="monotone" dataKey="v" stroke={row.color} strokeWidth={2} dot={false} isAnimationActive={false} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
              <div className={`flex items-center gap-1 text-xs font-medium ${trendClass}`}>
                <TrendIcon className="h-3.5 w-3.5" />
                {row.delta !== null ? `${row.delta > 0 ? '+' : ''}${row.delta.toFixed(1)}` : '—'}
              </div>
              <Button
                size="sm"
                variant={isSelected ? 'secondary' : 'outline'}
                className="h-7 px-2"
                onClick={() => onToggle(row.key)}
              >
                {isSelected ? <Check className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
              </Button>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};
