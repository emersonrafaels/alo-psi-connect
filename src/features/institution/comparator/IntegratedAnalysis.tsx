import { useState } from 'react';
import { Info, CalendarDays, ShieldCheck } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip, ReferenceArea, LabelList, BarChart, Bar } from 'recharts';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { SCALE_BANDS, bandOf, TONE_CLASS, TONE_BAR } from './scaleBands';

type Row = { sem: string; scale_code: string; unit: string; course: string; n: number; avg: number };
type Inst = { code: string; label: string; short: string; min: number; max: number; higherIsBetter: boolean };
type Stat = { n: number; avg: number | null };
type Filter = (r: Row) => boolean;

const fmt = (v: number | null | undefined, d = 1) => (v == null || Number.isNaN(v) ? '—' : v.toLocaleString('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d }));
const semMonth = (s: string) => (s.endsWith('.1') ? `jun/${s.slice(0, 4)}` : `nov/${s.slice(0, 4)}`);
const Hint = ({ t }: { t: string }) => (
  <Tooltip><TooltipTrigger asChild><Info className="inline h-3.5 w-3.5 cursor-help text-muted-foreground" /></TooltipTrigger><TooltipContent className="max-w-xs text-xs">{t}</TooltipContent></Tooltip>
);

type CompareMode = 'none' | 'unit' | 'course' | 'custom';

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
  const [mode, setMode] = useState<CompareMode>('none');
  const [customB, setCustomB] = useState<string>('');
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
  let fB: Filter | null = null, labelB = '';
  if (mode === 'unit') {
    const other = units.find((u) => u !== unit) ?? null;
    if (other) { fB = (r) => r.unit === other && (course === 'all' || r.course === course); labelB = `${course === 'all' ? 'Todos os cursos' : course} · ${other}`; }
  } else if (mode === 'course') {
    const other = courses.find((c) => c !== course) ?? null;
    if (other) { fB = (r) => r.course === other && (unit === 'all' || r.unit === unit); labelB = `${other} · ${unit === 'all' ? 'Toda a rede' : unit}`; }
  } else if (mode === 'custom' && customB) {
    const [k, v] = customB.split(':');
    fB = k === 'unit' ? (r) => r.unit === v : (r) => r.course === v; labelB = v;
  }

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

  const evo = semesters.map((s) => ({ sem: s, a: sA(inst.code, s).avg, b: fB ? stat(inst.code, s, fB).avg : null, rede: stat(inst.code, s).avg, cov: popA ? Math.round((sA(inst.code, s).n / popA) * 100) : 0 }));

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
            <Button variant="outline" size="sm" onClick={() => { setUnit('all'); setCourse('all'); setMode('none'); }}>Limpar</Button>
          </div>
          <div className="flex flex-wrap items-center gap-2 border-t pt-3">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-chart-2 text-xs font-bold text-primary-foreground">B</span>
            <span className="mr-2 text-sm font-semibold">Comparar com</span>
            {([['none', 'Sem comparação'], ['unit', 'Outra unidade'], ['course', 'Outro curso'], ['shift', 'Outro turno'], ['class', 'Outra turma'], ['custom', 'Personalizado']] as const).map(([k, l]) => {
              const dis = k === 'shift' || k === 'class';
              return <button key={k} disabled={dis} title={dis ? 'Em breve' : undefined} onClick={() => setMode(k as CompareMode)}
                className={`rounded-full border px-3 py-1 text-xs transition ${mode === k ? 'border-primary bg-primary/10 font-semibold text-primary' : 'text-muted-foreground hover:text-foreground'} disabled:cursor-not-allowed disabled:opacity-40`}>{l}</button>;
            })}
            {mode === 'custom' && (
              <Select value={customB} onValueChange={setCustomB}><SelectTrigger className="h-8 w-52"><SelectValue placeholder="Escolha o grupo B" /></SelectTrigger>
                <SelectContent>{units.map((u) => <SelectItem key={u} value={`unit:${u}`}>Unidade · {u}</SelectItem>)}{courses.map((c) => <SelectItem key={c} value={`course:${c}`}>Curso · {c}</SelectItem>)}</SelectContent></Select>
            )}
          </div>
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

          <Card><CardContent className="space-y-4 p-5">
            <div className="flex flex-wrap justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold">{inst.short} · {inst.label}</h3>
                <p className="text-xs text-muted-foreground">{SCALE_BANDS[inst.code]?.description}</p>
                <div className="mt-2 flex flex-wrap gap-2 text-[11px]">
                  <span className="rounded border px-2 py-0.5">Faixa {inst.min}–{inst.max}</span>
                  <span className="rounded border px-2 py-0.5">{inst.higherIsBetter ? '↑ maior é mais favorável' : '↓ menor é mais favorável'}</span>
                  <span className="rounded border px-2 py-0.5">Coleta semestral</span>
                </div>
              </div>
              <div className="text-right text-xs"><p className="text-muted-foreground">Coleta semestral</p><p className="font-semibold">Período em análise: {current}</p></div>
            </div>
            <div>
              <p className="mb-6 text-xs"><span className="font-semibold">Como interpretar os valores</span> <span className="text-muted-foreground">Faixas de referência usadas em rastreamento populacional — não são diagnóstico individual.</span></p>
              <div className="relative">
                {[{ v: a.avg, l: 'A', cls: 'bg-primary text-primary-foreground' }, { v: ref.avg, l: refLabel === 'B' ? 'B' : 'R', cls: 'bg-muted-foreground text-background' }].map((m) => m.v != null && (
                  <div key={m.l} className="absolute -top-6 -translate-x-1/2 flex flex-col items-center" style={{ left: `${pos(m.v)}%` }}>
                    <span className={`flex items-center gap-1 rounded-full px-1.5 text-[10px] font-bold ${m.cls}`}>{m.l} {fmt(m.v)}</span>
                    <span className="h-4 w-px bg-foreground/60" />
                  </div>
                ))}
                <div className="flex h-2.5 overflow-hidden rounded-full">
                  {(SCALE_BANDS[inst.code]?.bands ?? []).map((b) => <div key={b.label} style={{ width: `${((b.to - b.from + 1) / (span + 1)) * 100}%`, background: TONE_BAR[b.tone] }} />)}
                </div>
                <div className="mt-1 flex">
                  {(SCALE_BANDS[inst.code]?.bands ?? []).map((b) => <div key={b.label} style={{ width: `${((b.to - b.from + 1) / (span + 1)) * 100}%` }} className="text-[10px]"><p className="font-semibold">{b.label}</p><p className="text-muted-foreground">{b.from}–{b.to}</p></div>)}
                </div>
              </div>
              <p className="mt-2 text-xs"><b className="text-primary">A</b> ({labelA}) está na faixa {aBand ? <span className={`rounded px-1.5 font-semibold ${TONE_CLASS[aBand.tone]}`}>{aBand.label}</span> : '—'}{aBand && ` (${aBand.from}–${aBand.to})`}.</p>
              <p className="text-xs"><b>{fB ? `B (${labelB})` : 'Rede (média geral)'}</b> está na faixa {refBand ? <span className={`rounded px-1.5 font-semibold ${TONE_CLASS[refBand.tone]}`}>{refBand.label}</span> : '—'}{refBand && ` (${refBand.from}–${refBand.to})`}.</p>
            </div>
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
          <Card><CardContent className="space-y-5 p-5">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-primary">O que os números dizem · {current}</p>
              <span className="rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-semibold">{sizeLabel}</span>
            </div>
            <h3 className="text-2xl font-bold leading-snug">{headline}</h3>
            <p className="text-sm text-muted-foreground">Em {current}, A marcou {fmt(a.avg)} e {fB ? 'B' : 'a rede'} marcou {fmt(ref.avg)}{diff != null && ` — uma diferença de ${fmt(Math.abs(diff))} pontos`}.</p>
            <div className="relative pt-6 pb-6">
              <div className="h-2.5 rounded-full" style={{ background: 'linear-gradient(90deg, hsl(var(--destructive) / .35), hsl(var(--muted)), hsl(var(--primary) / .45))' }} />
              {a.avg != null && <Marker left={dirPos(a.avg)} label={`A · ${fmt(a.avg)}`} top cls="bg-primary" />}
              {ref.avg != null && <Marker left={dirPos(ref.avg)} label={`${fB ? 'B' : 'Rede'} · ${fmt(ref.avg)}`} cls="bg-muted-foreground" />}
              <div className="mt-6 flex justify-between text-[11px] font-semibold"><span className="text-destructive">← Pior · {inst.higherIsBetter ? inst.min : inst.max}</span><span className="text-primary">{inst.higherIsBetter ? inst.max : inst.min} · Melhor →</span></div>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              <MiniCard title="Tamanho da diferença" hint="Diferença entre A e a referência, relativa à amplitude da escala." value={sizeLabel}
                lines={[diff == null ? '—' : `${fmt(Math.abs(diff))} pontos de diferença, ou ${fmt(diffPct, 0)}% da escala.`]} />
              <MiniCard title="Tendência no tempo" hint="Mudança desde a primeira coleta disponível." value={a.avg != null && aFirst.avg != null ? (Math.abs(a.avg - aFirst.avg) < 0.5 ? 'Estável' : better(a.avg - aFirst.avg) > 0 ? 'Evolução' : 'Piora') : '—'}
                lines={[a.avg != null && aFirst.avg != null ? `A: ${better(a.avg - aFirst.avg) >= 0 ? 'melhorou' : 'piorou'} ${fmt(Math.abs(a.avg - aFirst.avg))} pontos desde ${first}.` : '—',
                  ref.avg != null && refFirst.avg != null ? `${fB ? 'B' : 'Rede'}: ${better(ref.avg - refFirst.avg) >= 0 ? 'melhorou' : 'piorou'} ${fmt(Math.abs(ref.avg - refFirst.avg))} pontos desde ${first}.` : '']} />
              <MiniCard title="Confiança na leitura" hint="Considera número de respostas e cobertura do grupo." value={conf(a.n, popA)}
                lines={[`A: ${a.n.toLocaleString('pt-BR')} respostas (${popA ? Math.round((a.n / popA) * 100) : 0}% do grupo).`, `${fB ? 'B' : 'Rede'}: ${ref.n.toLocaleString('pt-BR')} respostas.`]} />
            </div>
            <p className="flex gap-2 text-[11px] text-muted-foreground"><Info className="h-3.5 w-3.5 shrink-0" />A régua está orientada para que a direita seja sempre o lado mais favorável. As diferenças descrevem grupos, não pessoas, e não indicam causa.</p>
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
                    <div className="relative h-8">
                      <div className="absolute inset-x-0 top-1/2 h-px bg-border" />
                      {network != null && <div className="absolute top-0 h-8 w-px bg-foreground/30" style={{ left: `${mx(network)}%` }} />}
                      {vals.length > 1 && <div className="absolute top-1/2 h-1 -translate-y-1/2 rounded bg-muted-foreground/30" style={{ left: `${Math.min(...vals.map(mx))}%`, width: `${Math.abs(mx(Math.max(...vals)) - mx(Math.min(...vals)))}%` }} />}
                      {pts.map((p) => p.v != null && (
                        <button key={String(p.u)} title={`${p.u ?? 'Toda a rede'} · ${fmt(p.v)}`}
                          onClick={() => { if (p.u) setUnit(p.u); if (mapBy === 'course') setCourse(rk === '__all' ? 'all' : rk); }}
                          className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2" style={{ left: `${mx(p.v)}%` }}>
                          <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] font-semibold" style={{ color: unitColor(p.i) }}>{fmt(p.v)}</span>
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
              <table className="w-full text-sm"><thead className="text-left text-xs text-muted-foreground"><tr><th className="py-2">Coleta</th><th>A</th>{fB && <th>B</th>}<th>Rede</th><th>Cobertura A</th></tr></thead>
                <tbody>{evo.map((e) => <tr key={e.sem} className="border-t"><td className="py-2">{e.sem}</td><td className="font-semibold">{fmt(e.a)}</td>{fB && <td>{fmt(e.b)}</td>}<td>{fmt(e.rede)}</td><td>{e.cov}%</td></tr>)}</tbody></table>
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
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={evo} margin={{ top: 24, right: 24, left: 0, bottom: 0 }}>
                    <CartesianGrid stroke="hsl(var(--border))" vertical={false} />
                    {current && <ReferenceArea x1={current} x2={current} fill="hsl(var(--primary))" fillOpacity={0.08} />}
                    <XAxis dataKey="sem" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" padding={{ left: 40, right: 40 }} />
                    <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" domain={chartTab === 'cov' ? [0, 100] : ['auto', 'auto']} />
                    <RTooltip formatter={(v: any) => fmt(v)} contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
                    <Line type="linear" dataKey={chartTab === 'cov' ? 'cov' : 'a'} name="A" stroke="hsl(var(--primary))" strokeWidth={3} dot={{ r: 6, fill: 'hsl(var(--background))', strokeWidth: 3 }}
                      activeDot={{ r: 8, onClick: (_: any, p: any) => p?.payload?.sem && setSemester(p.payload.sem) }}>
                      <LabelList dataKey={chartTab === 'cov' ? 'cov' : 'a'} position="top" fontSize={11} fontWeight={700} fill="hsl(var(--primary))" formatter={(v: any) => (chartTab === 'cov' ? `${v}%` : fmt(v))} />
                    </Line>
                    {chartTab === 'evo' && fB && <Line type="linear" dataKey="b" name="B" stroke="hsl(var(--chart-2))" strokeWidth={2.5} dot={{ r: 5 }} />}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
            <p className="text-xs text-muted-foreground"><span className="font-semibold text-primary">— A · {labelA}</span>{fB && <> · <span className="font-semibold">— B · {labelB}</span></>} · Clique em um ponto para sincronizar o período.</p>
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

const MiniCard = ({ title, hint, value, lines }: { title: string; hint: string; value: string; lines: string[] }) => (
  <div className="rounded-xl bg-muted/50 p-4">
    <p className="text-xs text-muted-foreground">{title} <Hint t={hint} /></p>
    <p className="mt-1 text-xl font-bold text-primary">{value}</p>
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
