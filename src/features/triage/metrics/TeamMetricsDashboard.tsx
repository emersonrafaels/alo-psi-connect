import { Component, lazy, Suspense, useMemo, useState, type ReactNode } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  ArrowDownRight, ArrowRight, ArrowUpRight, CalendarClock, CheckCircle2, ClipboardCheck, Inbox, Minus,
  ShieldCheck, Timer, type LucideIcon,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { DetailModal } from '@/components/institution/DetailModal';
import type { StudentRiskData, TriageRecord } from '@/hooks/useStudentTriage';
import type { Risk } from '../priorities';
import { PRIORITY_META } from '../triagePlan';
import {
  computeBreakdowns, computeHeadline, computeOutcomes, periodWindows, scope, weeklyFlow, type MetricsSelection,
} from './teamMetrics';
import { FlowCharts } from './FlowCharts';
import { BarList, OutcomesBar, PriorityTable, TeamTable } from './Breakdowns';
import { actionRows, fmt, pct, resolutionRows } from './format';
import { MetricsToolbar, type MetricsMode } from './MetricsToolbar';
import { SCENE_RISKS, type Scene3D } from './three/sceneData';

const Metrics3DPanel = lazy(() => import('./three/Metrics3DPanel'));

export type MetricsNavTarget = 'critical_queue' | 'followups' | 'in_progress';

interface TeamMetricsDashboardProps {
  records: TriageRecord[];
  students: StudentRiskData[];
  /** Used by the 3D campus to load the academic structure. */
  institutionId: string;
  periodDays: number;
  onPeriodChange?: (days: number) => void;
  /** `compact` shows only the indicator cards (legacy portal tab). */
  variant?: 'full' | 'compact';
  onNavigate?: (target: MetricsNavTarget) => void;
}

type Tone = 'good' | 'bad' | 'neutral';
interface Delta { text: string; tone: Tone; dir: 'up' | 'down' | 'flat' }

/** Signed change vs the previous period, coloured by whether that direction is good for this metric. */
function delta(current: number | null, previous: number | null, goodWhen: 'up' | 'down' | 'none', unit = ''): Delta | undefined {
  if (current == null || previous == null) return undefined;
  const diff = Math.round((current - previous) * 10) / 10;
  if (diff === 0) return { text: 'igual ao período anterior', tone: 'neutral', dir: 'flat' };
  const dir = diff > 0 ? 'up' : 'down';
  const tone: Tone = goodWhen === 'none' ? 'neutral' : (dir === goodWhen ? 'good' : 'bad');
  return { text: `${diff > 0 ? '+' : '−'}${fmt(Math.abs(diff))}${unit} vs período anterior`, tone, dir };
}

const TONE_TEXT: Record<Tone, string> = {
  good: 'text-green-700 dark:text-green-400',
  bad: 'text-red-600 dark:text-red-400',
  neutral: 'text-muted-foreground',
};
const DIR_ICON = { up: ArrowUpRight, down: ArrowDownRight, flat: Minus };

type ModalKey = 'triaged' | 'resolved' | 'time';

interface Tile {
  key: string;
  label: string;
  value: string;
  sub?: string;
  delta?: Delta;
  hint: string;
  icon: LucideIcon;
  onClick?: () => void;
  cta?: string;
}

function MetricTile({ tile }: { tile: Tile }) {
  const Icon = tile.icon;
  const DeltaIcon = tile.delta ? DIR_ICON[tile.delta.dir] : null;
  const body = (
    <>
      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
        <Icon className="h-4 w-4 shrink-0" />{tile.label}
      </div>
      <p className="mt-2 text-2xl font-semibold tracking-tight">
        {tile.value}
        {tile.sub && <span className="ml-1.5 text-sm font-normal text-muted-foreground">{tile.sub}</span>}
      </p>
      {tile.delta && DeltaIcon && (
        <p className={`mt-1 flex items-center gap-1 text-xs ${TONE_TEXT[tile.delta.tone]}`}>
          <DeltaIcon className="h-3.5 w-3.5 shrink-0" />{tile.delta.text}
        </p>
      )}
      <p className="mt-1 text-xs text-muted-foreground">{tile.hint}</p>
      {tile.cta && <p className="mt-2 flex items-center gap-1 text-xs font-medium text-primary">{tile.cta}<ArrowRight className="h-3 w-3" /></p>}
    </>
  );
  const cls = 'h-full rounded-xl border bg-card p-4 text-left';
  if (!tile.onClick) return <div className={cls}>{body}</div>;
  return (
    <button type="button" onClick={tile.onClick}
      className={`${cls} transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring`}>
      {body}
    </button>
  );
}

const MODE_KEY = 'triage-metrics-mode';
/** Remembered per viewer; storage can be unavailable (private mode), so it is only a convenience. */
const readMode = (): MetricsMode => {
  try { return localStorage.getItem(MODE_KEY) === '3d' ? '3d' : 'dashboard'; } catch { return 'dashboard'; }
};

class SceneErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    if (this.state.failed) {
      return <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">Não foi possível carregar a visualização 3D. Os mesmos dados estão nos gráficos acima.</p>;
    }
    return this.props.children;
  }
}

export function TeamMetricsDashboard({ records, students, institutionId, periodDays, onPeriodChange, variant = 'full', onNavigate }: TeamMetricsDashboardProps) {
  const [modal, setModal] = useState<ModalKey | null>(null);
  const [selection, setSelection] = useState<MetricsSelection | null>(null);
  const [mode, setModeState] = useState<MetricsMode>(readMode);
  const [scene, setScene] = useState<Scene3D>('volume');
  const [risks, setRisks] = useState<Set<Risk>>(() => new Set(SCENE_RISKS));
  const [highlightPending, setHighlightPending] = useState(false);
  const setMode = (m: MetricsMode) => {
    setModeState(m);
    try { localStorage.setItem(MODE_KEY, m); } catch { /* storage unavailable */ }
  };
  // Recomputed with the data, so "now" moves forward on every refetch.
  const now = useMemo(() => new Date(), [records, students, periodDays]); // eslint-disable-line react-hooks/exhaustive-deps

  const headline = useMemo(() => computeHeadline(records, students, periodDays, now), [records, students, periodDays, now]);
  const period = useMemo(() => periodWindows(periodDays, now).current, [periodDays, now]);
  const scoped = useMemo(() => scope(records, selection, period), [records, selection, period]);
  const breakdowns = useMemo(() => computeBreakdowns(scoped.records, scoped.window), [scoped]);
  const periodBreakdowns = useMemo(() => computeBreakdowns(records, period), [records, period]);
  const outcomes = useMemo(() => computeOutcomes(records, students, period), [records, students, period]);
  const allWeeks = useMemo(() => weeklyFlow(records, now), [records, now]);
  const flowWeeks = useMemo(
    () => (selection?.priority ? weeklyFlow(records.filter((r) => r.priority === selection.priority), now) : allWeeks),
    [records, selection?.priority, now, allWeeks],
  );

  if (records.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
          <Inbox className="h-10 w-10 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">Ainda não há triagens registradas. As métricas aparecem depois da primeira triagem.</p>
          {onNavigate && <Button size="sm" onClick={() => onNavigate('critical_queue')}>Ir para a fila<ArrowRight className="ml-1 h-4 w-4" /></Button>}
        </CardContent>
      </Card>
    );
  }

  const h = headline;
  const critical = h.coverage.critical;
  const criticalPending = critical.total - critical.triaged;
  const tiles: Tile[] = [
    {
      key: 'triaged', label: 'Triagens realizadas', icon: ClipboardCheck, value: fmt(h.triaged.current),
      delta: delta(h.triaged.current, h.triaged.previous, 'none'), hint: `Registradas nos últimos ${periodDays} dias`,
      onClick: () => setModal('triaged'),
    },
    {
      key: 'resolved', label: 'Casos resolvidos', icon: CheckCircle2, value: fmt(h.resolved.current),
      delta: delta(h.resolved.current, h.resolved.previous, 'up'),
      hint: h.reopen.reopened > 0 ? `${h.reopen.reopened} reaberto${h.reopen.reopened > 1 ? 's' : ''} no período` : 'Nenhum caso reaberto no período',
      onClick: () => setModal('resolved'),
    },
    {
      key: 'time', label: 'Tempo até resolver', icon: Timer,
      value: h.resolutionDays.median != null ? `${fmt(h.resolutionDays.median)} dias` : '—',
      delta: delta(h.resolutionDays.median, h.resolutionDays.previousMedian, 'down', ' d'),
      hint: h.resolutionDays.p90 != null ? `Mediana · 90% resolvidos em até ${fmt(h.resolutionDays.p90)} dias` : 'Sem casos resolvidos no período',
      onClick: () => setModal('time'),
    },
    {
      key: 'coverage', label: 'Alunos Em Risco triados', icon: ShieldCheck,
      value: critical.total > 0 ? `${pct(critical.triaged, critical.total)}%` : '—',
      sub: critical.total > 0 ? `${critical.triaged} de ${critical.total}` : undefined,
      hint: critical.total === 0 ? 'Nenhum aluno Em Risco no período' : criticalPending > 0 ? `${criticalPending} aguardando triagem` : 'Todos já foram triados',
      onClick: onNavigate && criticalPending > 0 ? () => onNavigate('critical_queue') : undefined,
      cta: onNavigate && criticalPending > 0 ? 'Triar agora' : undefined,
    },
    {
      key: 'followups', label: 'Follow-ups em dia', icon: CalendarClock,
      value: h.followUps.withDate > 0 ? `${pct(h.followUps.onTime, h.followUps.withDate)}%` : '—',
      sub: h.followUps.withDate > 0 ? `${h.followUps.onTime} de ${h.followUps.withDate}` : undefined,
      hint: h.followUps.overdue > 0 ? `${h.followUps.overdue} vencido${h.followUps.overdue > 1 ? 's' : ''}` : 'Nenhum follow-up vencido',
      onClick: onNavigate ? () => onNavigate('followups') : undefined,
      cta: onNavigate && h.followUps.overdue > 0 ? 'Ver follow-ups' : undefined,
    },
    {
      key: 'backlog', label: 'Casos em andamento', icon: Inbox, value: fmt(h.backlog.open),
      delta: delta(h.backlog.open, h.backlog.previousOpen, 'down'),
      hint: h.backlog.stale > 0 ? `${h.backlog.stale} parado${h.backlog.stale > 1 ? 's' : ''} há mais de 30 dias` : `Idade mediana: ${fmt(h.backlog.medianAgeDays)} dias`,
      onClick: onNavigate ? () => onNavigate('in_progress') : undefined,
      cta: onNavigate && h.backlog.stale > 0 ? 'Ver casos' : undefined,
    },
  ];

  const tileGrid = (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
      {tiles.map((t) => <MetricTile key={t.key} tile={t} />)}
    </div>
  );
  const modals = (
    <>
      <DetailModal title="Triagens realizadas" icon={ClipboardCheck} open={modal === 'triaged'} onOpenChange={(o) => !o && setModal(null)}>
        <div className="space-y-5">
          <p className="text-sm text-muted-foreground">Triagens registradas nos últimos {periodDays} dias, por prioridade e pela ação recomendada.</p>
          <PriorityTable data={periodBreakdowns.byPriority} />
          <BarList rows={actionRows(periodBreakdowns)} empty="Nenhuma triagem no período." />
        </div>
      </DetailModal>
      <DetailModal title="Casos resolvidos" icon={CheckCircle2} open={modal === 'resolved'} onOpenChange={(o) => !o && setModal(null)}>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {h.resolved.current} casos resolvidos nos últimos {periodDays} dias ({h.resolved.previous} no período anterior). Como foram encerrados:
          </p>
          <BarList rows={resolutionRows(periodBreakdowns)} empty="Nenhum caso resolvido no período." />
        </div>
      </DetailModal>
      <DetailModal title="Tempo até resolver" icon={Timer} open={modal === 'time'} onOpenChange={(o) => !o && setModal(null)}>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Dias entre o registro da triagem e a resolução, nos casos resolvidos no período. Usamos a mediana (o caso do meio)
            para que poucos casos muito longos não distorçam o número; o percentil 90 mostra o prazo em que 9 de cada 10 casos se resolvem.
          </p>
          <div className="grid grid-cols-3 gap-3 text-center">
            {[['Mediana', h.resolutionDays.median], ['90% em até', h.resolutionDays.p90], ['Período anterior', h.resolutionDays.previousMedian]].map(([label, v]) => (
              <div key={label as string} className="rounded-lg bg-muted/40 p-3">
                <p className="text-xl font-semibold">{v != null ? `${fmt(v as number)} d` : '—'}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>
          <PriorityTable data={periodBreakdowns.byPriority} />
        </div>
      </DetailModal>
    </>
  );

  if (variant === 'compact') return <>{tileGrid}{modals}</>;

  const scopeLabel = selection
    ? [selection.weekStart && `semana de ${format(scoped.window.start, 'dd/MM', { locale: ptBR })} a ${format(scoped.window.end, 'dd/MM', { locale: ptBR })}`,
       selection.priority && `prioridade ${PRIORITY_META[selection.priority].label}`].filter(Boolean).join(' · ')
    : `últimos ${periodDays} dias`;

  const toolbar = (
    <MetricsToolbar
      mode={mode}
      onModeChange={setMode}
      periodDays={periodDays}
      onPeriodChange={onPeriodChange}
      weeks={allWeeks}
      selection={selection}
      onSelectionChange={setSelection}
      scene={scene}
      onSceneChange={setScene}
      risks={risks}
      onRisksChange={setRisks}
      highlightPending={highlightPending}
      onHighlightPendingChange={setHighlightPending}
    />
  );

  if (mode === '3d') {
    return (
      <div className="space-y-4">
        {toolbar}
        <SceneErrorBoundary>
          <Suspense fallback={<Skeleton className="h-[min(72vh,720px)] min-h-[460px] w-full rounded-xl" />}>
            <Metrics3DPanel
              institutionId={institutionId}
              scene={scene}
              weeks={allWeeks}
              selection={selection}
              onSelect={setSelection}
              students={students}
              litRisks={risks}
              highlightPending={highlightPending}
            />
          </Suspense>
        </SceneErrorBoundary>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {toolbar}

      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">Resumo do período</p>
          <p className="mt-1 text-lg font-semibold leading-snug">
            Nos últimos {periodDays} dias a equipe registrou <span className="text-primary">{h.triaged.current} triagens</span> e
            resolveu <span className="text-primary">{h.resolved.current} casos</span>
            {h.resolutionDays.median != null && <>, em {fmt(h.resolutionDays.median)} dias (mediana)</>}.
            {critical.total > 0 && (criticalPending > 0
              ? <> {criticalPending} de {critical.total} alunos Em Risco ainda aguardam triagem.</>
              : <> Todos os {critical.total} alunos Em Risco já foram triados.</>)}
          </p>
        </CardContent>
      </Card>

      {tileGrid}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Fluxo da equipe</CardTitle>
          <CardDescription>
            Últimas 12 semanas{selection?.priority && `, só prioridade ${PRIORITY_META[selection.priority].label}`}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FlowCharts
            weeks={flowWeeks}
            selectedWeek={selection?.weekStart}
            onSelectWeek={(weekStart) => setSelection((s) => (weekStart || s?.priority ? { ...s, weekStart } : null))}
          />
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-5">
        <Card className="xl:col-span-3">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Onde a equipe atua</CardTitle>
            <CardDescription>Recorte: {scopeLabel}. Clique numa prioridade para filtrar (ou use os filtros no topo).</CardDescription>
          </CardHeader>
          <CardContent>
            <PriorityTable
              data={breakdowns.byPriority}
              selected={selection?.priority}
              onSelect={(priority) => setSelection((s) => (priority || s?.weekStart ? { ...s, priority } : null))}
            />
          </CardContent>
        </Card>
        <Card className="xl:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Desfechos</CardTitle>
            <CardDescription>Alunos com triagem resolvida nos últimos {periodDays} dias.</CardDescription>
          </CardHeader>
          <CardContent>
            <OutcomesBar outcomes={outcomes} reopened={h.reopen.reopened} resolved={h.reopen.resolved} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Ações recomendadas</CardTitle>
            <CardDescription>Novas triagens · {scopeLabel}</CardDescription>
          </CardHeader>
          <CardContent><BarList rows={actionRows(breakdowns)} empty="Nenhuma triagem neste recorte." /></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Como os casos foram encerrados</CardTitle>
            <CardDescription>Casos resolvidos · {scopeLabel}</CardDescription>
          </CardHeader>
          <CardContent><BarList rows={resolutionRows(breakdowns)} empty="Nenhum caso resolvido neste recorte." /></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Equipe</CardTitle>
          <CardDescription>Recorte: {scopeLabel}. Clique no nome da coluna para ordenar.</CardDescription>
        </CardHeader>
        <CardContent><TeamTable rows={breakdowns.team} /></CardContent>
      </Card>

      {modals}
    </div>
  );
}
