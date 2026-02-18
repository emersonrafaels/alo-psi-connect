import { useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TriageRecord } from '@/hooks/useStudentTriage';
import { ClipboardCheck, Clock, CheckCircle2, TrendingUp, Maximize2 } from 'lucide-react';
import { ComparisonTooltip } from './ComparisonTooltip';
import { DetailModal } from './DetailModal';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface TriageMetricsDashboardProps {
  triageRecords: TriageRecord[];
  periodDays?: number;
  compareEnabled?: boolean;
}

function DeltaIndicator({ current, previous, invertBetter, label, periodLabel }: { current: number; previous: number; invertBetter?: boolean; label?: string; periodLabel?: string }) {
  const delta = current - previous;
  if (delta === 0) return <span className="text-[10px] text-muted-foreground ml-1">(=)</span>;
  const isPositive = delta > 0;
  const isBetter = invertBetter ? !isPositive : isPositive;
  return (
    <ComparisonTooltip
      currentValue={current}
      previousValue={previous}
      label={label || 'Comparativo'}
      periodLabel={periodLabel}
      invertBetter={invertBetter}
      format={(v) => String(Math.round(v * 10) / 10)}
    >
      <span className={`text-[10px] ml-1 inline-flex items-center gap-0.5 cursor-help ${isBetter ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
        {isPositive ? '+' : ''}{delta}
      </span>
    </ComparisonTooltip>
  );
}

export function TriageMetricsDashboard({ triageRecords, periodDays = 15, compareEnabled = false }: TriageMetricsDashboardProps) {
  const [detailModal, setDetailModal] = useState<'triages' | 'resolution' | 'rate' | 'weekly' | null>(null);

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

    const weeklyData: { start: Date; end: Date; count: number }[] = [];
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
      weeklyData.push({ start: weekStart, end: weekEnd, count });
    }

    // Status breakdown for current period
    const statusBreakdown = {
      pending: currentRecords.filter(t => t.status === 'pending' || t.status === 'triaged').length,
      in_progress: currentRecords.filter(t => t.status === 'in_progress').length,
      resolved: currentRecords.filter(t => t.status === 'resolved').length,
    };

    return {
      currentCount: currentRecords.length,
      prevCount: prevRecords.length,
      avgResolutionDays,
      resolutionRate,
      weeklyData,
      statusBreakdown,
      resolved,
    };
  }, [triageRecords, periodDays]);

  if (triageRecords.length === 0) return null;

  const sparkWidth = 80;
  const sparkHeight = 24;
  const weeklyValues = metrics.weeklyData.map(w => w.count);
  const maxVal = Math.max(...weeklyValues, 1);
  const sparkPoints = weeklyValues.map((v, i) =>
    `${(i / Math.max(weeklyValues.length - 1, 1)) * sparkWidth},${sparkHeight - (v / maxVal) * sparkHeight}`
  ).join(' ');

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="bg-muted/30 relative group/card">
          <button
            type="button"
            className="absolute top-2 right-2 p-1 rounded-md opacity-0 group-hover/card:opacity-60 hover:!opacity-100 transition-opacity z-10 bg-background/50"
            onClick={() => setDetailModal('triages')}
            title="Ver detalhes"
          >
            <Maximize2 className="h-3.5 w-3.5" />
          </button>
          <CardContent className="p-3 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <ClipboardCheck className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-lg font-bold">
                {metrics.currentCount}
                {compareEnabled && <DeltaIndicator current={metrics.currentCount} previous={metrics.prevCount} label="Triagens no período" />}
              </p>
              <p className="text-[11px] text-muted-foreground">Triagens ({periodDays}d)</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-muted/30 relative group/card">
          <button
            type="button"
            className="absolute top-2 right-2 p-1 rounded-md opacity-0 group-hover/card:opacity-60 hover:!opacity-100 transition-opacity z-10 bg-background/50"
            onClick={() => setDetailModal('resolution')}
            title="Ver detalhes"
          >
            <Maximize2 className="h-3.5 w-3.5" />
          </button>
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
        <Card className="bg-muted/30 relative group/card">
          <button
            type="button"
            className="absolute top-2 right-2 p-1 rounded-md opacity-0 group-hover/card:opacity-60 hover:!opacity-100 transition-opacity z-10 bg-background/50"
            onClick={() => setDetailModal('rate')}
            title="Ver detalhes"
          >
            <Maximize2 className="h-3.5 w-3.5" />
          </button>
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
        <Card className="bg-muted/30 relative group/card">
          <button
            type="button"
            className="absolute top-2 right-2 p-1 rounded-md opacity-0 group-hover/card:opacity-60 hover:!opacity-100 transition-opacity z-10 bg-background/50"
            onClick={() => setDetailModal('weekly')}
            title="Ver detalhes"
          >
            <Maximize2 className="h-3.5 w-3.5" />
          </button>
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

      {/* Triages Detail Modal */}
      <DetailModal
        title="Triagens no Período"
        icon={ClipboardCheck}
        open={detailModal === 'triages'}
        onOpenChange={(open) => { if (!open) setDetailModal(null); }}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-3 rounded-lg bg-muted/30">
              <p className="text-xl font-bold">{metrics.statusBreakdown.pending}</p>
              <p className="text-xs text-muted-foreground">Pendentes/Triados</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/30">
              <p className="text-xl font-bold">{metrics.statusBreakdown.in_progress}</p>
              <p className="text-xs text-muted-foreground">Em andamento</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/30">
              <p className="text-xl font-bold">{metrics.statusBreakdown.resolved}</p>
              <p className="text-xs text-muted-foreground">Resolvidos</p>
            </div>
          </div>
          {compareEnabled && (
            <div className="text-sm text-muted-foreground">
              Período anterior: <strong>{metrics.prevCount}</strong> triagens.
              Variação: <strong>{metrics.currentCount - metrics.prevCount > 0 ? '+' : ''}{metrics.currentCount - metrics.prevCount}</strong>.
            </div>
          )}
        </div>
      </DetailModal>

      {/* Resolution Time Modal */}
      <DetailModal
        title="Tempo Médio de Resolução"
        icon={Clock}
        open={detailModal === 'resolution'}
        onOpenChange={(open) => { if (!open) setDetailModal(null); }}
      >
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Tempo médio entre a criação e resolução das triagens: <strong>{metrics.avgResolutionDays != null ? `${metrics.avgResolutionDays} dias` : 'Sem dados'}</strong>
          </p>
          {metrics.resolved.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Criado em</TableHead>
                  <TableHead>Resolvido em</TableHead>
                  <TableHead>Tempo (dias)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {metrics.resolved.slice(0, 10).map((t) => {
                  const days = Math.round((new Date(t.resolved_at!).getTime() - new Date(t.created_at).getTime()) / (1000 * 60 * 60 * 24) * 10) / 10;
                  return (
                    <TableRow key={t.id}>
                      <TableCell className="text-xs">{format(new Date(t.created_at), 'dd/MM/yy', { locale: ptBR })}</TableCell>
                      <TableCell className="text-xs">{format(new Date(t.resolved_at!), 'dd/MM/yy', { locale: ptBR })}</TableCell>
                      <TableCell className="text-xs font-medium">{days}d</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </div>
      </DetailModal>

      {/* Resolution Rate Modal */}
      <DetailModal
        title="Taxa de Resolução"
        icon={CheckCircle2}
        open={detailModal === 'rate'}
        onOpenChange={(open) => { if (!open) setDetailModal(null); }}
      >
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            <strong>{metrics.resolutionRate}%</strong> das triagens foram resolvidas ({metrics.resolved.length} de {triageRecords.length}).
          </p>
          <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-green-500 rounded-full" style={{ width: `${metrics.resolutionRate}%` }} />
          </div>
        </div>
      </DetailModal>

      {/* Weekly Detail Modal */}
      <DetailModal
        title="Triagens por Semana"
        icon={TrendingUp}
        open={detailModal === 'weekly'}
        onOpenChange={(open) => { if (!open) setDetailModal(null); }}
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Semana</TableHead>
              <TableHead>Triagens</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {metrics.weeklyData.map((w, i) => (
              <TableRow key={i}>
                <TableCell className="text-xs">
                  {format(w.start, 'dd/MM', { locale: ptBR })} — {format(w.end, 'dd/MM', { locale: ptBR })}
                </TableCell>
                <TableCell className="text-xs font-medium">{w.count}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </DetailModal>
    </>
  );
}
