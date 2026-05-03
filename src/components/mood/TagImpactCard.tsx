import { useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { TrendingUp, TrendingDown } from 'lucide-react';
import type { MoodEntry } from '@/hooks/useMoodEntries';

interface Props {
  entries: MoodEntry[];
}

interface TagImpact {
  tag: string;
  count: number;
  avgWith: number;
  avgWithout: number;
  delta: number;
}

export const TagImpactCard = ({ entries }: Props) => {
  const impacts = useMemo<TagImpact[]>(() => {
    const allMood = entries
      .map((e) => e.mood_score)
      .filter((v): v is number => typeof v === 'number');
    if (allMood.length < 5) return [];
    const overallAvg = allMood.reduce((a, b) => a + b, 0) / allMood.length;

    const tagMap = new Map<string, { withTag: number[]; withoutTag: number[] }>();
    entries.forEach((e) => {
      if (typeof e.mood_score !== 'number') return;
      const tags: string[] = (e.tags as string[] | null | undefined) ?? [];
      const set = new Set(tags.map((t) => t.toLowerCase().trim()).filter(Boolean));
      // Build tag list from this entry first, then for every observed tag we'll add to without
      set.forEach((t) => {
        if (!tagMap.has(t)) tagMap.set(t, { withTag: [], withoutTag: [] });
        tagMap.get(t)!.withTag.push(e.mood_score!);
      });
    });

    // Now fill withoutTag by passing through every entry
    entries.forEach((e) => {
      if (typeof e.mood_score !== 'number') return;
      const tags: string[] = (e.tags as string[] | null | undefined) ?? [];
      const set = new Set(tags.map((t) => t.toLowerCase().trim()).filter(Boolean));
      tagMap.forEach((bucket, key) => {
        if (!set.has(key)) bucket.withoutTag.push(e.mood_score!);
      });
    });

    const out: TagImpact[] = [];
    tagMap.forEach((bucket, tag) => {
      if (bucket.withTag.length < 3) return;
      const avgWith = bucket.withTag.reduce((a, b) => a + b, 0) / bucket.withTag.length;
      const baseline = bucket.withoutTag.length > 0
        ? bucket.withoutTag.reduce((a, b) => a + b, 0) / bucket.withoutTag.length
        : overallAvg;
      const delta = avgWith - baseline;
      if (Math.abs(delta) < 0.2) return;
      out.push({ tag, count: bucket.withTag.length, avgWith, avgWithout: baseline, delta });
    });

    return out.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta)).slice(0, 8);
  }, [entries]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">O que parece ajudar ou pesar</CardTitle>
        <CardDescription>Como o humor varia conforme as tags que você marca.</CardDescription>
      </CardHeader>
      <CardContent>
        {impacts.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            Marque tags nos registros para descobrir padrões. Precisa de pelo menos 3 ocorrências da mesma tag.
          </p>
        ) : (
          <ul className="space-y-2">
            {impacts.map((imp) => {
              const positive = imp.delta > 0;
              return (
                <li
                  key={imp.tag}
                  className="flex items-center justify-between gap-3 rounded-lg border bg-card px-3 py-2"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {positive ? (
                      <TrendingUp className="h-4 w-4 text-emerald-500 shrink-0" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-500 shrink-0" />
                    )}
                    <span className="font-medium truncate capitalize">{imp.tag}</span>
                    <span className="text-xs text-muted-foreground">({imp.count}x)</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs tabular-nums shrink-0">
                    <span className="text-muted-foreground">humor {imp.avgWith.toFixed(1)}</span>
                    <span
                      className={`font-semibold ${positive ? 'text-emerald-600' : 'text-red-600'}`}
                    >
                      {positive ? '+' : ''}
                      {imp.delta.toFixed(1)}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
};
