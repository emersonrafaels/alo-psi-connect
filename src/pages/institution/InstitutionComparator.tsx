import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Users, Activity, NotebookPen, ClipboardCheck, Info } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useInstitutionAccess } from '@/hooks/useInstitutionAccess';
import { useTenant } from '@/hooks/useTenant';
import { buildTenantPath } from '@/utils/tenantHelpers';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Header from '@/components/ui/header';
import Footer from '@/components/ui/footer';

type ScaleRow = { sem: string; scale_code: string; unit: string; course: string; n: number; avg: number };
type DiaryRow = { sem: string; unit: string; participants: number; avg_mood: number };
type Payload = { population: number; activated: number; units_population: Record<string, number>; scales: ScaleRow[]; diary: DiaryRow[] };

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

const Sparkline = ({ values }: { values: (number | null)[] }) => {
  const pts = values.map((v, i) => ({ v, i })).filter((p) => p.v != null) as { v: number; i: number }[];
  if (pts.length < 2) return <span className="text-xs text-muted-foreground">—</span>;
  const lo = Math.min(...pts.map((p) => p.v)), hi = Math.max(...pts.map((p) => p.v));
  const y = (v: number) => 20 - ((v - lo) / (hi - lo || 1)) * 16;
  const x = (i: number) => 4 + i * (52 / Math.max(values.length - 1, 1));
  return (
    <svg width="60" height="24" className="text-primary" aria-hidden>
      <polyline fill="none" stroke="currentColor" strokeWidth="1.5" points={pts.map((p) => `${x(p.i)},${y(p.v)}`).join(' ')} />
      {pts.map((p) => <circle key={p.i} cx={x(p.i)} cy={y(p.v)} r="2" fill="currentColor" />)}
    </svg>
  );
};

const ScalePosition = ({ inst, value }: { inst: Instrument; value: number | null }) => {
  const pct = value == null ? 0 : ((value - inst.min) / (inst.max - inst.min)) * 100;
  return (
    <div className="w-40">
      <div className="relative h-1.5 rounded-full bg-muted">
        {value != null && <div className="absolute -top-1 h-3.5 w-1 rounded bg-primary" style={{ left: `calc(${pct}% - 2px)` }} />}
      </div>
      <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
        <span>{inst.min}</span>
        <span>{inst.higherIsBetter ? 'menor bem-estar · maior' : 'menos sintomas · mais'}</span>
        <span>{inst.max}</span>
      </div>
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
  const inUnit = (r: { unit: string }) => unitFilter === 'all' || r.unit === unitFilter;

  const stat = (code: string, sem: string | null, filter: (r: ScaleRow) => boolean = () => true) => {
    if (!d || !sem) return { n: 0, avg: null as number | null };
    const inst = INSTRUMENTS.find((i) => i.code === code)!;
    const m = weightedMean(d.scales.filter((r) => r.scale_code === code && r.sem === sem && inUnit(r) && filter(r)));
    return { n: m.n, avg: m.avg == null ? null : m.avg * inst.factor };
  };

  const population = unitFilter === 'all' ? d?.population ?? 0 : d?.units_population[unitFilter] ?? 0;
  const who = stat('WHO5', current), whoPrev = stat('WHO5', previous);
  const coverage = population ? Math.round((who.n / population) * 100) : 0;
  const coveragePrev = population ? Math.round((whoPrev.n / population) * 100) : 0;
  const diaryNow = (d?.diary ?? []).filter((r) => r.sem === current && inUnit(r)).reduce((s, r) => s + r.participants, 0);
  const anyScale = (d?.scales ?? []).filter((r) => r.sem === current && inUnit(r)).reduce((m, r) => Math.max(m, r.n), 0);

  const courses = useMemo(() => [...new Set((d?.scales ?? []).map((r) => r.course))].sort(), [d]);

  const attention = useMemo(() => {
    if (!d || !current || !previous) return [];
    const out: { label: string; inst: Instrument; delta: number }[] = [];
    for (const inst of INSTRUMENTS) {
      if ('unavailable' in inst) continue;
      for (const c of courses) {
        const a = stat(inst.code, current, (r) => r.course === c);
        const b = stat(inst.code, previous, (r) => r.course === c);
        if (a.avg == null || b.avg == null) continue;
        const delta = a.avg - b.avg;
        if (trendOf(inst, delta).label === 'Desfavorável') out.push({ label: c, inst, delta });
      }
    }
    return out.sort((x, y) => Math.abs(y.delta) - Math.abs(x.delta)).slice(0, 4);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [d, current, previous, courses, unitFilter]);

  const backTo = buildTenantPath(tenant?.slug, '/portal-institucional');
  const recortes = [...units.map((u) => `unit:${u}`), ...courses.map((c) => `course:${c}`)];
  const recLabel = (k: string) => k.split(':').slice(1).join(':');
  const recFilter = (k: string | null) => (r: ScaleRow) =>
    !k ? true : k.startsWith('unit:') ? r.unit === recLabel(k) : r.course === recLabel(k);
  const a = compareA ?? recortes[0] ?? null;
  const b = compareB ?? recortes[1] ?? null;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 space-y-6">
        <Button asChild variant="ghost" size="sm"><Link to={backTo}><ArrowLeft className="h-4 w-4 mr-2" />Voltar ao Portal Institucional</Link></Button>

        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Comparador · {instQ.data?.educational_institutions?.name ?? 'Instituição'}</p>
            <h1 className="text-3xl font-bold">Como está o bem-estar da sua população</h1>
            <p className="text-muted-foreground max-w-2xl mt-1">
              Leitura coletiva e descritiva da coleta {current ?? '—'}, comparada à coleta anterior. Nenhum resultado individual é exibido.
            </p>
          </div>
          <div className="flex gap-2">
            <Select value={unitFilter} onValueChange={setUnitFilter}>
              <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toda a rede</SelectItem>
                {units.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
              </SelectContent>
            </Select>
            <div className="flex rounded-md border p-0.5">
              {semesters.map((s) => (
                <button key={s} onClick={() => setSemester(s)}
                  className={`px-3 py-1.5 text-sm rounded ${s === current ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}>{s}</button>
              ))}
            </div>
          </div>
        </div>

        {dataQ.isLoading || instQ.isLoading ? (
          <div className="grid gap-4 md:grid-cols-4">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-32" />)}</div>
        ) : dataQ.error ? (
          <Card><CardContent className="py-10 text-center text-muted-foreground">Não foi possível carregar o comparador.</CardContent></Card>
        ) : (
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList>
              <TabsTrigger value="overview">Visão Geral</TabsTrigger>
              <TabsTrigger value="integrated">Análise Integrada</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Kpi icon={Users} title="População no recorte" value={`${population.toLocaleString('pt-BR')}`} unit="estudantes"
                  hint={`${(d?.activated ?? 0).toLocaleString('pt-BR')} ativaram o acesso à plataforma`} />
                <Kpi icon={ClipboardCheck} title="Cobertura WHO-5" value={`${coverage}%`}
                  badge={previous ? `${coverage - coveragePrev >= 0 ? '+' : ''}${coverage - coveragePrev} p.p.` : undefined}
                  hint={`${who.n.toLocaleString('pt-BR')} respondentes em ${current ?? '—'}`} />
                <Kpi icon={NotebookPen} title="Diário emocional" value={diaryNow.toLocaleString('pt-BR')} unit="participantes"
                  hint={`${population ? Math.round((diaryNow / population) * 100) : 0}% dos estudantes`} />
                <Kpi icon={Activity} title="Responderam ao menos 1 escala" value={anyScale.toLocaleString('pt-BR')} unit="estudantes"
                  hint={`${population ? Math.round((anyScale / population) * 100) : 0}% da população`} />
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Indicadores por instrumento</CardTitle>
                  <CardDescription>Média do recorte em {current ?? '—'} · variação desde {previous ?? 'a coleta anterior'}. A cor indica se a mudança é favorável.</CardDescription>
                </CardHeader>
                <CardContent className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="text-left text-xs text-muted-foreground">
                      <tr><th className="py-2">Instrumento</th><th>Média</th><th>Posição na escala</th><th>Variação</th><th>3 coletas</th></tr>
                    </thead>
                    <tbody>
                      {INSTRUMENTS.map((inst) => {
                        const unavailable = 'unavailable' in inst;
                        const now = unavailable ? { n: 0, avg: 0 } : stat(inst.code, current);
                        const prev = unavailable ? { n: 0, avg: null } : stat(inst.code, previous);
                        const delta = now.avg != null && prev.avg != null ? now.avg - prev.avg : null;
                        const t = trendOf(inst, unavailable ? null : delta);
                        return (
                          <tr key={inst.code} className="border-t">
                            <td className="py-3">
                              <div className="font-medium">{inst.label}</div>
                              <div className="text-xs text-muted-foreground">{inst.short} · n={now.n.toLocaleString('pt-BR')}{unavailable && ' · ainda não disponível'}</div>
                            </td>
                            <td className="text-lg font-semibold">{fmt(now.avg)}</td>
                            <td><ScalePosition inst={inst} value={now.avg} /></td>
                            <td>
                              <div className="text-xs">{delta == null ? '—' : `${delta >= 0 ? '+' : '−'}${fmt(Math.abs(delta))} pts`}</div>
                              <span className={`text-[11px] px-2 py-0.5 rounded-full ${t.cls}`}>{unavailable ? 'Sem dados' : t.label}</span>
                            </td>
                            <td><Sparkline values={unavailable ? [] : semesters.map((s) => stat(inst.code, s).avg)} /></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  <p className="mt-3 flex items-center gap-1 text-xs text-muted-foreground"><Info className="h-3 w-3" />Instrumentos de rastreamento descrevem a população; não são diagnóstico. Escalas diferentes não são comparáveis entre si.</p>
                </CardContent>
              </Card>

              <div className="grid gap-6 lg:grid-cols-3">
                <Card className="lg:col-span-2">
                  <CardHeader className="flex flex-row items-start justify-between gap-2">
                    <div>
                      <CardTitle>Mapa de unidades e cursos</CardTitle>
                      <CardDescription>Cor relativa à média da rede. Grupos com menos de {MIN_GROUP} respondentes ficam protegidos.</CardDescription>
                    </div>
                    <Select value={mapScale} onValueChange={setMapScale}>
                      <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                      <SelectContent>{INSTRUMENTS.map((i) => <SelectItem key={i.code} value={i.code}>{i.short}</SelectItem>)}</SelectContent>
                    </Select>
                  </CardHeader>
                  <CardContent className="overflow-x-auto">
                    <HeatMap inst={INSTRUMENTS.find((i) => i.code === mapScale)!} units={unitFilter === 'all' ? units : [unitFilter]}
                      courses={courses} stat={(f) => ('unavailable' in INSTRUMENTS.find((i) => i.code === mapScale)! ? { n: 0, avg: null } : stat(mapScale, current, f))}
                      network={stat(mapScale, current).avg} />
                  </CardContent>
                </Card>

                <div className="space-y-6">
                  <Card>
                    <CardHeader><CardTitle>Pede atenção</CardTitle><CardDescription>Maiores mudanças desfavoráveis entre cursos.</CardDescription></CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      {attention.length === 0 ? <p className="text-muted-foreground">Nenhuma mudança desfavorável relevante neste recorte.</p> :
                        attention.map((x) => (
                          <div key={x.label + x.inst.code} className="flex justify-between rounded-md bg-destructive/5 p-2">
                            <span>{x.label} · {x.inst.short}</span>
                            <span className="text-destructive">{x.delta > 0 ? '+' : '−'}{fmt(Math.abs(x.delta))}</span>
                          </div>
                        ))}
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader><CardTitle>Participação</CardTitle><CardDescription>Quem chega à leitura · {current ?? '—'}</CardDescription></CardHeader>
                    <CardContent className="space-y-3">
                      {[
                        ['População', population],
                        ['Ativaram o acesso', unitFilter === 'all' ? d?.activated ?? 0 : null],
                        ['Responderam ao menos 1 escala', anyScale],
                        ['Responderam ao WHO-5', who.n],
                        ['Registraram no Diário', diaryNow],
                      ].filter(([, v]) => v != null).map(([l, v]) => {
                        const pct = population ? Math.round(((v as number) / population) * 100) : 0;
                        return (
                          <div key={l as string}>
                            <div className="flex justify-between text-xs"><span>{l}</span><span>{(v as number).toLocaleString('pt-BR')} · {pct}%</span></div>
                            <div className="h-2 rounded-full bg-muted"><div className="h-2 rounded-full bg-primary" style={{ width: `${pct}%` }} /></div>
                          </div>
                        );
                      })}
                      <p className="text-xs text-muted-foreground">Coberturas baixas reduzem a representatividade. Leia médias junto com a participação.</p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="integrated" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Análise integrada</CardTitle>
                  <CardDescription>Compare dois recortes (unidades ou cursos) em todos os instrumentos e ao longo das coletas.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <RecSelect value={a} onChange={setCompareA} options={recortes} label={recLabel} />
                    <span className="text-muted-foreground">vs</span>
                    <RecSelect value={b} onChange={setCompareB} options={recortes} label={recLabel} />
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="text-left text-xs text-muted-foreground">
                        <tr><th className="py-2">Instrumento</th>{semesters.map((s) => <th key={s} colSpan={2}>{s}</th>)}<th>Diferença atual</th></tr>
                        <tr><th />{semesters.map((s) => [<th key={s + 'a'}>{a ? recLabel(a) : '—'}</th>, <th key={s + 'b'}>{b ? recLabel(b) : '—'}</th>])}<th /></tr>
                      </thead>
                      <tbody>
                        {INSTRUMENTS.map((inst) => {
                          const un = 'unavailable' in inst;
                          const get = (k: string | null, s: string) => (un ? { n: 0, avg: 0 } : stat(inst.code, s, recFilter(k)));
                          const ca = current ? get(a, current) : null, cb = current ? get(b, current) : null;
                          const diff = ca?.avg != null && cb?.avg != null ? ca.avg - cb.avg : null;
                          return (
                            <tr key={inst.code} className="border-t">
                              <td className="py-3 font-medium">{inst.short}</td>
                              {semesters.map((s) => {
                                const x = get(a, s), y = get(b, s);
                                return [
                                  <td key={s + 'a'}>{fmt(x.avg)}<span className="block text-[10px] text-muted-foreground">n={x.n}</span></td>,
                                  <td key={s + 'b'}>{fmt(y.avg)}<span className="block text-[10px] text-muted-foreground">n={y.n}</span></td>,
                                ];
                              })}
                              <td>{diff == null || un ? '—' : <Badge variant="outline" className={trendOf(inst, diff).cls}>{diff >= 0 ? '+' : '−'}{fmt(Math.abs(diff))}</Badge>}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>Escalas × Diário emocional por unidade</CardTitle><CardDescription>Cruza bem-estar (WHO-5), estresse (PSS-10) e a participação/humor médio no Diário.</CardDescription></CardHeader>
                <CardContent className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="text-left text-xs text-muted-foreground"><tr><th className="py-2">Unidade</th><th>WHO-5</th><th>PSS-10</th><th>Participantes no Diário</th><th>Humor médio (1–5)</th></tr></thead>
                    <tbody>
                      {units.map((u) => {
                        const di = (d?.diary ?? []).find((r) => r.sem === current && r.unit === u);
                        const f = (r: ScaleRow) => r.unit === u;
                        return (
                          <tr key={u} className="border-t">
                            <td className="py-3 font-medium">{u}</td>
                            <td>{fmt(stat('WHO5', current, f).avg)}</td>
                            <td>{fmt(stat('PSS10', current, f).avg)}</td>
                            <td>{di && di.participants >= MIN_GROUP ? di.participants : 'Protegido'}</td>
                            <td>{di && di.participants >= MIN_GROUP ? fmt(di.avg_mood, 2) : '—'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </main>
      <Footer />
    </div>
  );
}

const Kpi = ({ icon: Icon, title, value, unit, hint, badge }: { icon: any; title: string; value: string; unit?: string; hint: string; badge?: string }) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
      <CardTitle className="text-sm font-medium">{title}</CardTitle><Icon className="h-4 w-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      <div className="flex items-baseline gap-2"><span className="text-3xl font-bold">{value}</span>{unit && <span className="text-sm text-muted-foreground">{unit}</span>}{badge && <Badge variant="secondary">{badge}</Badge>}</div>
      <p className="text-xs text-muted-foreground mt-1">{hint}</p>
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
  const cell = (s: { n: number; avg: number | null }) => {
    if (s.avg == null) return { cls: 'bg-muted text-muted-foreground', text: 'n<10' };
    const diff = network == null ? 0 : s.avg - network;
    const good = inst.higherIsBetter ? diff > 0 : diff < 0;
    const cls = Math.abs(diff) < 1 ? 'bg-secondary' : good ? 'bg-primary/15' : 'bg-destructive/15';
    return { cls, text: fmt(s.avg) };
  };
  return (
    <table className="w-full text-sm border-separate border-spacing-1">
      <thead><tr><th />{courses.map((c) => <th key={c} className="text-xs font-medium text-muted-foreground">{c}</th>)}<th className="text-xs">Total</th></tr></thead>
      <tbody>
        {units.map((u) => (
          <tr key={u}>
            <td className="text-xs font-medium pr-2">{u}</td>
            {[...courses, '__total'].map((c) => {
              const s = stat((r) => r.unit === u && (c === '__total' || r.course === c));
              const v = cell(s);
              return <td key={c} className={`rounded-md p-2 text-center ${v.cls}`}><div className="font-semibold">{v.text}</div><div className="text-[10px] text-muted-foreground">n={s.n}</div></td>;
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
};
