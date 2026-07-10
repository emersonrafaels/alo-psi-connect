import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useInstitutionExecutiveSummary, type ExecutiveSummary } from '@/hooks/useInstitutionExecutiveSummary';
import { Sparkles, Users, AlertTriangle, CheckCircle2, Activity, RefreshCw, ArrowRight, ArrowUp, ArrowDown, CheckCircle } from 'lucide-react';

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

function dayLabels(): { dow: string; date: string; isToday: boolean }[] {
  const out: { dow: string; date: string; isToday: boolean }[] = [];
  const dows = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 86400000);
    out.push({
      dow: dows[d.getDay()],
      date: `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`,
      isToday: i === 0,
    });
  }
  return out;
}

function BarChart({ data }: { data: number[] }) {
  const max = Math.max(...data, 1);
  const avg = data.reduce((a, b) => a + b, 0) / (data.length || 1);
  const labels = dayLabels();
  const chartH = 180;
  const avgY = chartH - (avg / max) * chartH;
  return (
    <div className="space-y-2">
      <div className="relative" style={{ height: chartH }}>
        {/* linha média */}
        {avg > 0 && (
          <>
            <div
              className="absolute left-0 right-0 border-t border-dashed border-muted-foreground/40 pointer-events-none"
              style={{ top: avgY }}
            />
            <span
              className="absolute right-0 -translate-y-1/2 text-[10px] px-1.5 py-0.5 rounded bg-background border text-muted-foreground"
              style={{ top: avgY }}
            >
              média {Math.round(avg)}
            </span>
          </>
        )}
        <div className="absolute inset-0 flex items-end gap-2">
          {data.map((v, i) => {
            const h = (v / max) * chartH;
            const today = labels[i]?.isToday;
            return (
              <div key={i} className="flex-1 flex flex-col items-center justify-end h-full relative">
                {v > 0 && (
                  <span className="text-[11px] font-semibold text-foreground mb-1">{v}</span>
                )}
                <div
                  className={`w-full rounded-t-md transition-all ${
                    today
                      ? 'bg-gradient-to-t from-primary to-primary/70 ring-2 ring-primary/30'
                      : 'bg-gradient-to-t from-primary/70 to-primary/40'
                  }`}
                  style={{ height: Math.max(h, v > 0 ? 6 : 2) }}
                />
              </div>
            );
          })}
        </div>
      </div>
      <div className="flex gap-2">
        {labels.map((l, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
            <span className={`text-[10px] font-medium ${l.isToday ? 'text-primary' : 'text-muted-foreground'}`}>
              {l.isToday ? 'hoje' : l.dow}
            </span>
            <span className="text-[10px] text-muted-foreground/70">{l.date}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Donut({ value, total, size = 160, tone = 'primary' }: { value: number; total: number; size?: number; tone?: 'primary' | 'emerald' }) {
  const pct = total > 0 ? value / total : 0;
  const r = 42;
  const c = 2 * Math.PI * r;
  const dash = c * pct;
  const stroke = tone === 'emerald' ? 'hsl(160 84% 39%)' : 'hsl(var(--primary))';
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
        <circle cx="50" cy="50" r={r} fill="none" stroke="hsl(var(--muted))" strokeWidth="10" />
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          stroke={stroke}
          strokeWidth="10"
          strokeDasharray={`${dash} ${c - dash}`}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-3xl font-bold tracking-tight">{Math.round(pct * 100)}%</div>
        <div className="text-[11px] text-muted-foreground mt-0.5">{value} de {total}</div>
      </div>
    </div>
  );
}

function MiniStat({ label, value, tone }: { label: string; value: string | number; tone?: 'emerald' | 'amber' | 'default' }) {
  const color =
    tone === 'emerald'
      ? 'text-emerald-600 dark:text-emerald-400'
      : tone === 'amber'
        ? 'text-amber-600 dark:text-amber-400'
        : 'text-foreground';
  return (
    <div className="rounded-lg border bg-card/50 p-3">
      <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
    </div>
  );
}

function TrendPill({ delta }: { delta: number }) {
  const Icon = delta > 0 ? ArrowUp : delta < 0 ? ArrowDown : ArrowRightIcon;
  const tone =
    delta > 0
      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
      : delta < 0
        ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
        : 'bg-muted text-muted-foreground border-border';
  const label = delta === 0 ? 'estável' : `${delta > 0 ? '+' : ''}${delta}`;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full border ${tone}`}>
      <Icon className="h-3 w-3" /> {label} vs. semana anterior
    </span>
  );
}

function LegendDot({ color, label, value }: { color: string; label: string; value: number }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold ml-auto">{value}</span>
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
  const delta = summary.activeStudentsWeek - summary.activeStudentsPrevWeek;
  const engagementPct = Math.round(summary.engagementRate * 100);
  const engagementTotal =
    summary.engagementRate > 0
      ? Math.max(summary.activeStudentsWeek, Math.round(summary.activeStudentsWeek / summary.engagementRate))
      : summary.activeStudentsWeek;
  const engagementStatus =
    engagementPct >= 60
      ? { label: 'Excelente', tone: 'emerald' as const }
      : engagementPct >= 40
        ? { label: 'Saudável', tone: 'emerald' as const }
        : engagementPct >= 20
          ? { label: 'Atenção', tone: 'amber' as const }
          : { label: 'Baixo', tone: 'amber' as const };
  const openTriage = summary.totalTriage - summary.resolvedTriage;
  const resolvedPct = summary.totalTriage > 0 ? Math.round((summary.resolvedTriage / summary.totalTriage) * 100) : 0;

  const content = {
    active: {
      title: 'Alunos ativos nos últimos 7 dias',
      description: 'Alunos únicos que registraram algo no diário emocional em cada dia da semana.',
      body: (
        <div className="space-y-6">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Ativos esta semana</p>
              <p className="text-4xl font-bold leading-none mt-1">{summary.activeStudentsWeek}</p>
            </div>
            <TrendPill delta={delta} />
          </div>
          <BarChart data={summary.sparkline} />
          <div className="grid grid-cols-2 gap-3 pt-4 border-t">
            <MiniStat label="Últimos 7 dias" value={summary.activeStudentsWeek} />
            <MiniStat label="Semana anterior" value={summary.activeStudentsPrevWeek} />
          </div>
        </div>
      ),
    },
    engagement: {
      title: 'Engajamento no diário emocional',
      description: 'Proporção de alunos vinculados que fizeram ao menos um registro nos últimos 7 dias.',
      body: (
        <div className="space-y-6">
          <div className="flex items-center justify-center pt-2">
            <Donut value={summary.activeStudentsWeek} total={engagementTotal} tone="emerald" />
          </div>
          <div className="flex items-center justify-center">
            <Badge
              variant="outline"
              className={
                engagementStatus.tone === 'emerald'
                  ? 'border-emerald-500/40 text-emerald-600 dark:text-emerald-400'
                  : 'border-amber-500/40 text-amber-600 dark:text-amber-400'
              }
            >
              {engagementStatus.label}
            </Badge>
          </div>
          <div className="space-y-2">
            <div className="relative h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary/60 to-primary rounded-full"
                style={{ width: `${Math.min(100, engagementPct)}%` }}
              />
              {[20, 40, 60].map((m) => (
                <div key={m} className="absolute inset-y-0 w-px bg-background/80" style={{ left: `${m}%` }} />
              ))}
            </div>
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>0%</span>
              <span>20% baixo</span>
              <span>40% saudável</span>
              <span>60% excelente</span>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 pt-4 border-t">
            <MiniStat label="Ativos" value={summary.activeStudentsWeek} tone="emerald" />
            <MiniStat label="Vinculados" value={engagementTotal} />
            <MiniStat label="Meta" value="40%" />
          </div>
        </div>
      ),
    },
    critical: {
      title: 'Alertas críticos abertos',
      description: 'Triagens de risco alto ou crítico que ainda não foram resolvidas.',
      body: (
        <div className="space-y-5">
          {criticalTriages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center space-y-3">
              <div className="p-3 rounded-full bg-emerald-500/10">
                <CheckCircle className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-base font-semibold">Tudo tranquilo por aqui</p>
                <p className="text-sm text-muted-foreground max-w-sm">
                  Nenhuma triagem crítica em aberto no momento. Continue acompanhando os indicadores.
                </p>
              </div>
            </div>
          ) : (
            <ul className="space-y-2.5">
              {criticalTriages.map((a) => (
                <li key={a.id} className="flex items-start gap-3 p-3.5 rounded-lg border bg-card/50">
                  <Badge
                    variant="outline"
                    className={
                      a.severity === 'high'
                        ? 'border-rose-500/40 text-rose-600 dark:text-rose-400 shrink-0'
                        : 'border-amber-500/40 text-amber-600 dark:text-amber-400 shrink-0'
                    }
                  >
                    {a.severity === 'high' ? 'Alto' : 'Médio'}
                  </Badge>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium leading-snug">{a.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{a.subtitle}</p>
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
        <div className="space-y-6">
          <div className="flex items-center gap-6">
            <Donut value={summary.resolvedTriage} total={summary.totalTriage} tone="emerald" />
            <div className="flex-1 space-y-2.5">
              <LegendDot color="hsl(160 84% 39%)" label="Resolvidas" value={summary.resolvedTriage} />
              <LegendDot color="hsl(38 92% 50%)" label="Em aberto" value={openTriage} />
              <div className="pt-2 border-t">
                <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Total</p>
                <p className="text-xl font-bold">{summary.totalTriage}</p>
              </div>
            </div>
          </div>
          {summary.totalTriage > 0 && (
            <div className="flex h-3 rounded-full overflow-hidden bg-muted">
              <div className="bg-emerald-500" style={{ width: `${resolvedPct}%` }} />
              <div className="bg-amber-500" style={{ width: `${100 - resolvedPct}%` }} />
            </div>
          )}
          <div className="rounded-lg border border-dashed p-3 text-xs text-muted-foreground">
            <strong className="text-foreground">Meta saudável:</strong> resolução ≥ 70%. Abaixo disso, priorize acompanhamento das triagens em aberto.
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
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-lg">{content.title}</DialogTitle>
          <DialogDescription>{content.description}</DialogDescription>
        </DialogHeader>
        <div className="pt-2">{content.body}</div>
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
