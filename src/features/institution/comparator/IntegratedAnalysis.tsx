import { useState } from 'react';
import { Info, CalendarDays, ShieldCheck } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip, ReferenceArea, LabelList, BarChart, Bar } from 'recharts';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { SCALE_BANDS, bandOf, TONE_CLASS, TONE_BAR, TONE_TEXT } from './scaleBands';

type Row = { sem: string; scale_code: string; unit: string; course: string; n: number; avg: number };
type Inst = { code: string; label: string; short: string; min: number; max: number; higherIsBetter: boolean };
type Stat = { n: number; avg: number | null };
type Filter = (r: Row) => boolean;

const fmt = (v: number | null | undefined, d = 1) => (v == null || Number.isNaN(v) ? '—' : v.toLocaleString('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d }));
const semMonth = (s: string) => (s.endsWith('.1') ? `jun/${s.slice(0, 4)}` : `nov/${s.slice(0, 4)}`);
const Hint = ({ t }: { t: string }) => (
  <Tooltip><TooltipTrigger asChild><Info className="inline h-3.5 w-3.5 cursor-help text-muted-foreground" /></TooltipTrigger><TooltipContent className="max-w-xs text-xs">{t}</TooltipContent></Tooltip>
);


export function IntegratedAnalysis(props: {
  instruments: readonly Inst[]; semesters: string[]; current: string | null; setSemester: (s: string) => void;
  units: string[]; courses: string[]; population: number; unitsPopulation: Record<string, number>;
  scale: string; setScale: (s: string) => void;
  stat: (code: string, sem: string | null, f?: Filter) => Stat;
  diary: { sem: string; unit: string; participants: number; avg_mood: number }[];
}) {
  const { instruments, semesters, current, setSemester, units, courses, stat, scale, setScale } = props;
  const [unit, setUnit] = useState('all');
  const [course, setCourse] = useState('all');
  const [groups, setGroups] = useState<{ unit: string; course: string }[]>([]);
  const [tab, setTab] = useState<'scales' | 'diary' | 'part'>('scales');
  const [mapBy, setMapBy] = useState<'course' | 'unit'>('course');
  const [chartTab, setChartTab] = useState<'evo' | 'dist' | 'cov'>('evo');
  const [asTable, setAsTable] = useState(false);

  const inst = instruments.find((i) => i.code === scale) ?? instruments[0];
  const unavailable = (i: Inst) => 'unavailable' in i;
  const prev = current ? semesters[semesters.indexOf(current) - 1] ?? null : null;
  const first = semesters[0] ?? null;

  const fA: Filter = (r) => (unit === 'all' || r.unit === unit) && (course === 'all' || r.course === course);
  const labelA = `${course === 'all' ? 'Todos os cursos' : course} · ${unit === 'all' ? 'Toda a rede' : unit}`;

  // Comparison group B
  const LETTERS = ['B', 'C', 'D', 'E', 'F'];
  const gColor = (i: number) => `hsl(var(--chart-${(i % 4) + 2}))`;
  const gLabel = (g: { unit: string; course: string }) => `${g.course === 'all' ? 'Todos os cursos' : g.course} · ${g.unit === 'all' ? 'Toda a rede' : g.unit}`;
  const gFilter = (g: { unit: string; course: string }): Filter => (r) => (g.unit === 'all' || r.unit === g.unit) && (g.course === 'all' || r.course === g.course);
  const gPop = (g: { unit: string }) => (g.unit === 'all' ? props.population : props.unitsPopulation[g.unit] ?? 0);
  const addGroup = (kind: 'unit' | 'course' | 'custom') => {
    if (groups.length >= LETTERS.length) return;
    const used = (k: 'unit' | 'course', v: string) => [unit, ...groups.map((g) => g.unit)].includes(v) && k === 'unit' || [course, ...groups.map((g) => g.course)].includes(v) && k === 'course';
    if (kind === 'unit') setGroups([...groups, { unit: units.find((u) => !used('unit', u)) ?? units[0] ?? 'all', course }]);
    else if (kind === 'course') setGroups([...groups, { unit, course: courses.find((c) => !used('course', c)) ?? courses[0] ?? 'all' }]);
    else setGroups([...groups, { unit: 'all', course: 'all' }]);
  };
  const updGroup = (i: number, patch: Partial<{ unit: string; course: string }>) => setGroups(groups.map((g, j) => (j === i ? { ...g, ...patch } : g)));
  const fB: Filter | null = groups[0] ? gFilter(groups[0]) : null;
  const labelB = groups[0] ? gLabel(groups[0]) : '';

  const sA = (code: string, s: string | null) => (unavailable(instruments.find((i) => i.code === code)!) ? { n: 0, avg: null } : stat(code, s, fA));
  const a = sA(inst.code, current), aPrev = sA(inst.code, prev), aFirst = sA(inst.code, first);
  const ref = fB ? stat(inst.code, current, fB) : unavailable(inst) ? { n: 0, avg: null } : stat(inst.code, current);
  const refLabel = fB ? 'B' : 'Rede';
  const refFirst = fB ? stat(inst.code, first, fB) : stat(inst.code, first);
  const popA = unit === 'all' ? props.population : props.unitsPopulation[unit] ?? 0;
  const span = inst.max - inst.min || 1;
  const better = (v: number) => (inst.higherIsBetter ? v : -v);

  const diff = a.avg != null && ref.avg != null ? a.avg - ref.avg : null;
  const diffPct = diff == null ? null : (Math.abs(diff) / span) * 100;
  const sizeLabel = diffPct == null ? '—' : diffPct < 2 ? 'Praticamente iguais' : diffPct < 5 ? 'Diferença pequena' : diffPct < 10 ? 'Diferença moderada' : 'Diferença grande';
  const conf = (n: number, pop: number) => (n < 10 ? 'Insuficiente' : n < 30 || (pop && n / pop < 0.2) ? 'Baixa' : n / Math.max(pop, 1) < 0.4 ? 'Moderada' : 'Alta');
  const aBand = bandOf(inst.code, a.avg), refBand = bandOf(inst.code, ref.avg);

  const headline = diff == null
    ? 'Ainda não há respostas suficientes para comparar este recorte.'
    : diffPct! < 2 ? `${labelA} e ${fB ? labelB : 'a média da rede'} estão em um patamar muito parecido.`
      : `${labelA} está ${better(diff) > 0 ? 'mais favorável' : 'menos favorável'} que ${fB ? labelB : 'a média da rede'}.`;

  const pos = (v: number | null) => (v == null ? 0 : Math.max(0, Math.min(100, ((v - inst.min) / span) * 100)));
  const dirPos = (v: number | null) => (inst.higherIsBetter ? pos(v) : 100 - pos(v));

  // Map data
  const rowsMap = mapBy === 'course' ? courses : units;
  const dotUnits = mapBy === 'course' ? units : [];
  const allVals: number[] = [];
  rowsMap.forEach((rk) => {
    (mapBy === 'course' ? dotUnits : [rk]).forEach((u) => {
      const v = stat(inst.code, current, (r) => r.unit === u && (mapBy === 'unit' || r.course === rk)).avg; if (v != null) allVals.push(v);
    });
  });
  const network = unavailable(inst) ? null : stat(inst.code, current).avg;
  if (network != null) allVals.push(network);
  const lo = allVals.length ? Math.floor(Math.min(...allVals) - 3) : inst.min, hi = allVals.length ? Math.ceil(Math.max(...allVals) + 3) : inst.max;
  const mx = (v: number) => { const p = ((v - lo) / (hi - lo || 1)) * 100; return inst.higherIsBetter ? p : 100 - p; };
  const unitColor = (i: number) => (i === 0 ? 'hsl(var(--primary))' : `hsl(var(--chart-${(i % 4) + 2}))`);

  const evo = semesters.map((s) => ({ sem: s, a: sA(inst.code, s).avg, ...Object.fromEntries(groups.map((g, i) => [`g${i}`, stat(inst.code, s, gFilter(g)).avg])), rede: stat(inst.code, s).avg, cov: popA ? Math.round((sA(inst.code, s).n / popA) * 100) : 0 }));

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <section className="rounded-2xl bg-card/60 p-4 ring-1 ring-border space-y-3">
        <p className="text-sm"><span className="font-semibold">Filtros</span> <span className="text-muted-foreground">Defina o recorte, a comparação e o período. Tudo abaixo segue esses filtros.</span></p>
        <Card><CardContent className="space-y-4 p-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex items-center gap-2 pr-2"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">A</span><div><p className="text-sm font-semibold">Recorte <Hint t="Grupo principal analisado em toda a página." /></p><p className="text-[11px] text-muted-foreground">Filtra toda a página</p></div></div>
            <Field label="Unidade"><Select value={unit} onValueChange={setUnit}><SelectTrigger className="w-44"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Toda a rede</SelectItem>{units.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent></Select></Field>
            <Field label="Curso"><Select value={course} onValueChange={setCourse}><SelectTrigger className="w-44"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Todos os cursos</SelectItem>{courses.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></Field>
            <Field label="Turno"><Select disabled value="all"><SelectTrigger className="w-40" title="Em breve"><SelectValue placeholder="Todos os turnos" /></SelectTrigger><SelectContent><SelectItem value="all">Todos os turnos</SelectItem></SelectContent></Select></Field>
            <Field label="Turma"><Select disabled value="all"><SelectTrigger className="w-40" title="Em breve"><SelectValue placeholder="Todas as turmas" /></SelectTrigger><SelectContent><SelectItem value="all">Todas as turmas</SelectItem></SelectContent></Select></Field>
            <div className="ml-auto text-right"><p className="text-sm font-bold">{popA.toLocaleString('pt-BR')} estudantes</p><p className="text-[11px] text-muted-foreground">{a.n.toLocaleString('pt-BR')} respondentes · {current ?? '—'}</p></div>
            <Button variant="outline" size="sm" onClick={() => { setUnit('all'); setCourse('all'); setGroups([]); }}>Limpar</Button>
          </div>
          <div className="flex flex-wrap items-center gap-2 border-t pt-3">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-chart-2 text-xs font-bold text-primary-foreground">B</span>
            <span className="mr-2 text-sm font-semibold">Comparar com</span>
            <button onClick={() => setGroups([])} className={`rounded-full border px-3 py-1 text-xs ${groups.length === 0 ? 'border-primary bg-primary/10 font-semibold text-primary' : 'text-muted-foreground hover:text-foreground'}`}>Sem comparação</button>
            {([['unit', 'Outra unidade'], ['course', 'Outro curso'], ['shift', 'Outro turno'], ['class', 'Outra turma'], ['custom', 'Personalizado']] as const).map(([k, l]) => {
              const dis = k === 'shift' || k === 'class' || groups.length >= LETTERS.length;
              return <button key={k} disabled={dis} title={k === 'shift' || k === 'class' ? 'Em breve' : undefined} onClick={() => addGroup(k as 'unit' | 'course' | 'custom')}
                className="rounded-full border px-3 py-1 text-xs text-muted-foreground transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-40">+ {l}</button>;
            })}
          </div>
          {groups.map((g, i) => {
            const pg = gPop(g), ng = stat(inst.code, current, gFilter(g)).n;
            return (
              <div key={i} className="flex flex-wrap items-end gap-3 rounded-xl border p-3" style={{ background: `hsl(var(--chart-${(i % 4) + 2}) / .07)`, borderColor: `hsl(var(--chart-${(i % 4) + 2}) / .35)` }}>
                <div className="flex items-center gap-2 pr-2"><span className="flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-primary-foreground" style={{ background: gColor(i) }}>{LETTERS[i]}</span><div><p className="text-sm font-semibold">Grupo comparado</p><p className="text-[11px] text-muted-foreground">ajuste qualquer nível</p></div></div>
                <Field label="Unidade"><Select value={g.unit} onValueChange={(v) => updGroup(i, { unit: v })}><SelectTrigger className="w-44 bg-background"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Toda a rede</SelectItem>{units.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent></Select></Field>
                <Field label="Curso"><Select value={g.course} onValueChange={(v) => updGroup(i, { course: v })}><SelectTrigger className="w-44 bg-background"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Todos os cursos</SelectItem>{courses.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></Field>
                <Field label="Turno"><Select disabled value="all"><SelectTrigger className="w-40 bg-background" title="Em breve"><SelectValue placeholder="Todos os turnos" /></SelectTrigger><SelectContent><SelectItem value="all">Todos os turnos</SelectItem></SelectContent></Select></Field>
                <Field label="Turma"><Select disabled value="all"><SelectTrigger className="w-40 bg-background" title="Em breve"><SelectValue placeholder="Todas as turmas" /></SelectTrigger><SelectContent><SelectItem value="all">Todas as turmas</SelectItem></SelectContent></Select></Field>
                <div className="ml-auto text-right"><p className="text-sm font-bold" style={{ color: gColor(i) }}>{pg.toLocaleString('pt-BR')} estudantes</p><p className="text-[11px] text-muted-foreground">{ng.toLocaleString('pt-BR')} respondentes · {current}</p></div>
                <Button variant="ghost" size="sm" onClick={() => setGroups(groups.filter((_, j) => j !== i))} aria-label={`Remover grupo ${LETTERS[i]}`}>Remover</Button>
              </div>
            );
          })}
          {groups.length > 0 && groups.length < LETTERS.length && <Button variant="outline" size="sm" onClick={() => addGroup('custom')}>+ Adicionar comparação</Button>}
        </CardContent></Card>
        <Card><CardContent className="flex flex-wrap items-center gap-3 p-3">
          <CalendarDays className="h-4 w-4 text-primary" /><div><p className="text-sm font-semibold">Coleta semestral</p><p className="text-[11px] text-muted-foreground">define os números abaixo</p></div>
          <div className="flex rounded-lg bg-muted p-1">
            {semesters.map((s) => (
              <button key={s} onClick={() => setSemester(s)} className={`rounded-md px-4 py-1 text-center text-xs ${current === s ? 'bg-background font-bold shadow-sm' : 'text-muted-foreground'}`}>
                {s}<span className="block text-[10px] font-normal text-muted-foreground">{semMonth(s)}</span></button>
            ))}
          </div>
        </CardContent></Card>
      </section>

      {/* Análise integrada */}
      <section className="rounded-2xl bg-card/60 p-4 ring-1 ring-border space-y-4">
        <p className="text-sm"><span className="font-semibold">Análise integrada</span> <span className="text-muted-foreground">Escolha o instrumento e veja como ele é medido.</span></p>
        <div className="inline-flex rounded-lg bg-background p-1 ring-1 ring-border">
          {([['scales', 'Escalas científicas'], ['diary', 'Diário emocional'], ['part', 'Participação']] as const).map(([k, l]) => (
            <button key={k} onClick={() => setTab(k)} className={`rounded-md px-3 py-1.5 text-xs ${tab === k ? 'bg-muted font-semibold' : 'text-muted-foreground'}`}>{l}</button>
          ))}
        </div>

        {tab === 'scales' && (<>
          <p className="text-xs text-muted-foreground">Instrumentos · média do <span className="font-semibold text-primary">grupo A</span> e variação no período</p>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
            {instruments.map((i) => {
              const v = sA(i.code, current).avg, p = sA(i.code, prev).avg;
              const dv = v != null && p != null ? v - p : null;
              const b = bandOf(i.code, v);
              const series = semesters.map((s) => sA(i.code, s).avg);
              return (
                <button key={i.code} onClick={() => setScale(i.code)} className={`rounded-xl border bg-card p-3 text-left transition hover:shadow-md ${scale === i.code ? 'border-primary ring-2 ring-primary/30' : ''}`}>
                  <div className="flex justify-between text-[11px]"><span className="font-bold text-primary">{i.short}</span>
                    {dv != null && <span className={`rounded px-1 font-semibold ${(i.higherIsBetter ? dv : -dv) > 0 ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>{dv >= 0 ? '+' : '−'}{fmt(Math.abs(dv))}</span>}</div>
                  <p className="mt-0.5 line-clamp-2 min-h-[2rem] text-xs font-medium">{i.label}</p>
                  <div className="mt-1 flex items-end justify-between gap-1">
                    <span className="text-xl font-bold tabular-nums">{fmt(v)}</span>
                    <MiniLine values={series} />
                  </div>
                  <div className="mt-1 flex items-center justify-between text-[10px] text-muted-foreground"><span>A · {current}</span>{b && <span className={`rounded px-1.5 py-0.5 font-semibold ${TONE_CLASS[b.tone]}`}>{b.label}</span>}</div>
                </button>
              );
            })}
          </div>

          <Card><CardContent className="space-y-5 p-6">
            <div className="flex flex-wrap justify-between gap-3 border-b pb-5">
              <div>
                <h3 className="text-xl font-bold">{inst.short} · {inst.label}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{SCALE_BANDS[inst.code]?.description}</p>
                <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
                  <span className="rounded-md bg-muted px-2.5 py-1">Faixa {inst.min}–{inst.max}</span>
                  <span className="rounded-md bg-muted px-2.5 py-1">{inst.higherIsBetter ? '↑ maior é mais favorável' : '↓ menor é mais favorável'}</span>
                  <span className="rounded-md bg-muted px-2.5 py-1">Coleta semestral · próxima {current ? (current.endsWith('.1') ? `${current.slice(0, 4)}.2` : `${Number(current.slice(0, 4)) + 1}.1`) : '—'}</span>
                </div>
              </div>
              <div className="space-y-1.5 text-right text-xs">
                <p className="text-muted-foreground">Coleta semestral <Hint t="Os instrumentos são aplicados uma vez por semestre." /></p>
                <p className="text-sm font-bold">Período em análise: {current}</p>
                <button disabled title="Em breve" className="inline-flex items-center gap-1 font-semibold text-primary disabled:cursor-not-allowed"><CalendarDays className="h-3.5 w-3.5" />Ver calendário de coletas</button>
              </div>
            </div>
            {(() => {
              const bands = SCALE_BANDS[inst.code]?.bands ?? [];
              const markers = [{ k: 'A', v: a.avg, color: 'hsl(var(--primary))' },
                ...(groups.length ? groups.map((g, i) => ({ k: LETTERS[i], v: stat(inst.code, current, gFilter(g)).avg, color: gColor(i) })) : [{ k: 'R', v: ref.avg, color: 'hsl(var(--muted-foreground))' }])]
                .filter((m) => m.v != null).map((m) => ({ ...m, p: pos(m.v) })).sort((x, y) => x.p - y.p);
              // spread labels
              const lab: number[] = [];
              markers.forEach((m, i) => { lab[i] = i && m.p - lab[i - 1] < 7 ? lab[i - 1] + 7 : m.p; });
              const rows = [{ k: 'A', color: 'hsl(var(--primary))', label: labelA, v: a.avg },
                ...(groups.length ? groups.map((g, i) => ({ k: LETTERS[i], color: gColor(i), label: gLabel(g), v: stat(inst.code, current, gFilter(g)).avg })) : [{ k: 'Rede', color: 'hsl(var(--foreground))', label: 'média geral', v: ref.avg }])];
              return (
                <div>
                  <p className="text-sm"><span className="font-bold">Como interpretar os valores</span> <span className="text-xs text-muted-foreground">Faixas de referência usadas em rastreamento populacional — não são diagnóstico individual.</span></p>
                  <div className="relative mt-12">
                    {markers.map((m, i) => (
                      <div key={m.k}>
                        <div className="absolute -top-9 flex -translate-x-1/2 items-center gap-1 whitespace-nowrap text-xs font-bold" style={{ left: `${Math.min(97, lab[i])}%`, color: m.color }}>
                          <span className="flex h-4 w-4 items-center justify-center rounded-full text-[9px] text-primary-foreground" style={{ background: m.color }}>{m.k === 'R' ? 'R' : m.k}</span>{fmt(m.v)}
                        </div>
                        <div className="absolute -top-4 h-7 w-px" style={{ left: `${m.p}%`, background: m.color }} />
                      </div>
                    ))}
                    <div className="flex h-3.5 gap-0.5 overflow-hidden rounded-full">
                      {bands.map((b) => <div key={b.label} style={{ width: `${((b.to - b.from + 1) / (span + 1)) * 100}%`, background: TONE_BAR[b.tone] }} />)}
                    </div>
                    <div className="mt-1.5 flex">
                      {bands.map((b) => <div key={b.label} style={{ width: `${((b.to - b.from + 1) / (span + 1)) * 100}%` }} className="text-[11px] leading-tight"><p className={`font-bold ${TONE_TEXT[b.tone]}`}>{b.label}</p><p className="text-muted-foreground">{b.from}–{b.to}</p></div>)}
                    </div>
                  </div>
                  <div className="mt-3 space-y-1.5">
                    {rows.map((r) => { const bd = bandOf(inst.code, r.v); return (
                      <p key={r.k} className="text-xs"><b style={{ color: r.color }}>{r.k}</b> ({r.label}) está na faixa {bd ? <span className={`rounded px-1.5 py-0.5 font-semibold ${TONE_CLASS[bd.tone]}`}>{bd.label}</span> : '—'}{bd && ` (${bd.from}–${bd.to})`}.</p>
                    ); })}
                  </div>
                </div>
              );
            })()}
          </CardContent></Card>
        </>)}

        {tab === 'diary' && (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {units.map((u) => {
              const di = props.diary.find((r) => r.sem === current && r.unit === u);
              return (
                <Card key={u}><CardContent className="space-y-2 p-4">
                  <p className="font-semibold">{u}</p>
                  <p className="text-3xl font-bold tabular-nums">{di ? fmt(di.avg_mood, 2) : '—'}<span className="text-sm font-normal text-muted-foreground"> / 5 humor médio</span></p>
                  <p className="text-xs text-muted-foreground">{di ? `${di.participants} participantes no Diário em ${current}` : 'Grupo protegido (n < 10)'}</p>
                </CardContent></Card>
              );
            })}
          </div>
        )}

        {tab === 'part' && (
          <Card><CardContent className="space-y-3 p-5">
            {instruments.filter((i) => !unavailable(i)).map((i) => {
              const n = sA(i.code, current).n, pct = popA ? Math.round((n / popA) * 100) : 0;
              return <div key={i.code}><div className="mb-1 flex justify-between text-xs"><span>{i.short} · {i.label}</span><span className="font-semibold">{n.toLocaleString('pt-BR')} · {pct}%</span></div><div className="h-2.5 rounded-full bg-muted"><div className="h-2.5 rounded-full bg-primary" style={{ width: `${pct}%` }} /></div></div>;
            })}
            <p className="text-xs text-muted-foreground">Cobertura do grupo A em {current}. Coberturas baixas reduzem a representatividade.</p>
          </CardContent></Card>
        )}
      </section>

      {/* O que os números dizem */}
      {tab === 'scales' && (
        <section className="rounded-2xl bg-card/60 p-4 ring-1 ring-border space-y-3">
          <p className="text-sm"><span className="font-semibold">O que os números dizem</span> <span className="text-muted-foreground">Resumo do comparativo em linguagem simples.</span></p>
          <Card><CardContent className="space-y-5 p-6">
            {(() => {
              const MEAN: Record<string, string> = { WHO5: 'bem-estar', PSS10: 'estresse', GAD7: 'sintomas de ansiedade', PHQ9: 'sintomas depressivos', ISI: 'sintomas de insônia', MHCSF: 'saúde mental positiva', IQOL: 'qualidade de vida' };
              const bK = groups.length ? 'B' : 'Rede';
              const bName = groups.length ? labelB : 'a média da rede';
              const bColor = groups.length ? gColor(0) : 'hsl(var(--muted-foreground))';
              const popB = groups.length ? gPop(groups[0]) : props.population;
              const aFav = diff != null && better(diff) > 0;
              const term = MEAN[inst.code] ?? 'resultado';
              const meaning = diff == null || diffPct! < 2 ? null : `${(aFav === inst.higherIsBetter) ? 'mais' : 'menos'} ${term} em A`;
              const head = diff == null ? 'Ainda não há respostas suficientes para comparar este recorte.'
                : diffPct! < 2 ? `${labelA} e ${bName} estão em um patamar muito parecido.`
                  : `${labelA} está em situação ${aFav ? 'mais' : 'menos'} favorável que ${bName}.`;
              const trend = (v: number | null, f: Stat) => v == null || f.avg == null ? null : v - f.avg;
              const tA = trend(a.avg, aFirst), tB = trend(ref.avg, refFirst);
              const tLabel = tA == null ? '—' : Math.abs(tA) < 0.5 ? 'Estável' : better(tA) > 0 ? 'Evolução' : 'Piora';
              const tLine = (k: string, t: number | null) => t == null ? '' : `${k}: ${Math.abs(t) < 0.5 ? 'ficou estável' : better(t) > 0 ? 'melhorou' : 'piorou'} ${fmt(Math.abs(t))} pontos desde ${first}.`;
              const cLine = (k: string, n: number, pop: number) => `${k}: ${n.toLocaleString('pt-BR')} respostas (${pop ? Math.round((n / pop) * 100) : 0}% do grupo) · confiança ${conf(n, pop).toLowerCase()}.`;
              const cA = conf(a.n, popA);
              return (<>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-primary">O que os números dizem · {current} <Hint t="Resumo automático da comparação entre A e a referência." /></p>
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">{sizeLabel}</span>
                </div>
                <h3 className="max-w-3xl text-2xl font-bold leading-snug">{head}</h3>
                <p className="text-sm text-muted-foreground">Em {current}, A marcou {fmt(a.avg)} e {bK} marcou {fmt(ref.avg)}.{meaning && ` Isso significa ${meaning}`}{diff != null && `, uma diferença de ${fmt(Math.abs(diff))} pontos (${fmt(diffPct, 0)}% da escala).`}</p>
                <div className="relative pb-2 pt-14">
                  <div className="h-2.5 rounded-full" style={{ background: 'linear-gradient(90deg, hsl(var(--accent) / .7), hsl(var(--muted) / .4), hsl(var(--primary) / .4))' }} />
                  {a.avg != null && (
                    <div className="absolute flex -translate-x-1/2 flex-col items-center" style={{ left: `${dirPos(a.avg)}%`, top: 8 }}>
                      <span className="text-[11px] font-bold text-primary">A · {fmt(a.avg)}</span>
                      <span className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground shadow">A</span>
                      <span className="h-5 border-l border-dashed border-primary" />
                    </div>
                  )}
                  {ref.avg != null && (
                    <div className="absolute flex -translate-x-1/2 flex-col items-center" style={{ left: `${dirPos(ref.avg)}%`, top: 44 }}>
                      <span className="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold text-primary-foreground shadow ring-2 ring-background" style={{ background: bColor }}>{bK === 'Rede' ? 'R' : 'B'}</span>
                      <span className="mt-0.5 text-[11px] font-bold" style={{ color: bColor }}>{bK} · {fmt(ref.avg)}</span>
                    </div>
                  )}
                  <div className="mt-10 flex justify-between text-xs font-bold">
                    <span className="text-accent-foreground">← Pior · {inst.higherIsBetter ? inst.min : inst.max}</span>
                    <span className="text-primary">{inst.higherIsBetter ? inst.max : inst.min} · Melhor →</span>
                  </div>
                </div>
                <div className="grid gap-3 md:grid-cols-3">
                  <MiniCard title="Tamanho da diferença" hint="Diferença entre A e a referência, relativa à amplitude da escala." value={sizeLabel}
                    lines={[diff == null ? '—' : `${fmt(Math.abs(diff))} pontos de diferença, ou ${fmt(diffPct, 0)}% da escala.`, diff == null ? '' : diffPct! < 2 ? 'Os grupos estão no mesmo nível.' : `${aFav ? 'A' : bK} está do lado mais favorável.`]} />
                  <MiniCard title="Tendência no tempo" hint="Mudança desde a primeira coleta disponível." value={tLabel} valueClass="text-foreground"
                    lines={[tLine('A', tA), tLine(bK, tB)]} />
                  <MiniCard title="Confiança na leitura" hint="Considera número de respostas e cobertura do grupo." value={cA}
                    lines={[cLine('A', a.n, popA), cLine(bK, ref.n, popB)]} />
                </div>
                <p className="flex gap-2 border-t pt-4 text-xs text-muted-foreground"><Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  Como ler: este indicador vai de {inst.min} a {inst.max} e quanto {inst.higherIsBetter ? 'maior' : 'menor'}, melhor ({inst.higherIsBetter ? 'mais' : 'menos'} {term}). A régua já está orientada para que a direita seja sempre o lado mais favorável. As diferenças descrevem grupos, não pessoas, e não indicam causa.</p>
              </>);
            })()}
          </CardContent></Card>
        </section>
      )}

      {/* Detalhamento */}
      {tab === 'scales' && (
        <section className="rounded-2xl bg-card/60 p-4 ring-1 ring-border space-y-4">
          <p className="text-sm"><span className="font-semibold">Detalhamento</span> <span className="text-muted-foreground">Mapa por grupo, detalhe do recorte e evolução no tempo.</span></p>
          <Card><CardContent className="space-y-4 p-5">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div><h3 className="font-bold">Mapa por {mapBy === 'course' ? 'curso' : 'unidade'} · {current}</h3><p className="text-xs text-muted-foreground">Mais à direita = mais favorável · rede {fmt(network)}</p></div>
              {mapBy === 'course' && <div className="flex flex-wrap gap-3 text-xs">{dotUnits.map((u, i) => <span key={u} className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full" style={{ background: unitColor(i) }} />{u}</span>)}<span className="flex items-center gap-1"><span className="h-3 w-px bg-foreground/50" />Rede</span></div>}
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-muted-foreground">Visualizar por</span>
              <div className="flex rounded-lg bg-muted p-0.5">
                {([['course', 'Cursos'], ['unit', 'Unidades'], ['shift', 'Turnos'], ['class', 'Turmas']] as const).map(([k, l]) => (
                  <button key={k} disabled={k === 'shift' || k === 'class'} title={k === 'shift' || k === 'class' ? 'Em breve' : undefined} onClick={() => setMapBy(k as 'course' | 'unit')}
                    className={`rounded-md px-3 py-1 ${mapBy === k ? 'bg-background font-semibold shadow-sm' : 'text-muted-foreground'} disabled:opacity-40`}>{l}</button>
                ))}
              </div>
            </div>
            <div className="space-y-1">
              {[...rowsMap, '__all'].map((rk) => {
                const pts = (mapBy === 'course' ? dotUnits : [rk === '__all' ? null : rk]).map((u, i) => {
                  const f: Filter = (r) => (u == null || r.unit === u) && (mapBy === 'unit' || rk === '__all' || r.course === rk);
                  return { u, i, v: unavailable(inst) ? null : stat(inst.code, current, f).avg };
                });
                const vals = pts.map((p) => p.v).filter((v): v is number => v != null);
                const gap = vals.length > 1 ? Math.max(...vals) - Math.min(...vals) : null;
                const isSel = (mapBy === 'course' ? course === rk || (rk === '__all' && course === 'all') : unit === rk || (rk === '__all' && unit === 'all'));
                return (
                  <div key={rk} className={`grid grid-cols-[140px_1fr_60px] items-center gap-3 rounded-lg px-2 py-2 ${isSel ? 'bg-primary/5' : ''}`}>
                    <button className={`text-left text-sm ${rk === '__all' ? 'font-bold' : ''} hover:text-primary`} onClick={() => (mapBy === 'course' ? setCourse(rk === '__all' ? 'all' : rk) : setUnit(rk === '__all' ? 'all' : rk))}>
                      {rk === '__all' ? (mapBy === 'course' ? 'Todos os cursos' : 'Toda a rede') : rk} ›</button>
                    <div className="relative h-14">
                      <div className="absolute inset-x-0 top-1/2 h-px bg-border" />
                      {network != null && <div className="absolute top-0 h-14 w-px bg-foreground/30" style={{ left: `${mx(network)}%` }} />}
                      {vals.length > 1 && <div className="absolute top-1/2 h-1 -translate-y-1/2 rounded bg-muted-foreground/30" style={{ left: `${Math.min(...vals.map(mx))}%`, width: `${Math.abs(mx(Math.max(...vals)) - mx(Math.min(...vals)))}%` }} />}
                      {pts.map((p) => p.v != null && (
                        <button key={String(p.u)} title={`${p.u ?? 'Toda a rede'} · ${fmt(p.v)}`}
                          onClick={() => { if (p.u) setUnit(p.u); if (mapBy === 'course') setCourse(rk === '__all' ? 'all' : rk); }}
                          className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2" style={{ left: `${mx(p.v)}%` }}>
                          <span className="absolute left-1/2 top-1 -translate-x-1/2 text-[10px] font-semibold" style={{ color: unitColor(p.i) }}>{fmt(p.v)}</span>
                          <span className="block h-4 w-4 rounded-full border-2 border-background shadow" style={{ background: mapBy === 'course' ? unitColor(p.i) : 'hsl(var(--primary))' }} />
                        </button>
                      ))}
                    </div>
                    <span className="text-right text-xs font-semibold tabular-nums text-muted-foreground">{gap == null ? '' : `${fmt(gap)}`}</span>
                  </div>
                );
              })}
            </div>
            <p className="text-[11px] text-muted-foreground">Clique em um ponto para analisar aquele grupo (vira o grupo A) · clique no nome da linha para detalhar. A última coluna mostra a distância entre unidades. Grupos com menos de 10 respondentes não aparecem.</p>
          </CardContent></Card>

          <Card className="border-t-4 border-t-primary"><CardContent className="space-y-4 p-5">
            <p className="flex items-center gap-2 text-xs"><span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">A</span>{unit === 'all' ? 'Toda a rede' : unit}</p>
            <h3 className="text-xl font-bold">{course === 'all' ? 'Todos os cursos' : course}</h3>
            <div className="flex flex-wrap items-baseline gap-2">
              <span className="text-4xl font-bold tabular-nums">{fmt(a.avg)}</span><span className="text-sm text-muted-foreground">/ {inst.max}</span>
              {a.avg != null && aPrev.avg != null && <span className="rounded bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">{a.avg - aPrev.avg >= 0 ? '+' : '−'}{fmt(Math.abs(a.avg - aPrev.avg))} vs {prev}</span>}
              {aBand && <span className={`rounded px-2 py-0.5 text-xs font-semibold ${TONE_CLASS[aBand.tone]}`}>Faixa: {aBand.label}</span>}
            </div>
            <div className="grid grid-cols-3 gap-2 rounded-lg bg-muted/50 p-3 text-sm">
              <div><p className="text-[11px] text-muted-foreground">Respondentes</p><p className="font-bold">{a.n.toLocaleString('pt-BR')}</p></div>
              <div><p className="text-[11px] text-muted-foreground">Cobertura <Hint t="Respondentes ÷ estudantes do recorte." /></p><p className="font-bold">{popA ? Math.round((a.n / popA) * 100) : 0}%</p></div>
              <div><p className="text-[11px] text-muted-foreground">vs rede <Hint t="Diferença em relação à média da rede." /></p><p className="font-bold">{a.avg != null && network != null ? `${a.avg - network >= 0 ? '+' : '−'}${fmt(Math.abs(a.avg - network))}` : '—'}</p></div>
            </div>
            <div>
              <p className="mb-2 text-xs font-semibold">Média por {mapBy === 'course' && course === 'all' ? 'curso' : 'unidade'} neste recorte</p>
              <div className="h-32">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={(course === 'all' ? courses.map((c) => ({ k: c, v: stat(inst.code, current, (r) => (unit === 'all' || r.unit === unit) && r.course === c).avg })) : units.map((u) => ({ k: u, v: stat(inst.code, current, (r) => r.unit === u && r.course === course).avg })))}>
                    <XAxis dataKey="k" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis hide domain={[inst.min, inst.max]} />
                    <Bar dataKey="v" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]}><LabelList dataKey="v" position="top" fontSize={10} formatter={(v: any) => fmt(v)} /></Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <Button variant="outline" className="w-full" disabled title="Em breve">Registrar investigação sobre este grupo</Button>
          </CardContent></Card>

          <Card><CardContent className="space-y-4 p-5">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div><h3 className="font-bold">Como evoluiu ao longo das coletas?</h3><p className="text-xs text-muted-foreground">{inst.short} · {inst.label} · média por semestre</p></div>
              <div className="flex rounded-lg bg-muted p-0.5 text-xs">
                {([['evo', 'Evolução'], ['dist', 'Distribuição'], ['cov', 'Cobertura']] as const).map(([k, l]) => (
                  <button key={k} onClick={() => setChartTab(k)} className={`rounded-md px-3 py-1 ${chartTab === k ? 'bg-background font-semibold shadow-sm' : 'text-muted-foreground'}`}>{l}</button>
                ))}
              </div>
              <Button variant="outline" size="sm" onClick={() => setAsTable((x) => !x)}>{asTable ? 'Ver gráfico' : 'Ver em tabela'}</Button>
            </div>
            {asTable ? (
              <table className="w-full text-sm"><thead className="text-left text-xs text-muted-foreground"><tr><th className="py-2">Coleta</th><th>A</th>{groups.map((_, i) => <th key={i}>{LETTERS[i]}</th>)}<th>Rede</th><th>Cobertura A</th></tr></thead>
                <tbody>{evo.map((e) => <tr key={e.sem} className="border-t"><td className="py-2">{e.sem}</td><td className="font-semibold">{fmt(e.a)}</td>{groups.map((_, i) => <td key={i}>{fmt((e as any)[`g${i}`])}</td>)}<td>{fmt(e.rede)}</td><td>{e.cov}%</td></tr>)}</tbody></table>
            ) : chartTab === 'dist' ? (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={units.map((u) => ({ k: u, v: stat(inst.code, current, (r) => r.unit === u && (course === 'all' || r.course === course)).avg }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="k" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" /><YAxis domain={[inst.min, inst.max]} tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                    <Bar dataKey="v" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]}><LabelList dataKey="v" position="top" fontSize={11} formatter={(v: any) => fmt(v)} /></Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={evo} margin={{ top: 36, right: 32, left: 0, bottom: 28 }}>
                    <CartesianGrid stroke="hsl(var(--border))" vertical={false} />
                    {current && <ReferenceArea x1={current} x2={current} fill="hsl(var(--primary))" fillOpacity={0.08} />}
                    <XAxis dataKey="sem" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" padding={{ left: 48, right: 48 }} />
                    <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" domain={chartTab === 'cov' ? [0, 100] : [(m: number) => m - (inst.max - inst.min) * 0.04, (m: number) => m + (inst.max - inst.min) * 0.04]} tickFormatter={(v: number) => fmt(v)} />
                    <RTooltip formatter={(v: any) => fmt(v)} contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
                    {(() => {
                      const keys = chartTab === 'cov' ? ['cov'] : ['a', ...groups.map((_, i) => `g${i}`)];
                      const pill = (key: string, color: string, suffix = '') => (p: any) => {
                        const { x, y, value, index } = p;
                        if (value == null || x == null || y == null) return null;
                        const row: any = (evo as any[])[index] ?? {};
                        const vals = keys.map((k) => ({ k, v: row[k] })).filter((o) => o.v != null).sort((m, n) => n.v - m.v);
                        const rank = vals.findIndex((o) => o.k === key);
                        const above = rank === 0;
                        const step = above ? 0 : rank - 1;
                        const txt = `${fmt(value)}${suffix}`;
                        const w = txt.length * 6.6 + 12;
                        const cy = above ? y - 20 : y + 20 + step * 20;
                        return (
                          <g pointerEvents="none">
                            <rect x={x - w / 2} y={cy - 9} width={w} height={18} rx={9} fill="hsl(var(--background))" stroke={color} strokeWidth={1.25} />
                            <text x={x} y={cy + 4} textAnchor="middle" fontSize={11} fontWeight={800} fill={color}>{txt}</text>
                          </g>
                        );
                      };
                      return [
                        <Line key="a" type="linear" dataKey={chartTab === 'cov' ? 'cov' : 'a'} name="A" stroke="hsl(var(--primary))" strokeWidth={3} dot={{ r: 6, fill: 'hsl(var(--background))', strokeWidth: 3 }} isAnimationActive={false}
                          activeDot={{ r: 8, onClick: (_: any, p: any) => p?.payload?.sem && setSemester(p.payload.sem) }}>
                          <LabelList dataKey={chartTab === 'cov' ? 'cov' : 'a'} content={pill(chartTab === 'cov' ? 'cov' : 'a', 'hsl(var(--primary))', chartTab === 'cov' ? '%' : '')} />
                        </Line>,
                        ...(chartTab === 'evo' ? groups.map((g, i) => <Line key={i} type="linear" dataKey={`g${i}`} name={LETTERS[i]} stroke={gColor(i)} strokeWidth={2.5} dot={{ r: 5, fill: 'hsl(var(--background))', strokeWidth: 2.5 }} isAnimationActive={false}><LabelList dataKey={`g${i}`} content={pill(`g${i}`, gColor(i))} /></Line>) : []),
                      ];
                    })()}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
            <p className="text-xs text-muted-foreground"><span className="font-semibold text-primary">— A · {labelA}</span>{groups.map((g, i) => <span key={i}> · <span className="font-semibold" style={{ color: gColor(i) }}>— {LETTERS[i]} · {gLabel(g)}</span></span>)} · Clique em um ponto para sincronizar o período.</p>
          </CardContent></Card>
          <p className="flex items-center gap-2 text-[11px] text-muted-foreground"><ShieldCheck className="h-3.5 w-3.5" />Grupos com menos de 10 respondentes não são exibidos. Diferenças são descritivas e não indicam causa. Escalas diferentes não são comparáveis entre si.</p>
        </section>
      )}
    </div>
  );
}

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div><p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>{children}</div>
);

const Marker = ({ left, label, top, cls }: { left: number; label: string; top?: boolean; cls: string }) => (
  <div className="absolute -translate-x-1/2 flex flex-col items-center" style={{ left: `${left}%`, top: top ? 0 : 14 }}>
    {top && <span className="mb-0.5 text-[10px] font-bold text-primary">{label}</span>}
    <span className={`h-4 w-4 rounded-full border-2 border-background shadow ${cls}`} />
    {!top && <span className="mt-0.5 text-[10px] font-semibold text-muted-foreground">{label}</span>}
  </div>
);

const MiniCard = ({ title, hint, value, lines, valueClass = 'text-primary' }: { title: string; hint: string; value: string; lines: string[]; valueClass?: string }) => (
  <div className="rounded-xl bg-muted/50 p-4">
    <p className="text-xs text-muted-foreground">{title} <Hint t={hint} /></p>
    <p className={`mt-1 text-xl font-bold ${valueClass}`}>{value}</p>
    {lines.filter(Boolean).map((l) => <p key={l} className="text-xs text-muted-foreground">{l}</p>)}
  </div>
);

const MiniLine = ({ values }: { values: (number | null)[] }) => {
  const pts = values.map((v, i) => ({ v, i })).filter((p) => p.v != null) as { v: number; i: number }[];
  if (pts.length < 2) return null;
  const W = 64, H = 26, lo = Math.min(...pts.map((p) => p.v)), hi = Math.max(...pts.map((p) => p.v));
  const x = (i: number) => 3 + i * ((W - 6) / Math.max(values.length - 1, 1));
  const y = (v: number) => 3 + (1 - (v - lo) / (hi - lo || 1)) * (H - 6);
  const last = pts[pts.length - 1];
  return (
    <svg width={W} height={H} aria-hidden>
      <polyline fill="none" stroke="hsl(var(--primary))" strokeWidth="1.8" points={pts.map((p) => `${x(p.i)},${y(p.v)}`).join(' ')} />
      <circle cx={x(last.i)} cy={y(last.v)} r="2.5" fill="hsl(var(--primary))" />
    </svg>
  );
};
