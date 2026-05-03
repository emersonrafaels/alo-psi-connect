import { useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import type { MoodEntry } from '@/hooks/useMoodEntries';
import { parseISODateLocal } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface Props {
  entries: MoodEntry[];
  days: number;
}

function moodToColor(score: number | null): string {
  if (score === null) return 'hsl(var(--muted))';
  // 1..5 → red→amber→green
  const t = Math.max(0, Math.min(1, (score - 1) / 4));
  const hue = 0 + t * 130; // 0=red, 130=green
  return `hsl(${hue} 70% 50%)`;
}

export const ConsistencyCalendar = ({ entries, days }: Props) => {
  const { cells, recordedDays, streak } = useMemo(() => {
    const map = new Map<string, MoodEntry>();
    entries.forEach((e) => map.set(e.date, e));

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const start = new Date(today);
    start.setDate(today.getDate() - (days - 1));

    // Pad to start of week (Sunday)
    const firstWeekday = start.getDay();
    const gridStart = new Date(start);
    gridStart.setDate(start.getDate() - firstWeekday);

    const totalCells = Math.ceil(((today.getTime() - gridStart.getTime()) / 86400000 + 1) / 7) * 7;
    const cells: Array<{ date: Date | null; iso: string | null; entry: MoodEntry | null; inRange: boolean }> = [];
    for (let i = 0; i < totalCells; i++) {
      const d = new Date(gridStart);
      d.setDate(gridStart.getDate() + i);
      const inRange = d >= start && d <= today;
      const iso = d.toISOString().slice(0, 10);
      cells.push({
        date: d,
        iso,
        entry: map.get(iso) || null,
        inRange,
      });
    }

    const recordedDays = new Set(
      entries.filter((e) => {
        const d = parseISODateLocal(e.date);
        return d >= start && d <= today;
      }).map((e) => e.date)
    ).size;

    // current streak (count back from today)
    let streak = 0;
    for (let i = 0; i < days; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const iso = d.toISOString().slice(0, 10);
      if (map.has(iso)) streak++;
      else break;
    }

    return { cells, recordedDays, streak };
  }, [entries, days]);

  const rate = Math.round((recordedDays / days) * 100);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Consistência</CardTitle>
        <CardDescription>Cada quadrado é um dia. A cor reflete o seu humor.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4 mb-3 text-xs text-muted-foreground">
          <span><strong className="text-foreground">{recordedDays}</strong>/{days} dias ({rate}%)</span>
          <span>Sequência atual: <strong className="text-foreground">{streak}</strong></span>
        </div>
        <TooltipProvider delayDuration={150}>
          <div className="grid grid-cols-7 gap-1">
            {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((l, i) => (
              <div key={i} className="text-[10px] text-muted-foreground text-center">{l}</div>
            ))}
            {cells.map((c, i) => {
              const score = c.entry?.mood_score ?? null;
              const bg = c.inRange ? moodToColor(score) : 'transparent';
              return (
                <Tooltip key={i}>
                  <TooltipTrigger asChild>
                    <div
                      className="aspect-square rounded-sm border border-border/40"
                      style={{
                        backgroundColor: bg,
                        opacity: c.inRange ? (c.entry ? 1 : 0.35) : 0,
                      }}
                    />
                  </TooltipTrigger>
                  {c.inRange && (
                    <TooltipContent>
                      <div className="text-xs">
                        <div className="font-medium">
                          {c.date!.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                        </div>
                        {c.entry ? (
                          <>
                            {typeof c.entry.mood_score === 'number' && <div>Humor: {c.entry.mood_score}</div>}
                            {typeof c.entry.anxiety_level === 'number' && <div>Ansiedade: {c.entry.anxiety_level}</div>}
                            {typeof c.entry.energy_level === 'number' && <div>Energia: {c.entry.energy_level}</div>}
                          </>
                        ) : (
                          <div className="text-muted-foreground">Sem registro</div>
                        )}
                      </div>
                    </TooltipContent>
                  )}
                </Tooltip>
              );
            })}
          </div>
        </TooltipProvider>
      </CardContent>
    </Card>
  );
};
