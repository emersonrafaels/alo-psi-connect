import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { MoodEntry } from '@/hooks/useMoodEntries';
import type { EmotionConfig } from '@/hooks/useEmotionConfig';
import { computeCorrelations, describeCorrelation, INVERTED_EMOTIONS } from '@/utils/moodSeriesBuilder';

interface Props {
  entries: MoodEntry[];
  configs: EmotionConfig[];
  selected: string[];
}

function colorFor(r: number | null): string {
  if (r === null) return 'hsl(var(--muted))';
  // diverging: red (-1) -> neutral (0) -> green (+1)
  const abs = Math.min(1, Math.abs(r));
  const alpha = 0.15 + abs * 0.55;
  if (r >= 0) return `hsl(142 70% 45% / ${alpha})`;
  return `hsl(0 75% 55% / ${alpha})`;
}

export const EmotionCorrelationMatrix = ({ entries, configs, selected }: Props) => {
  const { matrix, counts, labels } = useMemo(() => {
    const labels: Record<string, string> = {};
    selected.forEach((k) => {
      labels[k] = configs.find((c) => c.emotion_type === k)?.display_name ?? k;
    });
    const { matrix, counts } = computeCorrelations(entries, configs, selected);
    return { matrix, counts, labels };
  }, [entries, configs, selected]);

  if (selected.length < 2) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Correlação entre emoções</CardTitle>
          <CardDescription>Selecione ao menos 2 emoções acima.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // Generate plain-language insights from strongest correlations
  const insights: string[] = [];
  const seen = new Set<string>();
  const pairs: { a: string; b: string; r: number }[] = [];
  selected.forEach((a) => {
    selected.forEach((b) => {
      if (a === b) return;
      const k = [a, b].sort().join('|');
      if (seen.has(k)) return;
      seen.add(k);
      const r = matrix[a]?.[b];
      if (r !== null && r !== undefined && counts[a][b] >= 5) pairs.push({ a, b, r });
    });
  });
  pairs.sort((x, y) => Math.abs(y.r) - Math.abs(x.r));
  pairs.slice(0, 3).forEach(({ a, b, r }) => {
    if (Math.abs(r) < 0.3) return;
    const aLow = INVERTED_EMOTIONS.has(a);
    const bLow = INVERTED_EMOTIONS.has(b);
    const positive = r > 0;
    const verb = positive ? 'tende a aumentar junto com' : 'tende a diminuir quando aumenta';
    insights.push(
      `Quando ${labels[a]} ${aLow ? 'sobe' : 'sobe'}, ${labels[b]} ${verb} ${
        positive ? '' : ''
      } (${r.toFixed(2)}).`
    );
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Correlação entre emoções</CardTitle>
        <CardDescription>
          Quanto mais intensa a cor, mais forte a relação. Verde = sobem juntas, vermelho = uma sobe quando a outra desce.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="overflow-x-auto">
          <TooltipProvider delayDuration={150}>
            <table className="text-xs border-separate border-spacing-1">
              <thead>
                <tr>
                  <th />
                  {selected.map((k) => (
                    <th key={k} className="px-2 py-1 font-medium text-muted-foreground text-left whitespace-nowrap">
                      {labels[k]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {selected.map((row) => (
                  <tr key={row}>
                    <td className="px-2 py-1 font-medium text-muted-foreground whitespace-nowrap">{labels[row]}</td>
                    {selected.map((col) => {
                      const r = matrix[row]?.[col] ?? null;
                      const n = counts[row][col];
                      const insufficient = n < 5 && row !== col;
                      return (
                        <td key={col}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div
                                className="h-10 w-14 rounded-md flex items-center justify-center font-mono"
                                style={{ backgroundColor: insufficient ? 'hsl(var(--muted))' : colorFor(r) }}
                              >
                                {row === col ? '—' : insufficient ? '·' : r === null ? '·' : r.toFixed(2)}
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <div className="text-xs">
                                <div className="font-medium">{labels[row]} × {labels[col]}</div>
                                <div className="text-muted-foreground">{describeCorrelation(r)}</div>
                                <div className="text-muted-foreground">Baseado em {n} dias com ambos registros</div>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </TooltipProvider>
        </div>
        {insights.length > 0 && (
          <div className="space-y-1.5 rounded-lg bg-muted/40 p-3 text-sm">
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Padrões detectados</div>
            {insights.map((t, i) => (
              <div key={i} className="text-foreground/90">• {t}</div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
