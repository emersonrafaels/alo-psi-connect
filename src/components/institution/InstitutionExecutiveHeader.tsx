import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ArrowUp, ArrowDown, ArrowRightIcon, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useInstitutionExecutiveSummary, type ExecutiveSummary } from '@/hooks/useInstitutionExecutiveSummary';
import { Sparkles, Users, TrendingUp, AlertTriangle, CheckCircle2, Activity, RefreshCw, ArrowRight } from 'lucide-react';

interface Props {
  institutionId: string;
  onNavigateToTriage?: () => void;
}

type KpiKey = 'active' | 'engagement' | 'critical' | 'resolution';

function Sparkline({ data }: { data: number[] }) {
  if (!data.length) return null;
  const max = Math.max(...data, 1);
  const w = 80;
  const h = 28;
  const step = w / (data.length - 1 || 1);
  const points = data.map((v, i) => `${i * step},${h - (v / max) * h}`).join(' ');
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-20 h-7">
      <polyline
        fill="none"
        stroke="hsl(var(--primary))"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
}

function KpiCard({
  icon: Icon,
  label,
  value,
  hint,
  extra,
  tone = 'default',
  onClick,
}: {
  icon: any;
  label: string;
  value: string;
  hint?: string;
  extra?: React.ReactNode;
  tone?: 'default' | 'success' | 'warning' | 'danger';
  onClick?: () => void;
}) {
  const toneClass = {
    default: 'from-primary/10 to-primary/5 text-primary',
    success: 'from-emerald-500/10 to-emerald-500/5 text-emerald-600 dark:text-emerald-400',
    warning: 'from-amber-500/10 to-amber-500/5 text-amber-600 dark:text-amber-400',
    danger: 'from-rose-500/10 to-rose-500/5 text-rose-600 dark:text-rose-400',
  }[tone];
  return (
    <Card
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      className={`border-border/50 transition ${
        onClick ? 'cursor-pointer hover:border-primary/40 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary/40' : ''
      }`}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className={`p-2 rounded-lg bg-gradient-to-br ${toneClass}`}>
            <Icon className="h-4 w-4" />
          </div>
          {extra}
        </div>
        <div className="text-2xl font-bold">{value}</div>
        <div className="text-xs font-medium text-foreground/80 mt-0.5">{label}</div>
        {hint && <p className="text-[11px] text-muted-foreground mt-1">{hint}</p>}
      </CardContent>
    </Card>
  );
}

interface Brief {
  headline: string;
  highlights: string[];
  focus: string;
}

async function fetchBrief(institutionId: string): Promise<Brief | null> {
  const { data, error } = await supabase.functions.invoke('institution-weekly-brief', {
    body: { institutionId },
  });
  if (error) throw error;
  return data?.brief || null;
}

function BarChart({ data }: { data: number[] }) {
  const max = Math.max(...data, 1);
  const labels = ['-6d', '-5d', '-4d', '-3d', '-2d', 'ontem', 'hoje'];
  return (
    <div className="flex items-end gap-2 h-32">
      {data.map((v, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <div className="text-[10px] text-muted-foreground">{v}</div>
          <div
            className="w-full rounded-t bg-gradient-to-t from-primary/60 to-primary transition-all"
            style={{ height: `${(v / max) * 100}%`, minHeight: v > 0 ? 4 : 2 }}
          />
          <div className="text-[10px] text-muted-foreground">{labels[i] || ''}</div>
        </div>
      ))}
    </div>
  );
}

function Donut({ value, total }: { value: number; total: number }) {
  const pct = total > 0 ? value / total : 0;
  const r = 42;
  const c = 2 * Math.PI * r;
  const dash = c * pct;
  return (
    <div className="relative w-32 h-32">
      <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
        <circle cx="50" cy="50" r={r} fill="none" stroke="hsl(var(--muted))" strokeWidth="10" />
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth="10"
          strokeDasharray={`${dash} ${c - dash}`}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-2xl font-bold">{Math.round(pct * 100)}%</div>
        <div className="text-[10px] text-muted-foreground">{value}/{total}</div>
      </div>
    </div>
  );
}

function KpiDetailDialog({
  open,
  onOpenChange,
  kpi,
  summary,
  onGoTriage,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  kpi: KpiKey | null;
  summary: ExecutiveSummary;
  onGoTriage: () => void;
}) {
  if (!kpi) return null;
  const criticalTriages = summary.alerts.filter((a) => a.type === 'triage');

  const content = {
    active: {
      title: 'Alunos ativos nos últimos 7 dias',
      description: 'Distribuição diária de alunos únicos com registro no diário emocional.',
      body: (
        <div className="space-y-4">
          <BarChart data={summary.sparkline} />
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">Últimos 7 dias</p>
              <p className="text-xl font-bold">{summary.activeStudentsWeek}</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">Semana anterior</p>
              <p className="text-xl font-bold">{summary.activeStudentsPrevWeek}</p>
            </div>
          </div>
        </div>
      ),
    },
    engagement: {
      title: 'Engajamento no diário emocional',
      description: 'Proporção de alunos vinculados que registraram humor nos últimos 7 dias.',
      body: (
        <div className="space-y-4">
          <div className="flex items-center justify-center py-2">
            <Donut value={summary.activeStudentsWeek} total={Math.max(summary.activeStudentsWeek, Math.round(summary.activeStudentsWeek / (summary.engagementRate || 1)))} />
          </div>
          <p className="text-sm text-muted-foreground text-center">
            Uma taxa acima de 40% indica cultura consistente de auto-observação. Abaixo disso, considere ações de reengajamento.
          </p>
        </div>
      ),
    },
    critical: {
      title: 'Alertas críticos abertos',
      description: 'Triagens de alto ou crítico risco que ainda não foram resolvidas.',
      body: (
        <div className="space-y-3">
          {criticalTriages.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma triagem crítica em aberto no momento.</p>
          ) : (
            <ul className="space-y-2">
              {criticalTriages.map((a) => (
                <li key={a.id} className="flex items-start gap-2 p-3 rounded-lg border">
                  <Badge
                    variant="outline"
                    className={
                      a.severity === 'high'
                        ? 'border-rose-500/40 text-rose-600 dark:text-rose-400'
                        : 'border-amber-500/40 text-amber-600 dark:text-amber-400'
                    }
                  >
                    {a.severity === 'high' ? 'Alto' : 'Médio'}
                  </Badge>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{a.title}</p>
                    <p className="text-xs text-muted-foreground">{a.subtitle}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <Button className="w-full" onClick={onGoTriage}>
            Abrir triagem <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      ),
    },
    resolution: {
      title: 'Taxa de resolução de triagens',
      description: 'Percentual de triagens já resolvidas sobre o total registrado.',
      body: (
        <div className="space-y-4">
          <div className="flex items-center justify-center py-2">
            <Donut value={summary.resolvedTriage} total={summary.totalTriage} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">Resolvidas</p>
              <p className="text-xl font-bold text-emerald-600">{summary.resolvedTriage}</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">Em aberto</p>
              <p className="text-xl font-bold text-amber-600">{summary.totalTriage - summary.resolvedTriage}</p>
            </div>
          </div>
          <Button variant="outline" className="w-full" onClick={onGoTriage}>
            Ver detalhes na triagem <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      ),
    },
  }[kpi];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{content.title}</DialogTitle>
          <DialogDescription>{content.description}</DialogDescription>
        </DialogHeader>
        {content.body}
      </DialogContent>
    </Dialog>
  );
}

export function InstitutionExecutiveHeader({ institutionId, onNavigateToTriage }: Props) {
  const { data: summary, isLoading } = useInstitutionExecutiveSummary(institutionId);
  const [briefEnabled, setBriefEnabled] = useState(false);
  const [openKpi, setOpenKpi] = useState<KpiKey | null>(null);

  const goToTriage = () => {
    onNavigateToTriage?.();
    setOpenKpi(null);
    setTimeout(() => {
      document.getElementById('institution-tabs')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  };

  const {
    data: brief,
    isFetching: briefLoading,
    refetch: refetchBrief,
  } = useQuery({
    queryKey: ['institution-weekly-brief', institutionId],
    queryFn: () => fetchBrief(institutionId),
    enabled: briefEnabled && !!institutionId,
    staleTime: 60 * 60 * 1000,
  });

  if (isLoading || !summary) {
    return (
      <div className="grid gap-3 md:grid-cols-4 mb-6">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-28 rounded-lg" />
        ))}
      </div>
    );
  }

  const delta = summary.activeStudentsWeek - summary.activeStudentsPrevWeek;
  const deltaLabel = delta === 0 ? 'estável' : delta > 0 ? `+${delta}` : `${delta}`;

  return (
    <div className="space-y-4 mb-6">
      <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
        <KpiCard
          icon={Users}
          label="Alunos ativos (7d)"
          value={String(summary.activeStudentsWeek)}
          hint={`vs. semana anterior: ${deltaLabel}`}
          extra={<Sparkline data={summary.sparkline} />}
          onClick={() => setOpenKpi('active')}
        />
        <KpiCard
          icon={Activity}
          label="Engajamento"
          value={`${Math.round(summary.engagementRate * 100)}%`}
          hint="alunos com registro nos últimos 7 dias"
          tone={summary.engagementRate > 0.4 ? 'success' : 'warning'}
          onClick={() => setOpenKpi('engagement')}
        />
        <KpiCard
          icon={AlertTriangle}
          label="Alertas críticos abertos"
          value={String(summary.criticalOpen)}
          hint="triagens de alto/crítico não resolvidas"
          tone={summary.criticalOpen > 0 ? 'danger' : 'success'}
          extra={
            summary.criticalOpen > 0 ? (
              <span className="text-[10px] font-medium text-rose-600 dark:text-rose-400">Ver</span>
            ) : null
          }
          onClick={() => setOpenKpi('critical')}
        />
        <KpiCard
          icon={CheckCircle2}
          label="Taxa de resolução"
          value={`${Math.round(summary.resolutionRate * 100)}%`}
          hint={`${summary.resolvedTriage} de ${summary.totalTriage} triagens`}
          tone={summary.resolutionRate >= 0.7 ? 'success' : 'warning'}
          onClick={() => setOpenKpi('resolution')}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="md:col-span-2 border-primary/20 bg-gradient-to-br from-primary/[0.03] to-transparent">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                Resumo executivo do Buddy
              </CardTitle>
              {briefEnabled && (
                <Button size="sm" variant="ghost" onClick={() => refetchBrief()} disabled={briefLoading}>
                  <RefreshCw className={`h-3.5 w-3.5 ${briefLoading ? 'animate-spin' : ''}`} />
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {!briefEnabled ? (
              <div className="text-sm text-muted-foreground space-y-3">
                <p>
                  Peça ao Buddy uma síntese semanal com foco em bem-estar, engajamento e prioridades para a
                  gestão institucional.
                </p>
                <Button size="sm" onClick={() => setBriefEnabled(true)}>
                  <Sparkles className="h-4 w-4 mr-2" /> Gerar resumo semanal
                </Button>
              </div>
            ) : briefLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
              </div>
            ) : brief ? (
              <div className="space-y-3">
                <p className="text-sm font-medium">{brief.headline}</p>
                <ul className="space-y-1.5">
                  {brief.highlights?.map((h, i) => (
                    <li key={i} className="text-sm text-muted-foreground flex gap-2">
                      <span className="text-primary">•</span> {h}
                    </li>
                  ))}
                </ul>
                {brief.focus && (
                  <div className="pt-2 border-t border-border/50">
                    <p className="text-xs font-medium text-primary mb-1">Foco recomendado</p>
                    <p className="text-sm text-muted-foreground">{brief.focus}</p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Ainda não há dados suficientes para gerar um resumo.
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              Feed de alertas
            </CardTitle>
          </CardHeader>
          <CardContent>
            {summary.alerts.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum alerta ativo no momento.</p>
            ) : (
              <ul className="space-y-2">
                {summary.alerts.slice(0, 5).map((a) => (
                  <li
                    key={a.id}
                    role="button"
                    tabIndex={0}
                    onClick={goToTriage}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        goToTriage();
                      }
                    }}
                    className="flex items-start gap-2 text-sm p-2 -mx-2 rounded-md cursor-pointer hover:bg-muted/50 transition"
                  >
                    <Badge
                      variant="outline"
                      className={
                        a.severity === 'high'
                          ? 'border-rose-500/40 text-rose-600 dark:text-rose-400'
                          : 'border-amber-500/40 text-amber-600 dark:text-amber-400'
                      }
                    >
                      {a.type === 'triage' ? 'Triagem' : a.type === 'absence' ? 'Ausência' : 'Humor'}
                    </Badge>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{a.title}</p>
                      <p className="text-[11px] text-muted-foreground truncate">{a.subtitle}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            {summary.alerts.length > 0 && (
              <Button variant="ghost" size="sm" className="w-full mt-3" onClick={goToTriage}>
                Ir para triagem
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      <KpiDetailDialog
        open={openKpi !== null}
        onOpenChange={(o) => !o && setOpenKpi(null)}
        kpi={openKpi}
        summary={summary}
        onGoTriage={goToTriage}
      />
    </div>
  );
}
