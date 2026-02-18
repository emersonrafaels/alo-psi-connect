import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { TriageRecord } from '@/hooks/useStudentTriage';
import { ClipboardCheck, Clock, CheckCircle2, TrendingUp } from 'lucide-react';

interface TriageMetricsDashboardProps {
  triageRecords: TriageRecord[];
}

export function TriageMetricsDashboard({ triageRecords }: TriageMetricsDashboardProps) {
  const metrics = useMemo(() => {
    const now = new Date();
    const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const thisMonthRecords = triageRecords.filter(t => t.created_at.startsWith(thisMonth));
    const resolved = triageRecords.filter(t => t.status === 'resolved' && t.resolved_at);

    let avgResolutionDays: number | null = null;
    if (resolved.length > 0) {
      const totalDays = resolved.reduce((sum, t) => {
        const created = new Date(t.created_at).getTime();
        const resolvedAt = new Date(t.resolved_at!).getTime();
        return sum + (resolvedAt - created) / (1000 * 60 * 60 * 24);
      }, 0);
      avgResolutionDays = Math.round(totalDays / resolved.length * 10) / 10;
    }

    const resolutionRate = triageRecords.length > 0
      ? Math.round(resolved.length / triageRecords.length * 100)
      : 0;

    const weeklyData: number[] = [];
    for (let i = 7; i >= 0; i--) {
      const weekStart = new Date(now);
      weekStart.setDate(weekStart.getDate() - (i * 7 + 6));
      weekStart.setHours(0, 0, 0, 0);
      const weekEnd = new Date(now);
      weekEnd.setDate(weekEnd.getDate() - i * 7);
      weekEnd.setHours(23, 59, 59, 999);
      const count = triageRecords.filter(t => {
        const d = new Date(t.created_at);
        return d >= weekStart && d <= weekEnd;
      }).length;
      weeklyData.push(count);
    }

    return { thisMonthCount: thisMonthRecords.length, avgResolutionDays, resolutionRate, weeklyData };
  }, [triageRecords]);

  if (triageRecords.length === 0) return null;

  const sparkWidth = 80;
  const sparkHeight = 24;
  const maxVal = Math.max(...metrics.weeklyData, 1);
  const sparkPoints = metrics.weeklyData.map((v, i) =>
    `${(i / Math.max(metrics.weeklyData.length - 1, 1)) * sparkWidth},${sparkHeight - (v / maxVal) * sparkHeight}`
  ).join(' ');

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <Card className="bg-muted/30">
        <CardContent className="p-3 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
            <ClipboardCheck className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p className="text-lg font-bold">{metrics.thisMonthCount}</p>
            <p className="text-[11px] text-muted-foreground">Triagens este mês</p>
          </div>
        </CardContent>
      </Card>
      <Card className="bg-muted/30">
        <CardContent className="p-3 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
            <Clock className="h-4 w-4 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <p className="text-lg font-bold">{metrics.avgResolutionDays != null ? `${metrics.avgResolutionDays}d` : '—'}</p>
            <p className="text-[11px] text-muted-foreground">Tempo médio resolução</p>
          </div>
        </CardContent>
      </Card>
      <Card className="bg-muted/30">
        <CardContent className="p-3 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
            <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <p className="text-lg font-bold">{metrics.resolutionRate}%</p>
            <p className="text-[11px] text-muted-foreground">Taxa de resolução</p>
          </div>
        </CardContent>
      </Card>
      <Card className="bg-muted/30">
        <CardContent className="p-3 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/30">
            <TrendingUp className="h-4 w-4 text-orange-600 dark:text-orange-400" />
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground mb-1">Triagens/semana</p>
            <svg width={sparkWidth} height={sparkHeight}>
              <polyline points={sparkPoints} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-orange-500" />
            </svg>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
