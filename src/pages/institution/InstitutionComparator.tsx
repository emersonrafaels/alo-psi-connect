import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Users, Activity, NotebookPen, ClipboardCheck, Info, BarChart3, LayoutDashboard, GitCompare, MapPin, ArrowUpRight, ArrowDownRight, Minus, PanelLeft } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip, Legend } from 'recharts';
import { IntegratedAnalysis } from '@/features/institution/comparator/IntegratedAnalysis';
import { AppointmentsView } from '@/features/institution/comparator/appointments/AppointmentsView';
import { DiaryView } from '@/features/institution/comparator/diary/DiaryView';
import { ContentsView } from '@/features/institution/comparator/contents/ContentsView';
import { NedView } from '@/features/institution/comparator/ned/NedView';
import { PermanenceView } from '@/features/institution/comparator/permanence/PermanenceView';
import { JourneyView } from '@/features/institution/comparator/journey/JourneyView';
import { OverviewView } from '@/features/institution/comparator/overview/OverviewView';
import { Route as RouteIcon, CalendarDays, Network, PlayCircle, ListChecks, ShieldCheck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useInstitutionAccess } from '@/hooks/useInstitutionAccess';
import { useTenant } from '@/hooks/useTenant';
import { buildTenantPath } from '@/utils/tenantHelpers';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LogoLoader } from '@/components/ui/logo-loader';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type ScaleRow = { sem: string; scale_code: string; unit: string; course: string; n: number; avg: number };
type DiaryRow = { sem: string; unit: string; participants: number; avg_mood: number };
type Payload = { any_scale?: { sem: string; unit: string; n: number }[]; population: number; activated: number; units_population: Record<string, number>; unit_course_population?: { unit: string; course: string; c: number }[]; scales: ScaleRow[]; diary: DiaryRow[] };

export const MIN_GROUP = 10;

export const INSTRUMENTS = [
  { code: 'WHO5', label: 'Bem-estar mental', short: 'WHO-5', min: 0, max: 100, higherIsBetter: true, factor: 4 },
  { code: 'PSS10', label: 'Estresse percebido', short: 'PSS-10', min: 0, max: 40, higherIsBetter: false, factor: 1 },
  { code: 'GAD7', label: 'Sintomas de ansiedade', short: 'GAD-7', min: 0, max: 21, higherIsBetter: false, factor: 1 },
  { code: 'PHQ9', label: 'Sintomas depressivos', short: 'PHQ-9', min: 0, max: 27, higherIsBetter: false, factor: 1 },
  { code: 'ISI', label: 'Sintomas de insônia', short: 'ISI', min: 0, max: 28, higherIsBetter: false, factor: 1 },
  { code: 'MHCSF', label: 'Saúde mental positiva', short: 'MHC-SF', min: 0, max: 70, higherIsBetter: true, factor: 1 },
  { code: 'IQOL', label: 'Qualidade de vida universitária', short: 'IQoL', min: 0, max: 100, higherIsBetter: true, factor: 1, unavailable: true },
] as const;

type Instrument = (typeof INSTRUMENTS)[number];

const fmt = (v: number | null | undefined, d = 1) =>
  v == null || Number.isNaN(v) ? '—' : v.toLocaleString('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d });

/** Weighted mean of groups, ignoring protected groups (n < MIN_GROUP). */
export const weightedMean = (rows: { n: number; avg: number }[]) => {
  const ok = rows.filter((r) => r.n >= MIN_GROUP);
  const n = ok.reduce((s, r) => s + r.n, 0);
  if (!n) return { n: 0, avg: null as number | null };
  return { n, avg: ok.reduce((s, r) => s + r.avg * r.n, 0) / n };
};

const trendOf = (inst: Instrument, delta: number | null) => {
  if (delta == null || Math.abs(delta) < 0.5) return { label: 'Estável', cls: 'bg-muted text-muted-foreground' };
  const good = inst.higherIsBetter ? delta > 0 : delta < 0;
  return good
    ? { label: 'Favorável', cls: 'bg-primary/10 text-primary' }
    : { label: 'Desfavorável', cls: 'bg-destructive/10 text-destructive' };
};

const Sparkline = ({ values, labels, tone }: { values: (number | null)[]; labels: string[]; tone: 'good' | 'bad' | 'flat' }) => {
  const pts = values.map((v, i) => ({ v, i })).filter((p) => p.v != null) as { v: number; i: number }[];
  if (pts.length < 2) return <span className="text-xs text-muted-foreground">—</span>;
  const W = 132, H = 56;
  const lo = Math.min(...pts.map((p) => p.v)), hi = Math.max(...pts.map((p) => p.v));
  const pad = (hi - lo || 1) * 0.25;
  const y = (v: number) => 18 + (1 - (v - (lo - pad)) / (hi - lo + 2 * pad || 1)) * (H - 30);
  const x = (i: number) => 16 + i * ((W - 32) / Math.max(values.length - 1, 1));
  const color = tone === 'good' ? 'hsl(var(--primary))' : tone === 'bad' ? 'hsl(var(--destructive))' : 'hsl(var(--muted-foreground))';
  const id = `sp-${Math.random().toString(36).slice(2, 8)}`;
  const line = pts.map((p) => `${x(p.i)},${y(p.v)}`).join(' ');
  const last = pts[pts.length - 1];
  return (
    <svg width={W} height={H} aria-hidden>
      <defs><linearGradient id={id} x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity="0.35" /><stop offset="100%" stopColor={color} stopOpacity="0" /></linearGradient></defs>
      <polygon fill={`url(#${id})`} points={`${x(pts[0].i)},${H - 10} ${line} ${x(last.i)},${H - 10}`} />
      <polyline fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" points={line} />
      {pts.map((p) => <circle key={p.i} cx={x(p.i)} cy={y(p.v)} r={p === last ? 4.5 : 2.5} fill={p === last ? color : 'hsl(var(--background))'} stroke={color} strokeWidth="2" />)}
      {pts.map((p) => <text key={`v${p.i}`} x={x(p.i)} y={y(p.v) - 7} fontSize="9" fontWeight={p === last ? 700 : 600} textAnchor="middle" fill={p === last ? color : 'hsl(var(--foreground))'}>{fmt(p.v)}</text>)}
      {labels.map((l, i) => <text key={l} x={x(i)} y={H - 1} fontSize="8" textAnchor="middle" fill="hsl(var(--muted-foreground))">{l.slice(2)}</text>)}
    </svg>
  );
};

const ScalePosition = ({ inst, value }: { inst: Instrument; value: number | null }) => {
  const pct = value == null ? 0 : Math.max(0, Math.min(100, ((value - inst.min) / (inst.max - inst.min)) * 100));
  const grad = inst.higherIsBetter
    ? 'linear-gradient(90deg, hsl(var(--destructive) / .55), hsl(var(--chart-4, var(--accent)) / .5), hsl(var(--primary) / .75))'
    : 'linear-gradient(90deg, hsl(var(--primary) / .75), hsl(var(--chart-4, var(--accent)) / .5), hsl(var(--destructive) / .55))';
  return (
    <div className="w-48">
      <div className="relative h-2.5 rounded-full" style={{ background: grad }}>
        {value != null && (
          <div className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-background bg-foreground shadow-md" style={{ left: `${pct}%` }} />
        )}
      </div>
      <div className="mt-1.5 flex justify-between text-[10px] text-muted-foreground">
        <span>{inst.min} · {inst.higherIsBetter ? 'menor bem-estar' : 'menos sintomas'}</span>
        <span>{inst.higherIsBetter ? 'maior' : 'mais'} · {inst.max}</span>
      </div>
    </div>
  );
};

const TrendPill = ({ inst, delta, unavailable }: { inst: Instrument; delta: number | null; unavailable?: boolean }) => {
  if (unavailable) return <span className="inline-flex rounded-full bg-muted px-2.5 py-1 text-[11px] text-muted-foreground">Sem dados</span>;
  const t = trendOf(inst, delta);
  const Arrow = delta == null || t.label === 'Estável' ? Minus : delta > 0 ? ArrowUpRight : ArrowDownRight;
  return (
    <div className="flex flex-col items-start gap-1">
      <span className="text-sm font-semibold tabular-nums">{delta == null ? '—' : `${delta >= 0 ? '+' : '−'}${fmt(Math.abs(delta))} pts`}</span>
      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium ${t.cls}`}><Arrow className="h-3 w-3" />{t.label}</span>
    </div>
  );
};

export default function InstitutionComparator() {
  const { tenant } = useTenant();
  const [unitFilter, setUnitFilter] = useState('all');
  const [mapScale, setMapScale] = useState<string>('WHO5');
  const [semester, setSemester] = useState<string | null>(null);
  const [compareA, setCompareA] = useState<string | null>(null);
  const [compareB, setCompareB] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [view, setView] = useState<'overview' | 'integrated' | 'journey' | 'appointments' | 'diary' | 'contents' | 'ned' | 'permanence'>(() => (new URLSearchParams(window.location.search).get('leitura') === 'jornada' ? 'journey' : new URLSearchParams(window.location.search).get('leitura') === 'atendimentos' ? 'appointments' : new URLSearchParams(window.location.search).get('leitura') === 'diario' ? 'diary' : new URLSearchParams(window.location.search).get('leitura') === 'conteudos' ? 'contents' : new URLSearchParams(window.location.search).get('leitura') === 'ned' ? 'ned' : new URLSearchParams(window.location.search).get('leitura') === 'permanencia' ? 'permanence' : 'overview'));
  const [lineScale, setLineScale] = useState<string>('WHO5');

  const changeView = (next: 'overview' | 'integrated' | 'journey' | 'appointments' | 'diary' | 'contents' | 'ned' | 'permanence') => {
    setView(next);
    window.scrollTo(0, 0);
  };


  const { userInstitutions, isLoading: instLoading } = useInstitutionAccess();
  const instQ = { isLoading: instLoading, data: userInstitutions[0] as any };
  const institutionId = instQ.data?.institution_id;

  const dataQ = useQuery({
    queryKey: ['comparator', institutionId],
    enabled: !!institutionId,
    queryFn: async () => {
      const { data, error } = await (supabase as any).rpc('get_institution_comparator', { p_institution_id: institutionId });
      if (error) throw error;
      return data as Payload;
    },
  });

  const d = dataQ.data;
  const semesters = useMemo(() => {
    const s = new Set<string>();
    d?.scales.forEach((r) => s.add(r.sem));
    d?.diary.forEach((r) => s.add(r.sem));
    return [...s].sort().slice(-3);
  }, [d]);
  const current = semester ?? semesters[semesters.length - 1] ?? null;
  const previous = current ? semesters[semesters.indexOf(current) - 1] ?? null : null;
  const units = useMemo(() => Object.keys(d?.units_population ?? {}).sort(), [d]);
  const effUnit = view === 'integrated' ? 'all' : unitFilter;
  const inUnit = (r: { unit: string }) => effUnit === 'all' || r.unit === effUnit;

  const stat = (code: string, sem: string | null, filter: (r: ScaleRow) => boolean = () => true) => {
    if (!d || !sem) return { n: 0, avg: null as number | null };
    const inst = INSTRUMENTS.find((i) => i.code === code)!;
    const m = weightedMean(d.scales.filter((r) => r.scale_code === code && r.sem === sem && inUnit(r) && filter(r)));
    return { n: m.n, avg: m.avg == null ? null : m.avg * inst.factor };
  };

  const statAll = (code: string, sem: string | null, filter: (r: ScaleRow) => boolean = () => true) => {
    if (!d || !sem) return { n: 0, avg: null as number | null };
    const inst = INSTRUMENTS.find((i) => i.code === code)!;
    const m = weightedMean(d.scales.filter((r) => r.scale_code === code && r.sem === sem && filter(r)));
    return { n: m.n, avg: m.avg == null ? null : m.avg * inst.factor };
  };

  const population = effUnit === 'all' ? d?.population ?? 0 : d?.units_population[unitFilter] ?? 0;
  const who = stat('WHO5', current), whoPrev = stat('WHO5', previous);
  const coverage = population ? Math.round((who.n / population) * 100) : 0;
  const coveragePrev = population ? Math.round((whoPrev.n / population) * 100) : 0;
  const diaryNow = (d?.diary ?? []).filter((r) => r.sem === current && inUnit(r)).reduce((s, r) => s + r.participants, 0);
  const anyScale = (d?.any_scale ?? []).filter((r) => r.sem === current && inUnit(r)).reduce((m, r) => m + r.n, 0);

  const courses = useMemo(() => [...new Set((d?.scales ?? []).map((r) => r.course))].sort(), [d]);

  const backTo = buildTenantPath(tenant?.slug, '/portal-institucional');
  const recortes = [...units.map((u) => `unit:${u}`), ...courses.map((c) => `course:${c}`)];
  const recLabel = (k: string) => k.split(':').slice(1).join(':');
  const recFilter = (k: string | null) => (r: ScaleRow) =>
    !k ? true : k.startsWith('unit:') ? r.unit === recLabel(k) : r.course === recLabel(k);
  const a = compareA ?? recortes[0] ?? null;
  const b = compareB ?? recortes[1] ?? null;

  return (
    <>
      <div className="comparator-page min-h-screen flex w-full bg-muted/30">
        <aside className={`sticky top-0 flex h-screen shrink-0 flex-col border-r bg-background transition-all ${collapsed ? 'w-16' : 'w-60'}`}>
          <div className="flex items-center gap-2 border-b px-3 py-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground"><BarChart3 className="h-4 w-4" /></div>
            {!collapsed && (
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Comparador</p>
                <p className="truncate text-sm font-semibold">{instQ.data?.educational_institutions?.name ?? 'Instituição'}</p>
              </div>
            )}
          </div>
          <nav className="flex-1 space-y-1 p-2">
            {!collapsed && <p className="px-2 pb-1 pt-2 text-xs text-muted-foreground">Leituras</p>}
            {([['overview', 'Visão Geral', LayoutDashboard], ['integrated', 'Análise Integrada', GitCompare], ['ned', 'NED Nacional', Network], ['journey', 'Jornada de cuidado', RouteIcon], ['appointments', 'Atendimentos', CalendarDays], ['diary', 'Diário emocional', NotebookPen], ['contents', 'Conteúdos e práticas', PlayCircle], ['permanence', 'Radar de Permanência', Radar]] as const).map(([k, l, I]) => (
              <button key={k} onClick={() => changeView(k)} title={l}
                className={`flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-sm transition-colors ${view === k ? 'bg-primary/10 font-medium text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'} ${collapsed ? 'justify-center' : ''}`}>
                <I className="h-4 w-4 shrink-0" />{!collapsed && <span className="flex-1 text-left">{l}</span>}{!collapsed && (k === 'journey' || k === 'appointments' || k === 'diary' || k === 'contents' || k === 'ned' || k === 'permanence') && <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">Nova</span>}
              </button>
            ))}
            {!collapsed && ([[ListChecks, 'Ações e acompanhamento']] as const).map(([I, l]) => (
              <div key={l} aria-disabled className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-sm text-muted-foreground/70">
                <I className="h-4 w-4 shrink-0" /><span className="flex-1">{l}</span>
                <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold">Em breve</span>
              </div>
            ))}
          </nav>
          {!collapsed && (
            <div className="mx-2 mb-2 space-y-1 rounded-2xl bg-accent/60 p-3">
              <div className="flex items-center gap-2 text-[13px] font-semibold text-primary"><ShieldCheck className="h-4 w-4" />Leitura protegida</div>
              <p className="text-xs text-muted-foreground">A instituição vê tendências coletivas, nunca relatos pessoais. Grupos com menos de 10 pessoas ficam ocultos.</p>
            </div>
          )}
          <div className="border-t p-2">
            <Link to={backTo} title="Voltar ao Portal Institucional"
              className={`flex items-center gap-2 rounded-md px-2.5 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground ${collapsed ? 'justify-center' : ''}`}>
              <ArrowLeft className="h-4 w-4 shrink-0" />{!collapsed && <span>Voltar ao Portal Institucional</span>}
            </Link>
          </div>
        </aside>

        <div className="flex flex-1 flex-col min-w-0">
          <header className="sticky top-0 z-10 flex h-14 items-center gap-3 border-b bg-background/90 px-4 backdrop-blur">
            <Button variant="ghost" size="icon" onClick={() => setCollapsed((c) => !c)} aria-label="Recolher menu"><PanelLeft className="h-4 w-4" /></Button>
            <span className="text-sm text-muted-foreground">{view === 'integrated' ? 'Análise integrada' : `${view === 'journey' ? 'Jornada de cuidado' : view === 'appointments' ? 'Atendimentos' : view === 'diary' ? 'Diário emocional' : view === 'contents' ? 'Conteúdos e práticas' : view === 'ned' ? 'NED Nacional' : view === 'permanence' ? 'Radar de Permanência' : 'Visão geral'} · ${unitFilter === 'all' ? 'Toda a instituição' : unitFilter}`}</span>
            <Button asChild variant="outline" size="sm" className="ml-auto"><Link to={backTo}><ArrowLeft className="h-4 w-4 mr-1" />Portal Institucional</Link></Button>
          </header>
          <main className="flex-1 space-y-6 p-4 md:p-8">
            <div className="flex flex-wrap items-end justify-between gap-4">
            <div className={view !== 'integrated' ? 'sr-only' : ''}>
              <h1 className="text-3xl font-bold tracking-tight">{view === 'overview' ? 'Como está o bem-estar da sua população' : 'Análise integrada entre recortes'}</h1>
              <p className="mt-1 max-w-2xl text-muted-foreground">
                Leitura coletiva e descritiva da coleta {current ?? '—'}, comparada à coleta anterior. Nenhum resultado individual é exibido.
              </p>
            </div>
              <div className="flex flex-wrap items-center gap-2">
                {view !== 'integrated' && view !== 'ned' && view !== 'permanence' && (
                  <Select value={unitFilter} onValueChange={setUnitFilter}>
                    <SelectTrigger className="w-52"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toda a instituição</SelectItem>
                      {units.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}
                <div className="flex rounded-md border bg-background p-0.5">
                  {semesters.map((sm) => (
                    <button key={sm} onClick={() => setSemester(sm)}
                      className={`rounded px-3 py-1.5 text-sm ${sm === current ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}>{sm}</button>
                  ))}
                </div>
              </div>
            </div>

        {dataQ.isLoading || instQ.isLoading ? (
          <LogoLoader className="min-h-[40vh]" />
        ) : dataQ.error ? (
          <Card><CardContent className="py-10 text-center text-muted-foreground">Não foi possível carregar o comparador.</CardContent></Card>
        ) : view === 'permanence' ? (
            <PermanenceView institutionId={institutionId} semester={current} />
        ) : view === 'ned' ? (
            <NedView institutionId={institutionId} semester={current} />
        ) : view === 'contents' ? (
            <ContentsView institutionId={institutionId} semester={current} unitFilter={unitFilter} />
        ) : view === 'diary' ? (
            <DiaryView institutionId={institutionId} semester={current} unitFilter={unitFilter} />
        ) : view === 'appointments' ? (
            <AppointmentsView institutionId={institutionId} semester={current} unitFilter={unitFilter} />
        ) : view === 'journey' ? (
            <JourneyView institutionId={institutionId} semester={current} unitFilter={unitFilter} />
        ) : view === 'overview' ? (
            <OverviewView instruments={INSTRUMENTS as any} semesters={semesters} current={current} previous={previous}
              unitLabel={unitFilter === 'all' ? 'Toda a instituição' : unitFilter} units={units} courses={courses}
              population={population} activated={unitFilter === 'all' ? d?.activated ?? 0 : null} diaryNow={diaryNow} anyScale={anyScale}
              stat={stat as any} statAll={statAll as any}
              onOpenIntegrated={(code) => { if (code) setLineScale(code); changeView('integrated'); }} />
        ) : (
            <IntegratedAnalysis instruments={INSTRUMENTS} semesters={semesters} current={current} setSemester={setSemester}
              units={units} courses={courses} population={d?.population ?? 0} unitsPopulation={d?.units_population ?? {}} unitCoursePopulation={d?.unit_course_population ?? []}
              scale={lineScale} setScale={setLineScale} stat={stat} diary={d?.diary ?? []} />
        )}
          </main>
        </div>
      </div>
    </>
  );
}

const Kpi = ({ icon: Icon, title, value, unit, hint, badge, progress }: { icon: any; title: string; value: string; unit?: string; hint: string; badge?: string; progress?: number }) => (
  <Card className="relative overflow-hidden">
    <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary to-primary/30" />
    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
      <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      <div className="rounded-lg bg-primary/10 p-2"><Icon className="h-4 w-4 text-primary" /></div>
    </CardHeader>
    <CardContent className="space-y-2">
      <div className="flex items-baseline gap-2"><span className="text-4xl font-bold tracking-tight tabular-nums">{value}</span>{unit && <span className="text-sm text-muted-foreground">{unit}</span>}{badge && <Badge className="bg-primary/10 text-primary hover:bg-primary/10">{badge}</Badge>}</div>
      {progress != null && <div className="h-1.5 rounded-full bg-muted"><div className="h-1.5 rounded-full bg-primary" style={{ width: `${Math.min(100, progress)}%` }} /></div>}
      <p className="text-xs text-muted-foreground">{hint}</p>
    </CardContent>
  </Card>
);


const RecSelect = ({ value, onChange, options, label }: { value: string | null; onChange: (v: string) => void; options: string[]; label: (k: string) => string }) => (
  <Select value={value ?? undefined} onValueChange={onChange}>
    <SelectTrigger className="w-56"><SelectValue placeholder="Escolha um recorte" /></SelectTrigger>
    <SelectContent>{options.map((o) => <SelectItem key={o} value={o}>{o.startsWith('unit:') ? 'Unidade · ' : 'Curso · '}{label(o)}</SelectItem>)}</SelectContent>
  </Select>
);

const HeatMap = ({ inst, units, courses, stat, network }: {
  inst: Instrument; units: string[]; courses: string[]; network: number | null;
  stat: (f: (r: ScaleRow) => boolean) => { n: number; avg: number | null };
}) => {
  const span = inst.max - inst.min || 1;
  const cell = (s: { n: number; avg: number | null }) => {
    if (s.avg == null) return { style: { backgroundImage: 'repeating-linear-gradient(45deg, hsl(var(--muted)), hsl(var(--muted)) 4px, hsl(var(--background)) 4px, hsl(var(--background)) 8px)' }, text: 'n<10' };
    const diff = network == null ? 0 : s.avg - network;
    const good = inst.higherIsBetter ? diff > 0 : diff < 0;
    const k = Math.min(1, Math.abs(diff) / (span * 0.08));
    const tok = good ? '--primary' : '--destructive';
    return { style: { background: `hsl(var(${tok}) / ${0.08 + k * 0.5})` }, text: fmt(s.avg) };
  };
  return (
    <div className="space-y-3">
      <table className="w-full text-sm border-separate border-spacing-1.5">
        <thead><tr><th />{courses.map((c) => <th key={c} className="text-xs font-medium text-muted-foreground">{c}</th>)}<th className="text-xs">Total</th></tr></thead>
        <tbody>
          {units.map((u) => (
            <tr key={u}>
              <td className="text-xs font-semibold pr-2 whitespace-nowrap">{u}</td>
              {[...courses, '__total'].map((c) => {
                const s = stat((r) => r.unit === u && (c === '__total' || r.course === c));
                const v = cell(s);
                return (
                  <td key={c} style={v.style} className={`rounded-lg p-2.5 text-center transition-transform hover:scale-105 ${c === '__total' ? 'ring-1 ring-border' : ''}`}>
                    <div className="text-base font-bold tabular-nums">{v.text}</div>
                    <div className="text-[10px] text-muted-foreground">n={s.n}</div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        <span>Menos favorável</span>
        <div className="h-2.5 w-40 rounded-full" style={{ background: 'linear-gradient(90deg, hsl(var(--destructive) / .55), hsl(var(--muted)), hsl(var(--primary) / .55))' }} />
        <span>Mais favorável</span>
        <span className="ml-3 inline-block h-3 w-5 rounded" style={{ backgroundImage: 'repeating-linear-gradient(45deg, hsl(var(--muted)), hsl(var(--muted)) 3px, hsl(var(--background)) 3px, hsl(var(--background)) 6px)' }} />
        <span>Grupo protegido (n &lt; {MIN_GROUP})</span>
        <span className="ml-3 inline-flex items-center gap-1"><span className="rounded bg-muted px-1.5 py-0.5 font-semibold text-foreground">n</span>= número de estudantes que responderam à escala considerando a unidade. Média calculada sobre essas respostas.</span>
      </div>
    </div>
  );
};
