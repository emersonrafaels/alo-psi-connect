import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useMoodThemes, getCategoryMeta } from '@/hooks/useMoodThemes';
import { Tag } from 'lucide-react';

interface RecurringThemesProps {
  days?: number;
  limit?: number;
}

export function RecurringThemes({ days = 30, limit = 8 }: RecurringThemesProps) {
  const { data: themes = [], isLoading } = useMoodThemes(days);

  if (isLoading || themes.length === 0) return null;

  const top = themes.slice(0, limit);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Tag className="h-4 w-4" />
          Temas recorrentes
        </CardTitle>
        <CardDescription>
          O que apareceu com mais frequência nas suas reflexões dos últimos {days} dias.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {top.map((t) => {
            const meta = getCategoryMeta(t.category);
            const sentimentClass =
              t.dominant_sentiment === 'positivo'
                ? 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-200'
                : t.dominant_sentiment === 'negativo'
                  ? 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950 dark:text-amber-200'
                  : 'bg-muted text-muted-foreground border-border';
            return (
              <Badge key={t.theme} variant="outline" className={sentimentClass}>
                <span className="mr-1">{meta.emoji}</span>
                {t.theme}
                <span className="ml-1.5 text-[10px] opacity-70">×{t.count}</span>
              </Badge>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
