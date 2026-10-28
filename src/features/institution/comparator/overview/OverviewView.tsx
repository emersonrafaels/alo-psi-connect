import { useState, type ReactNode } from 'react';
import { ArrowRight, Maximize2, X, GitCompare, Route, CalendarDays, NotebookPen, PlayCircle, ListChecks } from 'lucide-react';
import { SCALE_BANDS, bandOf, TONE_BAR } from '../scaleBands';
import { buildChanges, relDistance, meanDistance, distanceTone, radarPoint, type Stat } from './overviewLogic';

type Inst = { code: string; label: string; short: string; min: number; max: number; higherIsBetter: boolean; unavailable?: boolean };
type Filter = (r: { unit: string; course: string }) => boolean;

export type OverviewProps = {
  instruments: readonly Inst[];
  semesters: string[];
  current: string | null;
  previous: string | null;
  unitLabel: string;
  units: string[];
  courses: string[];
  population: number;
  activated: number | null;
  diaryNow: number;
  anyScale: number;
  /** Respects the selected unit. */
  stat: (code: string, sem: string | null, f?: Filter) => Stat;
  /** Always the whole institution. */
  statAll: (code: string, sem: string | null, f?: Filter) => Stat;
  onOpenIntegrated: (code?: string) => void;
};

const fmt = (v: number | null | undefined, d = 1) =>
  v == null || Number.isNaN(v) ? '—' : v.toLocaleString('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d });
const pctTxt = (v: number | null) => (v == null ? '—' : `${v >= 0 ? '+' : '−'}${fmt(Math.abs(v))}%`);
const initials = (s: string) => s.replace(/^Afya\s+/i, '').split(/\s+/).filter((w) => w.length > 2 || /^[A-Z]/.test(w)).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
const unitColor = (i: number) => `hsl(var(--chart-${(i % 5) + 1}))`;

const MATRIX_BG: Record<ReturnType<typeof distanceTone>, string> = {
  worse2: 'bg-destructive/40 text-foreground', worse1: 'bg-destructive/15 text-foreground', near: 'bg-muted text-foreground',
  better1: 'bg-primary/20 text-foreground', better2: 'bg-primary/70 text-primary-foreground', none: 'bg-muted/50 text-muted-foreground',
};

/** Card that can expand over the page. */
export const Sheet = ({ id, open, setOpen, className = '', children, label }: { id: string; open: string | null; setOpen: (v: string | null) => void; className?: string; children: ReactNode; label: string }) => {
  const on = open === id;
  return (
    <>
      {on && <div className="fixed inset-0 z-[55] cursor-zoom-out bg-foreground/50 backdrop-blur-sm" onClick={() => setOpen(null)} aria-hidden />}
      <section aria-label={label}
        className={`group relative rounded-[28px] border bg-card p-5 md:p-8 ${on ? 'fixed inset-4 z-[60] overflow-auto shadow-2xl md:inset-6' : ''} ${className}`}>
        <button type="button" onClick={() => setOpen(on ? null : id)} aria-pressed={on} title={on ? 'Fechar visão ampliada' : 'Ampliar esta ficha'} aria-label={on ? 'Fechar visão ampliada' : 'Ampliar esta ficha'}
          className={`absolute right-3 top-3 z-[4] flex h-8 w-8 items-center justify-center rounded-[11px] border transition-opacity ${on ? 'border-primary bg-primary text-primary-foreground opacity-100' : 'bg-background/90 text-muted-foreground opacity-70 hover:bg-accent hover:text-primary group-hover:opacity-100'}`}>
          {on ? <X className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
        </button>
        {children}
      </section>
    </>
  );
};

export const H2 = ({ title, sub }: { title: string; sub?: ReactNode }) => (
  <div>
    <h2 className="text-[22px] font-semibold leading-tight">{title}</h2>
    {sub && <p className="mt-1 max-w-[62ch] text-sm text-muted-foreground">{sub}</p>}
  </div>
);

const Spark = ({ values, color }: { values: (number | null)[]; color: string }) => {
  const ok = values.filter((v): v is number => v != null);
  if (ok.length < 2) return <span className="text-xs text-muted-foreground">—</span>;
  const lo = Math.min(...ok), hi = Math.max(...ok), span = hi - lo || 1;
  const xs = [12, 66, 120];
  const y = (v: number) => 8 + (1 - (v - lo) / span) * 28;
  const pts = values.map((v, i) => (v == null ? null : [xs[i] ?? 120, y(v)] as const));
  const line = pts.filter(Boolean).map((p) => p!.join(',')).join(' ');
  return (
    <svg width="132" height="52" viewBox="0 0 132 52" role="img" aria-label={`Evolução: ${values.map((v) => fmt(v)).join(', ')}`}>
      <polyline points={line} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((p, i) => p && (
        <circle key={i} cx={p[0]} cy={p[1]} r={i === pts.length - 1 ? 5 : 4} fill={i === pts.length - 1 ? color : 'hsl(var(--card))'} stroke={i === pts.length - 1 ? 'hsl(var(--card))' : color} strokeWidth="2"><title>{fmt(values[i])}</title></circle>
      ))}
    </svg>
  );
};

export function OverviewView(p: OverviewProps) {
  const [fs, setFs] = useState<string | null>(null);
  const scales = p.instruments.filter((i) => !i.unavailable);
  const [scale, setScale] = useState<string>(scales[0]?.code ?? 'WHO5');
  const [focus, setFocus] = useState<string | null>(null);
  const [radarFocus, setRadarFocus] = useState<string | null>(null);
  const [view, setView] = useState<'radar' | 'matrix'>('radar');

  const who = p.stat('WHO5', p.current), whoPrev = p.stat('WHO5', p.previous);
  const unitDist = p.units.map((u) => ({
    unit: u,
    values: scales.map((s) => {
      const g = p.statAll(s.code, p.current, (r) => r.unit === u);
      return relDistance(s.higherIsBetter, g.avg, p.statAll(s.code, p.current).avg);
    }),
  }));
  const changes = buildChanges({ previous: p.previous, who, whoPrev, population: p.population, whoPrevN: whoPrev.n, unitDistances: unitDist });
  const pc = (n: number) => (p.population ? Math.round((n / p.population) * 100) : 0);
  const sem = p.current ?? '—';

  const kpis = [
    { label: 'Estudantes no recorte', value: p.population, unit: 'elegíveis', pct: 100, note: `Base de ${sem}` },
    { label: 'Responderam ao menos 1 escala', value: p.anyScale, unit: `${pc(p.anyScale)}%`, pct: pc(p.anyScale), note: p.previous ? `WHO-5: ${who.n.toLocaleString('pt-BR')} respostas` : 'Primeira coleta' },
    { label: 'Usaram o Diário emocional', value: p.diaryNow, unit: `${pc(p.diaryNow)}%`, pct: pc(p.diaryNow), note: `Participantes em ${sem}` },
    { label: 'Ativaram o acesso', value: p.activated, unit: p.activated == null ? '' : `${pc(p.activated)}%`, pct: p.activated == null ? 0 : pc(p.activated), note: p.activated == null ? 'Disponível para toda a instituição' : 'Contas ativas na plataforma' },
  ];

  const funnel = [
    { label: 'Estudantes elegíveis', n: p.population },
    { label: 'Ativaram o acesso', n: p.activated },
    { label: 'Registraram no Diário', n: p.diaryNow },
    { label: 'Responderam ao menos 1 escala', n: p.anyScale },
    { label: 'Responderam ao WHO-5', n: who.n },
  ];

  // Unit-vs-mean (selected scale)
  const sInst = scales.find((s) => s.code === scale) ?? scales[0];
  const instAvg = sInst ? p.statAll(sInst.code, p.current).avg : null;
  const groups = p.courses.map((c) => ({
    curso: c,
    bars: p.units.map((u, i) => {
      const g = p.statAll(sInst.code, p.current, (r) => r.unit === u && r.course === c);
      return { unit: u, i, avg: g.avg, n: g.n, d: relDistance(sInst.higherIsBetter, g.avg, instAvg) };
    }),
  })).filter((g) => g.bars.some((b) => b.avg != null));
  const maxAbs = Math.max(5, ...groups.flatMap((g) => g.bars.map((b) => Math.abs(b.d ?? 0))));

  // Radar
  const radarMax = Math.max(16, Math.ceil(Math.max(0, ...unitDist.flatMap((u) => u.values.map((v) => Math.abs(v ?? 0)))) / 2) * 2);
  const CX = 320, CY = 225, R0 = 120, K = (R0 * 0.8) / radarMax;
  const ring = (pct: number) => scales.map((_, i) => radarPoint(i, scales.length, R0 + pct * K, CX, CY).join(',')).join(' ');

  return (
    <div className="space-y-6">
      {/* Hero */}
      <Sheet id="s1" open={fs} setOpen={setFs} label="Resumo" className="overflow-hidden border-0 bg-primary text-primary-foreground">
        <div aria-hidden className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-primary-foreground/10" />
        <div aria-hidden className="pointer-events-none absolute -bottom-32 right-40 h-64 w-64 rounded-full bg-primary-foreground/5" />
        <div className="relative grid gap-8 lg:grid-cols-[1.1fr_1fr]">
          <div className="space-y-3">
            <span className="inline-flex rounded-full bg-primary-foreground/15 px-3 py-1 text-xs font-semibold">Coleta {sem} · {p.unitLabel}</span>
            <h1 className="text-3xl font-semibold leading-tight md:text-4xl">Como estão os seus estudantes neste semestre</h1>
            <p className="max-w-[52ch] text-primary-foreground/80">Leitura coletiva e descritiva da coleta {sem}{p.previous ? ', comparada à anterior' : ''}. Nenhum resultado individual é exibido.</p>
          </div>
          <div className="space-y-3 rounded-3xl bg-primary-foreground/10 p-5">
            <h2 className="text-base font-semibold">O que mudou{p.previous ? ` desde ${p.previous}` : ''}</h2>
            {changes.length ? changes.map((c, i) => (
              <div key={i} className="flex gap-3">
                <span aria-hidden className={`mt-2 h-2 w-2 shrink-0 rounded-full ${c.tone === 'good' ? 'bg-primary-foreground' : c.tone === 'bad' ? 'bg-destructive' : 'bg-primary-foreground/50'}`} />
                <p className="text-sm text-primary-foreground/85"><strong className="font-semibold text-primary-foreground">{c.strong}</strong>{c.rest}</p>
              </div>
            )) : <p className="text-sm text-primary-foreground/80">Ainda não há respostas suficientes para comparar.</p>}
          </div>
        </div>
      </Sheet>

      {/* KPIs */}
      <section aria-label="Números do recorte" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.label} className="flex flex-col gap-2 rounded-3xl border bg-card p-5">
            <span className="text-[13px] font-semibold text-muted-foreground">{k.label}</span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-semibold tabular-nums">{k.value == null ? '—' : k.value.toLocaleString('pt-BR')}</span>
              <span className="text-sm text-muted-foreground">{k.unit}</span>
            </div>
            <div className="h-1.5 rounded-full bg-muted"><div className="h-1.5 rounded-full bg-primary" style={{ width: `${Math.min(100, k.pct)}%` }} /></div>
            <span className="text-xs text-muted-foreground">{k.note}</span>
          </div>
        ))}
      </section>

      {/* Scales */}
      <Sheet id="s2" open={fs} setOpen={setFs} label="Escalas científicas" className="space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-3 pr-10">
          <H2 title="Escalas científicas" sub={`Média de ${sem}, onde ela cai nas faixas de referência de cada escala${p.previous ? ` e a variação desde ${p.previous}` : ''}.`} />
          <button type="button" onClick={() => p.onOpenIntegrated()} className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">Comparar recortes <ArrowRight className="h-4 w-4" /></button>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <span>Faixas:</span>
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-4 rounded" style={{ background: TONE_BAR.bad }} />pede atenção</span>
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-4 rounded" style={{ background: TONE_BAR.mid }} />intermediária</span>
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-4 rounded" style={{ background: TONE_BAR.good }} />favorável</span>
        </div>
        <div className="overflow-x-auto">
          <div className="min-w-[760px]">
            <div className="grid grid-cols-[1.6fr_1fr_2fr_1fr_140px] gap-4 border-b pb-2 text-xs font-semibold text-muted-foreground">
              <span>Instrumento</span><span>Média {sem}</span><span>Posição nas faixas</span><span>Desde {p.previous ?? '—'}</span><span>{p.semesters.length} coletas</span>
            </div>
            {p.instruments.map((inst) => {
              const now = inst.unavailable ? { n: 0, avg: null } : p.stat(inst.code, p.current);
              const prev = inst.unavailable ? { n: 0, avg: null } : p.stat(inst.code, p.previous);
              const band = bandOf(inst.code, now.avg);
              const delta = now.avg != null && prev.avg != null ? now.avg - prev.avg : null;
              const good = delta == null || Math.abs(delta) < 0.5 ? null : inst.higherIsBetter ? delta > 0 : delta < 0;
              const color = good == null ? 'hsl(var(--muted-foreground))' : good ? 'hsl(var(--primary))' : 'hsl(var(--destructive))';
              const bands = SCALE_BANDS[inst.code]?.bands ?? [];
              const span = inst.max - inst.min || 1;
              return (
                <div key={inst.code} role={inst.unavailable ? undefined : 'button'} tabIndex={inst.unavailable ? undefined : 0}
                  onClick={inst.unavailable ? undefined : () => p.onOpenIntegrated(inst.code)}
                  onKeyDown={inst.unavailable ? undefined : (e) => { if (e.key === 'Enter') p.onOpenIntegrated(inst.code); }}
                  className={`grid grid-cols-[1.6fr_1fr_2fr_1fr_140px] items-center gap-4 border-b py-4 last:border-0 ${inst.unavailable ? '' : 'cursor-pointer rounded-xl hover:bg-muted/40'}`}>
                  <div className="flex flex-col">
                    <span className="font-semibold">{inst.label}</span>
                    <span className="text-xs text-muted-foreground">{inst.short} · n={now.n.toLocaleString('pt-BR')}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-2xl font-semibold tabular-nums">{fmt(now.avg)}</span>
                    <span className="text-xs text-muted-foreground">{band?.label ?? '—'}</span>
                  </div>
                  <div>
                    <div className="relative">
                      <div className="flex h-2.5 overflow-hidden rounded-full">
                        {bands.map((b) => <div key={b.label} title={b.label} style={{ width: `${((Math.min(b.to + 1, inst.max) - b.from) / span) * 100}%`, background: TONE_BAR[b.tone] }} />)}
                      </div>
                      {now.avg != null && <div title={`${inst.short} ${sem}: ${fmt(now.avg)}`} className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-card bg-foreground shadow" style={{ left: `${Math.max(0, Math.min(100, ((now.avg - inst.min) / span) * 100))}%` }} />}
                    </div>
                    <div className="mt-1 flex justify-between text-[10px] text-muted-foreground"><span>{inst.min}</span><span>{inst.higherIsBetter ? 'maior = melhor' : 'menor = melhor'}</span><span>{inst.max}</span></div>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-semibold tabular-nums" style={{ color }}>{delta == null ? '—' : `${delta >= 0 ? '+' : '−'}${fmt(Math.abs(delta))} pt`}</span>
                    <span className="text-xs text-muted-foreground">{delta == null ? 'Sem comparação' : good == null ? 'Estável' : good ? 'Favorável' : 'Desfavorável'}</span>
                  </div>
                  {!inst.unavailable && p.semesters.some((s) => p.stat(inst.code, s).avg != null)
                    ? <Spark values={p.semesters.map((s) => p.stat(inst.code, s).avg)} color={color} />
                    : <span className="text-xs text-muted-foreground">Aguardando respostas</span>}
                </div>
              );
            })}
          </div>
        </div>
        <p className="text-xs text-muted-foreground">Escalas de rastreamento descrevem a população; não são diagnóstico. Escalas diferentes não são comparáveis entre si.</p>
      </Sheet>

      {/* Unit vs mean */}
      {p.units.length > 0 && sInst && (
        <Sheet id="s3" open={fs} setOpen={setFs} label="Cada unidade frente à média" className="space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-3 pr-10">
            <H2 title="Cada unidade frente à média" sub={`${sInst.label} (${sInst.short}) por curso, em % de distância da média da instituição em ${sem}. Grupos com menos de 10 respostas ficam ocultos.`} />
            <div role="group" aria-label="Escala exibida" className="flex flex-wrap gap-1 rounded-2xl bg-muted p-1">
              {scales.map((s) => (
                <button key={s.code} type="button" aria-pressed={s.code === scale} onClick={() => setScale(s.code)}
                  className={`h-8 rounded-xl px-3 text-xs ${s.code === scale ? 'bg-card font-semibold text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>{s.short}</button>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="text-muted-foreground">Destacar:</span>
            {p.units.map((u, i) => (
              <button key={u} type="button" aria-pressed={focus === u} onClick={() => setFocus(focus === u ? null : u)}
                className={`flex items-center gap-2 rounded-full border px-3 py-1 ${focus === u ? 'border-primary bg-accent font-semibold' : 'bg-card'}`}>
                <span aria-hidden className="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold text-primary-foreground" style={{ background: unitColor(i) }}>{initials(u)}</span>{u}
              </button>
            ))}
          </div>
          <div className="overflow-x-auto">
            <div className="min-w-[640px] space-y-4">
              <div className="grid grid-cols-[180px_1fr] gap-4 text-xs text-muted-foreground">
                <span />
                <div className="flex justify-between"><span>← menos favorável</span><span>média da instituição: {fmt(instAvg)}</span><span>mais favorável →</span></div>
              </div>
              {groups.length ? groups.map((g) => (
                <div key={g.curso} className="grid grid-cols-[180px_1fr] items-center gap-4">
                  <span className="text-sm font-semibold">{g.curso}</span>
                  <div className="relative space-y-1.5">
                    <div aria-hidden className="absolute inset-y-0 left-1/2 w-px border-l border-dashed border-muted-foreground/40" />
                    {g.bars.map((b) => {
                      const w = b.d == null ? 0 : (Math.abs(b.d) / maxAbs) * 50;
                      const dim = focus && focus !== b.unit ? 'opacity-30' : '';
                      return (
                        <div key={b.unit} className={`relative flex h-6 items-center ${dim}`}>
                          {b.d == null ? <span className="ml-[52%] text-[11px] text-muted-foreground">{initials(b.unit)} · protegido</span> : (
                            <>
                              <div title={`${b.unit} · ${g.curso}: ${fmt(b.avg)} (n=${b.n})`} className={`absolute h-3.5 rounded-full ${b.d >= 0 ? 'bg-primary' : 'bg-destructive/70'}`}
                                style={{ left: b.d >= 0 ? '50%' : `${50 - w}%`, width: `${Math.max(w, 0.6)}%` }} />
                              <span className="absolute text-[11px] tabular-nums" style={b.d >= 0 ? { left: `calc(${50 + w}% + 6px)` } : { right: `calc(${50 + w}% + 6px)` }}>
                                <span className="mr-1 font-bold" style={{ color: unitColor(b.i) }}>{initials(b.unit)}</span>
                                <strong>{pctTxt(b.d)}</strong> <span className="text-muted-foreground">{fmt(b.avg)}</span>
                              </span>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )) : <p className="text-sm text-muted-foreground">Sem grupos com respostas suficientes nesta escala.</p>}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-4 rounded bg-destructive/70" />Pior que a média da instituição</span>
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-4 rounded bg-primary" />Melhor que a média</span>
            <span>Nas escalas de sintomas, “melhor” significa valor menor. Diferenças descritivas, não indicam causa.</span>
          </div>
        </Sheet>
      )}

      {/* Radar / matrix */}
      {p.units.length > 0 && (
        <Sheet id="s4" open={fs} setOpen={setFs} label="Perfil das unidades" className="space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-3 pr-10">
            <H2 title={`Perfil das unidades nas ${scales.length} escalas`} sub="Quanto cada unidade está melhor ou pior que a instituição, em %, em todas as escalas ao mesmo tempo. Escalas de sintomas já estão invertidas: para fora é sempre melhor." />
            <div role="group" aria-label="Forma de visualizar" className="flex gap-1 rounded-2xl bg-muted p-1">
              {([['radar', 'Radar'], ['matrix', 'Tabela']] as const).map(([k, l]) => (
                <button key={k} type="button" aria-pressed={view === k} onClick={() => setView(k)}
                  className={`h-[34px] rounded-xl px-4 text-[13px] ${view === k ? 'bg-card font-semibold text-primary shadow-sm' : 'text-muted-foreground'}`}>{l}</button>
              ))}
            </div>
          </div>
          {view === 'radar' ? (
            <div className="flex flex-wrap items-center gap-7">
              <div className="relative mx-auto min-w-0 max-w-[700px] flex-[3_1_440px]">
                <svg viewBox="0 0 640 450" width="100%" className="block h-auto" role="img" aria-label="Radar das unidades frente à instituição">
                  <polygon points={ring(radarMax)} fill="hsl(var(--muted) / .5)" stroke="hsl(var(--border))" />
                  <polygon points={ring(10)} fill="none" stroke="hsl(var(--border))" />
                  <polygon points={ring(-10)} fill="none" stroke="hsl(var(--border))" />
                  {scales.map((_, i) => { const [x, y] = radarPoint(i, scales.length, R0 + radarMax * K, CX, CY); return <line key={i} x1={CX} y1={CY} x2={x} y2={y} stroke="hsl(var(--border))" />; })}
                  <polygon points={ring(0)} fill="none" stroke="hsl(var(--muted-foreground))" strokeWidth="1.5" strokeDasharray="5 4" />
                  <text x={CX + 6} y={CY - R0 - radarMax * K + 4} fontSize="11" fill="hsl(var(--muted-foreground))">+{radarMax}%</text>
                  <text x={CX + 6} y={CY - R0 - 10 * K + 4} fontSize="11" fill="hsl(var(--muted-foreground))">+10%</text>
                  <text x={CX + 6} y={CY - R0 + 4} fontSize="11" fontWeight="600" fill="hsl(var(--foreground))">instituição</text>
                  <text x={CX + 6} y={CY - R0 + 10 * K + 4} fontSize="11" fill="hsl(var(--muted-foreground))">−10%</text>
                  {unitDist.map((u, ui) => {
                    const pts = u.values.map((v, i) => radarPoint(i, scales.length, R0 + (v ?? 0) * K, CX, CY));
                    const on = !radarFocus || radarFocus === u.unit;
                    return (
                      <g key={u.unit} opacity={on ? 1 : 0.15}>
                        <polygon points={pts.map((q) => q.join(',')).join(' ')} fill={unitColor(ui)} fillOpacity={radarFocus === u.unit ? 0.25 : 0.08} stroke={unitColor(ui)} strokeWidth="2.5" strokeLinejoin="round" />
                        {pts.map((q, i) => u.values[i] != null && <circle key={i} cx={q[0]} cy={q[1]} r="4.5" fill={unitColor(ui)} stroke="hsl(var(--card))" strokeWidth="2"><title>{`${u.unit} · ${scales[i].short}: ${pctTxt(u.values[i])}`}</title></circle>)}
                      </g>
                    );
                  })}
                  {scales.map((s, i) => {
                    const [x, y] = radarPoint(i, scales.length, R0 + radarMax * K + 22, CX, CY);
                    const anchor = Math.abs(x - CX) < 10 ? 'middle' : x > CX ? 'start' : 'end';
                    return (
                      <g key={s.code}>
                        <text x={x} y={y} textAnchor={anchor} fontSize="13" fontWeight="600" fill="hsl(var(--foreground))">{s.label}</text>
                        <text x={x} y={y + 14} textAnchor={anchor} fontSize="11" fill="hsl(var(--muted-foreground))">{s.short}</text>
                      </g>
                    );
                  })}
                </svg>
              </div>
              <div className="flex min-w-0 flex-[2_1_280px] flex-col gap-2.5">
                <span className="text-[13px] font-semibold text-muted-foreground">Clique para destacar uma unidade</span>
                {unitDist.map((u, i) => {
                  const avg = meanDistance(u.values);
                  return (
                    <button key={u.unit} type="button" aria-pressed={radarFocus === u.unit} onClick={() => setRadarFocus(radarFocus === u.unit ? null : u.unit)}
                      className={`flex w-full items-center gap-3 rounded-[18px] border px-4 py-3.5 text-left ${radarFocus === u.unit ? 'border-primary bg-accent' : 'bg-card hover:bg-muted/50'}`}>
                      <span aria-hidden className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-primary-foreground" style={{ background: unitColor(i) }}>{initials(u.unit)}</span>
                      <span className="flex min-w-0 flex-1 flex-col">
                        <span className="text-sm font-semibold">{u.unit}</span>
                        <span className="text-xs text-muted-foreground">{u.values.filter((v) => v != null && v > 0).length} de {u.values.filter((v) => v != null).length} escalas acima da média</span>
                      </span>
                      <span className={`text-lg font-semibold ${avg == null ? 'text-muted-foreground' : avg >= 0 ? 'text-primary' : 'text-destructive'}`}>{pctTxt(avg)}</span>
                    </button>
                  );
                })}
                <p className="mt-1 text-[13px] text-muted-foreground">O número à direita é a média da distância às escalas. A linha tracejada é a instituição; cada anel é 10 pontos percentuais.</p>
              </div>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <div className="min-w-[640px] space-y-1.5">
                  <div className="grid gap-1.5" style={{ gridTemplateColumns: `1.5fr repeat(${p.units.length}, minmax(0,1fr))` }}>
                    <span />
                    {p.units.map((u, i) => <span key={u} className="flex items-center justify-center gap-2 text-[13px] font-semibold"><span aria-hidden className="flex h-[26px] w-[26px] items-center justify-center rounded-full text-[10px] font-bold text-primary-foreground" style={{ background: unitColor(i) }}>{initials(u)}</span>{u}</span>)}
                  </div>
                  {scales.map((s, si) => (
                    <div key={s.code} className="grid gap-1.5" style={{ gridTemplateColumns: `1.5fr repeat(${p.units.length}, minmax(0,1fr))` }}>
                      <div className="flex flex-col justify-center"><span className="text-sm font-semibold">{s.label}</span><span className="text-xs text-muted-foreground">{s.short} · instituição {fmt(p.statAll(s.code, p.current).avg)}</span></div>
                      {unitDist.map((u) => {
                        const v = u.values[si];
                        const g = p.statAll(s.code, p.current, (r) => r.unit === u.unit);
                        return (
                          <div key={u.unit} title={`${u.unit} · ${s.short}`} className={`rounded-[14px] px-2 py-3 text-center ${MATRIX_BG[distanceTone(v)]}`}>
                            <div className="text-lg font-semibold">{pctTxt(v)}</div>
                            <div className="text-xs opacity-85">{fmt(g.avg)}</div>
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-x-3.5 gap-y-2 text-xs text-muted-foreground">
                <span>Distância da instituição:</span>
                {([['worse2', 'pior (−8% ou mais)'], ['worse1', 'pior (−3% a −8%)'], ['near', 'próximo'], ['better1', 'melhor (+3% a +8%)'], ['better2', 'melhor (+8% ou mais)']] as const).map(([k, l]) => (
                  <span key={k} className="flex items-center gap-1.5"><span className={`h-3 w-[18px] rounded ${MATRIX_BG[k]}`} />{l}</span>
                ))}
              </div>
            </>
          )}
        </Sheet>
      )}

      <div className="flex flex-wrap items-stretch gap-6">
        <Sheet id="s5" open={fs} setOpen={setFs} label="Quem chega à leitura" className="min-w-0 flex-[1_1_320px] space-y-4">
          <H2 title="Quem chega à leitura" sub={`Pessoas, não registros · ${sem}`} />
          {funnel.map((f) => (
            <div key={f.label} className="space-y-1">
              <div className="flex justify-between text-sm"><span>{f.label}</span><span className="font-semibold tabular-nums">{f.n == null ? '—' : f.n.toLocaleString('pt-BR')} <span className="text-primary">· {f.n == null ? '—' : `${pc(f.n)}%`}</span></span></div>
              <div className="h-2.5 rounded-full bg-muted"><div className="h-2.5 rounded-full bg-primary" style={{ width: `${f.n == null ? 0 : Math.min(100, pc(f.n))}%` }} /></div>
            </div>
          ))}
          <p className="text-[13px] text-muted-foreground">Cobertura baixa reduz a representatividade. Leia as médias junto com a participação.</p>
        </Sheet>
        <section aria-label="Continue a leitura" className="min-w-0 flex-[1_1_320px] space-y-3 rounded-[28px] border bg-card p-5 md:p-8">
          <h2 className="text-[22px] font-semibold">Continue a leitura</h2>
          <button type="button" onClick={() => p.onOpenIntegrated()} className="flex w-full items-center gap-3 rounded-2xl border p-4 text-left hover:bg-muted/50">
            <GitCompare className="h-5 w-5 text-primary" /><span className="flex-1"><span className="block font-semibold">Análise integrada</span><span className="text-xs text-muted-foreground">Compare unidades, cursos e coletas</span></span><ArrowRight className="h-4 w-4 text-primary" />
          </button>
          {([[NotebookPen, 'Diário emocional'], [PlayCircle, 'Conteúdos e práticas'], [ListChecks, 'Ações e acompanhamento']] as const).map(([I, l]) => (
            <div key={l} aria-disabled className="flex items-center gap-3 rounded-2xl border border-dashed p-4 text-muted-foreground">
              <I className="h-5 w-5" /><span className="flex-1 font-medium">{l}</span><span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold">Em breve</span>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}
