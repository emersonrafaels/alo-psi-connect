import { useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import type { MoodEntry } from '@/hooks/useMoodEntries';
import type { EmotionConfig } from '@/hooks/useEmotionConfig';
import { parseISODateLocal } from '@/lib/utils';
import { getEmotionRaw, getScale, getEmotionColor } from '@/utils/moodSeriesBuilder';
import { getEmotionDisplayName } from '@/utils/emotionFormatters';

interface Props {
  entries: MoodEntry[];
  userConfigs: EmotionConfig[];
  metrics?: string[]; // emotion keys to show (defaults to mood/energy/anxiety if available)
}

const WEEKDAY_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export const WeekdayHeatmapCard = ({ entries, userConfigs, metrics }: Props) => {
  const enabled = userConfigs.filter((c) => c.is_enabled);

  const chosen = useMemo(() => {
    if (metrics && metrics.length) return metrics;
    const preferred = ['mood', 'energy', 'anxiety'];
    const found = preferred.filter((k) => enabled.some((c) => c.emotion_type === k));
    if (found.length >= 2) return found;
    return enabled.slice(0, 3).map((c) => c.emotion_type);
  }, [metrics, enabled]);

  const data = useMemo(() => {
    // For each weekday, compute per-metric average (normalized 0..1 for bar width)
    const rows = WEEKDAY_SHORT.map((label, wd) => {
      const dayEntries = entries.filter((e) => parseISODateLocal(e.date).getDay() === wd);
      const values: Record<string, { raw: number; norm: number } | null> = {};
      chosen.forEach((key) => {
        const nums = dayEntries
          .map((e) => getEmotionRaw(e, key))
          .filter((v): v is number => v !== null);
        if (nums.length === 0) {
          values[key] = null;
          return;
        }
        const raw = nums.reduce((a, b) => a + b, 0) / nums.length;
        const { min, max } = getScale(userConfigs, key);
        const norm = max === min ? 0.5 : (raw - min) / (max - min);
        values[key] = { raw, norm };
      });
      return { label, wd, values, count: dayEntries.length };
    });
    return rows;
  }, [entries, userConfigs, chosen]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Ritmo da semana</CardTitle>
        <CardDescription>Como cada dia da semana costuma se comportar.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {data.map((row) => (
            <div key={row.wd} className="flex items-center gap-3">
              <div className="w-10 shrink-0 text-xs font-medium text-muted-foreground">{row.label}</div>
              <div className="flex-1 space-y-1">
                {chosen.map((key) => {
                  const v = row.values[key];
                  const color = getEmotionColor(userConfigs, key);
                  const name = getEmotionDisplayName(key, userConfigs);
                  return (
                    <div key={key} className="flex items-center gap-2">
                      <div className="w-20 truncate text-[11px] text-muted-foreground">{name}</div>
                      <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                        {v && (
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${Math.max(4, v.norm * 100)}%`, backgroundColor: color }}
                          />
                        )}
                      </div>
                      <div className="w-10 text-right text-[11px] tabular-nums text-foreground/80">
                        {v ? v.raw.toFixed(1) : '—'}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="w-10 text-right text-[10px] text-muted-foreground">{row.count}d</div>
            </div>
          ))}
        </div>
        {entries.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-6">Sem dados suficientes.</p>
        )}
      </CardContent>
    </Card>
  );
};
