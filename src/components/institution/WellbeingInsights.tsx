import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Lightbulb } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WellbeingInsight {
  type: 'positive' | 'warning' | 'info';
  icon: string;
  title: string;
  description: string;
}

interface WellbeingInsightsProps {
  insights: WellbeingInsight[];
}

export const WellbeingInsights = ({ insights }: WellbeingInsightsProps) => {
  if (insights.length === 0) {
    return null;
  }

  const getInsightStyles = (type: 'positive' | 'warning' | 'info') => {
    switch (type) {
      case 'positive':
        return 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800';
      case 'warning':
        return 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800';
      case 'info':
        return 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800';
    }
  };

  const getTitleColor = (type: 'positive' | 'warning' | 'info') => {
    switch (type) {
      case 'positive':
        return 'text-emerald-700 dark:text-emerald-300';
      case 'warning':
        return 'text-amber-700 dark:text-amber-300';
      case 'info':
        return 'text-blue-700 dark:text-blue-300';
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-primary/10">
            <Lightbulb className="h-4 w-4 text-primary" />
          </div>
          Insights Inteligentes
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {insights.map((insight, index) => (
            <div
              key={index}
              className={cn(
                'p-4 rounded-xl border transition-all hover:scale-[1.02]',
                getInsightStyles(insight.type)
              )}
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl" role="img" aria-label={insight.title}>
                  {insight.icon}
                </span>
                <div className="flex-1 min-w-0">
                  <h4 className={cn('font-semibold text-sm mb-1', getTitleColor(insight.type))}>
                    {insight.title}
                  </h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {insight.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
