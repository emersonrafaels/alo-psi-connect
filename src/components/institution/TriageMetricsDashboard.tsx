import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { TriageRecord } from '@/hooks/useStudentTriage';
import { ClipboardCheck, Clock, CheckCircle2, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface TriageMetricsDashboardProps {
  triageRecords: TriageRecord[];
  periodDays?: number;
}

function DeltaIndicator({ current, previous, invertBetter }: { current: number; previous: number; invertBetter?: boolean }) {
  const delta = current - previous;
  if (delta === 0) return <span className="text-[10px] text-muted-foreground ml-1">(=)</span>;
  const isPositive = delta > 0;
  const isBetter = invertBetter ? !isPositive : isPositive;
  return (
    <span className={`text-[10px] ml-1 inline-flex items-center gap-0.5 ${isBetter ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
      {isPositive ? '+' : ''}{delta}
    </span>
  );
}

export function TriageMetricsDashboard({ triageRecords, periodDays = 15 }: TriageMetricsDashboardProps) {
  const metrics = useMemo(() => {
    const now = new Date();

    // Current period
    const currentStart = new Date(now);
    currentStart.setDate(currentStart.getDate() - periodDays);
    currentStart.setHours(0, 0, 0, 0);

    // Previous period
    const prevStart = new Date(now);
    prevStart.setDate(prevStart.getDate() - periodDays * 2);
    prevStart.setHours(0, 0, 0, 0);

    const currentRecords = triageRecords.filter(t => new Date(t.created_at) >= currentStart);
    const prevRecords = triageRecords.filter(t => {
      const d = new Date(t.created_at);
      return d >= prevStart && d < currentStart;
    });

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

    return {
      currentCount: currentRecords.length,
      prevCount: prevRecords.length,
      avgResolutionDays,
      resolutionRate,
      weeklyData,
    };
  }, [triageRecords, periodDays]);

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
            <p className="text-lg font-bold">
              {metrics.currentCount}
              <DeltaIndicator current={metrics.currentCount} previous={metrics.prevCount} />
            </p>
            <p className="text-[11px] text-muted-foreground">Triagens ({periodDays}d)</p>
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
