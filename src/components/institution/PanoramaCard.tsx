import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ArrowRight,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  ClipboardList,
  FileDown,
  Sparkles,
} from 'lucide-react';
import { useStudentTriageData } from '@/hooks/useStudentTriage';
import { useTriagePeriod } from '@/hooks/useTriagePeriod';
import { cn } from '@/lib/utils';

interface PanoramaCardProps {
  institutionId: string;
  periodDays: number;
  totalStudentsLinked: number;
  studentsWithEntries: number;
  totalEntries: number;
  avgMood: number | null;
  avgAnxiety: number | null;
  changePercent: number;
  onNavigateToTriage?: () => void;
  onExportReport?: () => void;
}

interface RiskRow {
  key: 'critical' | 'alert' | 'attention' | 'healthy';
  label: string;
  suffix: string;
  count: number;
  dot: string;
  text: string;
  bg: string;
  border: string;
}

const formatBR = (v: number | null, digits = 1) =>
  v == null ? '—' : v.toFixed(digits).replace('.', ',');

export const PanoramaCard = ({
  institutionId,
  periodDays,
  totalStudentsLinked,
  studentsWithEntries,
  totalEntries,
  avgMood,
  avgAnxiety,
  changePercent,
  onNavigateToTriage,
  onExportReport,
}: PanoramaCardProps) => {
  const { data: students = [], isLoading } = useStudentTriageData(institutionId, periodDays);

  const counts = useMemo(() => {
    const c = { critical: 0, alert: 0, attention: 0, healthy: 0, no_data: 0 };
    students.forEach((s) => {
      c[s.riskLevel] = (c[s.riskLevel] || 0) + 1;
    });
    return c;
  }, [students]);

  const openCases = counts.critical + counts.alert + counts.attention;
  const engagementRate =
    totalStudentsLinked > 0 ? Math.round((studentsWithEntries / totalStudentsLinked) * 100) : 0;

  const rows: RiskRow[] = [
    {
      key: 'critical',
      label: 'Crítico',
      suffix: 'ação imediata (contato hoje)',
      count: counts.critical,
      dot: 'bg-red-500',
      text: 'text-red-700 dark:text-red-300',
      bg: 'bg-red-50/60 dark:bg-red-950/20',
      border: 'border-red-200 dark:border-red-900/50',
    },
    {
      key: 'alert',
      label: 'Alerta',
      suffix: 'acolhimento em até 7 dias',
      count: counts.alert,
      dot: 'bg-orange-500',
      text: 'text-orange-700 dark:text-orange-300',
      bg: 'bg-orange-50/60 dark:bg-orange-950/20',
      border: 'border-orange-200 dark:border-orange-900/50',
    },
    {
      key: 'attention',
      label: 'Atenção',
      suffix: 'monitorar próximo check-in',
      count: counts.attention,
      dot: 'bg-yellow-500',
      text: 'text-yellow-700 dark:text-yellow-300',
      bg: 'bg-yellow-50/60 dark:bg-yellow-950/20',
      border: 'border-yellow-200 dark:border-yellow-900/50',
    },
    {
      key: 'healthy',
      label: 'Saudável',
      suffix: 'reconhecer e manter o ritmo',
      count: counts.healthy,
      dot: 'bg-emerald-500',
      text: 'text-emerald-700 dark:text-emerald-300',
      bg: 'bg-emerald-50/60 dark:bg-emerald-950/20',
      border: 'border-emerald-200 dark:border-emerald-900/50',
    },
  ];

  const trendIcon =
    changePercent > 3 ? (
      <ArrowUpRight className="h-3.5 w-3.5 text-emerald-600" />
    ) : changePercent < -3 ? (
      <ArrowDownRight className="h-3.5 w-3.5 text-red-600" />
    ) : (
      <Minus className="h-3.5 w-3.5 text-muted-foreground" />
    );
  const trendLabel =
    changePercent > 3
      ? `↑ ${Math.abs(changePercent).toFixed(0)}% vs. período anterior`
      : changePercent < -3
        ? `↓ ${Math.abs(changePercent).toFixed(0)}% vs. período anterior`
        : 'estável vs. período anterior';

  const headline =
    openCases === 0
      ? `Todos os ${totalStudentsLinked} alunos estão em faixa saudável`
      : `${openCases} aluno${openCases > 1 ? 's' : ''} ${openCases > 1 ? 'precisam' : 'precisa'} da sua atenção esta semana`;

  if (isLoading) {
    return <Skeleton className="h-64 w-full" />;
  }

  return (
    <Card className="overflow-hidden border-primary/20">
      <CardContent className="p-0">
        {/* Header narrativo */}
        <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-5 border-b">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-primary/15 mt-0.5">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs uppercase tracking-wide text-primary font-semibold mb-1">
                Panorama do período
              </div>
              <h3 className="text-lg sm:text-xl font-semibold leading-snug">{headline}</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Nos últimos <strong>{periodDays === 9999 ? 'todo o período' : `${periodDays} dias`}</strong>,{' '}
                <strong>
                  {studentsWithEntries} de {totalStudentsLinked} alunos ({engagementRate}%)
                </strong>{' '}
                registraram no diário emocional — <strong>{totalEntries} check-ins</strong> no total.
              </p>
              <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  Humor médio: <strong className="text-foreground">{formatBR(avgMood)}/5</strong>{' '}
                  {trendIcon}
                  <span>{trendLabel}</span>
                </span>
                <span className="inline-flex items-center gap-1">
                  Ansiedade: <strong className="text-foreground">{formatBR(avgAnxiety)}/5</strong>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Distribuição por risco */}
        <div className="p-5 space-y-3">
          <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Como estão distribuídos hoje
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {rows.map((r) => (
              <div
                key={r.key}
                className={cn(
                  'flex items-center gap-3 p-3 rounded-lg border',
                  r.bg,
                  r.border,
                  r.count === 0 && 'opacity-60'
                )}
              >
                <span className={cn('h-2.5 w-2.5 rounded-full flex-shrink-0', r.dot)} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className={cn('text-lg font-bold tabular-nums', r.text)}>
                      {r.count}
                    </span>
                    <span className={cn('text-sm font-semibold', r.text)}>{r.label}</span>
                  </div>
                  <div className="text-[11px] text-muted-foreground leading-tight">
                    {r.suffix}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {counts.no_data > 0 && (
            <div className="text-xs text-muted-foreground">
              <Badge variant="outline" className="mr-1">
                {counts.no_data}
              </Badge>
              aluno{counts.no_data > 1 ? 's' : ''} sem registros no período — considere um lembrete
              para engajar.
            </div>
          )}
        </div>

        {/* Ações sugeridas */}
        <div className="px-5 py-4 bg-muted/30 border-t flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground mr-auto">
            {openCases > 0
              ? 'Sugestão: comece pelos críticos e desça a lista.'
              : 'Mantenha o ritmo de check-ins e celebre os avanços.'}
          </span>
          {counts.critical > 0 && onNavigateToTriage && (
            <Button size="sm" variant="destructive" onClick={onNavigateToTriage}>
              <ClipboardList className="h-4 w-4 mr-1.5" />
              Ver {counts.critical} crítico{counts.critical > 1 ? 's' : ''}
              <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          )}
          {openCases > 0 && onNavigateToTriage && (
            <Button size="sm" variant="outline" onClick={onNavigateToTriage}>
              Ver {openCases} caso{openCases > 1 ? 's' : ''} aberto{openCases > 1 ? 's' : ''}
            </Button>
          )}
          {onExportReport && (
            <Button size="sm" variant="ghost" onClick={onExportReport}>
              <FileDown className="h-4 w-4 mr-1.5" />
              Exportar relatório
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
