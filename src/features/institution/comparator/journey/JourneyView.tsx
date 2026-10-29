import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { LogoLoader } from '@/components/ui/logo-loader';
import { Sheet, H2 } from '../overview/OverviewView';
import { STAGES, ORIGINS, DESTS, OUTCOMES, stageCounts, stageLosses, curve, links, sumBy, pooledWait, type Flow, type Wait } from './journeyLogic';

type Payload = { population: number; units_population: Record<string, number>; flows: Flow[]; waits: Wait[]; acolher: { sem: string; unit: string; n: number }[]; mapear: { sem: string; unit: string; n: number }[] };

const unitColor = (i: number) => `hsl(var(--chart-${(i % 5) + 1}))`;
const initials = (s: string) => s.replace(/^Afya\s+/i, '').split(/\s+/).filter((w) => w.length > 2).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
const pct = (n: number, d: number) => (d ? Math.round((n / d) * 100) : 0);
const days = (v: number | null) => (v == null ? '—' : `${Math.max(1, Math.round(v))} ${Math.round(v) <= 1 ? 'dia' : 'dias'}`);
const OUT_CLS: Record<string, string> = { consulta: 'hsl(var(--primary))', em_andamento: 'hsl(var(--primary) / .7)', sem_retorno: 'hsl(var(--highlight-pink) / .7)', outro_recurso: 'hsl(var(--muted-foreground) / .5)' };

export function JourneyView({ institutionId, semester, unitFilter, onSemesters }: { institutionId?: string; semester: string | null; unitFilter: string; onSemesters?: (s: string[]) => void }) {
  const [fs, setFs] = useState<string | null>(null);
  const [by, setBy] = useState<'origem' | 'unid'>('origem');
  const [srcFocus, setSrcFocus] = useState<string | null>(null);
  const [cmpFocus, setCmpFocus] = useState<string | null>(null);
  const [cmpView, setCmpView] = useState<'curva' | 'tabela'>('curva');
  const [hover, setHover] = useState<string | null>(null);
  const [flU, setFlU] = useState<string>('all');
  const [flMode, setFlMode] = useState<'n' | 'pct'>('n');

  const q = useQuery({
    queryKey: ['care-journey', institutionId],
    enabled: !!institutionId,
    queryFn: async () => {
      const { data, error } = await (supabase as any).rpc('get_institution_care_journey', { p_institution_id: institutionId });
      if (error) throw error;
      return data as Payload;
    },
  });
  const d = q.data;
  const sems = useMemo(() => [...new Set((d?.flows ?? []).map((f) => f.sem))].sort().slice(-3), [d]);
  const sem = semester && sems.includes(semester) ? semester : sems[sems.length - 1] ?? null;
  const inU = (r: { unit: string }) => unitFilter === 'all' || r.unit === unitFilter;
  const flows = (d?.flows ?? []).filter((f) => f.sem === sem);
  const flowsU = flows.filter(inU);
  const units = [...new Set(flows.map((f) => f.unit))].sort();
  const population = unitFilter === 'all' ? d?.population ?? 0 : d?.units_population?.[unitFilter] ?? 0;

  if (q.isLoading) return <LogoLoader className="min-h-[40vh]" />;
  if (q.error) return <div className="rounded-3xl border bg-card p-10 text-center text-muted-foreground">Não foi possível carregar a jornada de cuidado.</div>;

  const counts = stageCounts(flowsU);
  const { losses, worst } = stageLosses(counts);
  const waitsU = (d?.waits ?? []).filter((w) => w.sem === sem && inU(w));
  const weights = Object.fromEntries([...sumBy(flowsU, (f) => f.unit)]);
  const medians = (['w1', 'w2', 'w3', 'w4'] as const).map((k) => pooledWait(waitsU, k, weights));
  const notReached = sumBy(flowsU.filter((f) => f.stage < 5), (f) => f.outcome);
  const restTot = [...notReached.values()].reduce((s, v) => s + v, 0);
  const acolher = (d?.acolher ?? []).filter((r) => r.sem === sem && inU(r)).reduce((s, r) => s + r.n, 0);
  const mapear = (d?.mapear ?? []).filter((r) => r.sem === sem && inU(r)).reduce((s, r) => s + r.n, 0);
  const ame = [
    { letter: 'A', title: 'Acolher', n: acolher, desc: 'Usaram Buddy, Diário ou uma prática de autorregulação.' },
    { letter: 'M', title: 'Mapear', n: mapear, desc: 'Responderam ao menos uma escala ou o Radar de permanência.' },
    { letter: 'E', title: 'Encaminhar', n: counts[0], desc: 'Pediram apoio humano: psicologia, psiquiatria, mentoria ou núcleo.' },
  ];

  // Flow diagram
  const srcKey = (f: Flow) => (by === 'unid' ? f.unit : f.origin);
  const srcLabel = (k: string) => (by === 'unid' ? k : ORIGINS[k] ?? k);
  const sk = srcFocus ? flowsU.filter((f) => srcKey(f) === srcFocus) : flowsU;
  const cols = [
    [...sumBy(flowsU, srcKey)].sort((a, b) => b[1] - a[1]).map(([k, v]) => ({ k, label: srcLabel(k), v })),
    Object.keys(DESTS).map((k) => ({ k, label: DESTS[k], v: sumBy(sk, (f) => f.destination).get(k) ?? 0 })).filter((x) => x.v > 0),
    Object.keys(OUTCOMES).map((k) => ({ k, label: OUTCOMES[k], v: sumBy(sk, (f) => f.outcome).get(k) ?? 0 })).filter((x) => x.v > 0),
  ];
  const W = 900, H = 420, NW = 14, GAP = 10, X = [170, 440, 710];
  const pos = cols.map((col) => {
    const tot = col.reduce((s, x) => s + x.v, 0) || 1;
    const scale = (H - GAP * (col.length - 1)) / tot;
    let y = 0;
    const m = new Map<string, { y: number; h: number; off: number; offIn: number }>();
    col.forEach((x) => { const h = Math.max(2, x.v * scale); m.set(x.k, { y, h, off: 0, offIn: 0 }); y += h + GAP; });
    return { m, scale };
  });
  const ribbons = [
    ...links(sk, srcKey, (f) => f.destination).map((l) => ({ ...l, c: 0 })),
    ...links(sk, (f) => f.destination, (f) => f.outcome).map((l) => ({ ...l, c: 1 })),
  ].map((l) => {
    const a = pos[l.c].m.get(l.from), b = pos[l.c + 1].m.get(l.to);
    if (!a || !b) return null;
    const ha = l.n * pos[l.c].scale, hb = l.n * pos[l.c + 1].scale;
    const y0 = a.y + a.off, y1 = b.y + b.offIn; a.off += ha; b.offIn += hb;
    const x0 = X[l.c] + NW, x1 = X[l.c + 1], mx = (x0 + x1) / 2;
    const path = `M${x0},${y0} C${mx},${y0} ${mx},${y1} ${x1},${y1} L${x1},${y1 + hb} C${mx},${y1 + hb} ${mx},${y0 + ha} ${x0},${y0 + ha} Z`;
    const key = `${l.c}:${l.from}:${l.to}`;
    const tip = l.c === 0 ? `${srcLabel(l.from)} → ${DESTS[l.to]}: ${l.n} pessoas` : `${DESTS[l.from]} → ${OUTCOMES[l.to]}: ${l.n} pessoas`;
    return { key, path, tip, fill: l.c === 1 ? OUT_CLS[l.to] : 'hsl(var(--primary) / .35)' };
  }).filter(Boolean) as { key: string; path: string; tip: string; fill: string }[];

  // Units comparison
  const perUnit = units.map((u, i) => {
    const uf = flows.filter((f) => f.unit === u);
    const c = stageCounts(uf);
    const w = (d?.waits ?? []).find((x) => x.sem === sem && x.unit === u);
    return { u, i, c, cv: curve(c), taxa: pct(c[0], d?.units_population?.[u] ?? 0), atend: pct(c[4], c[0]), wait: w?.total ?? null };
  });
  const instC = stageCounts(flows);
  const CW = 760, CH = 260, cx = (i: number) => 40 + i * ((CW - 80) / 5), cy = (p: number) => 20 + (1 - p / 100) * (CH - 50);
  const worstUnit = [...perUnit].sort((a, b) => a.atend - b.atend)[0];

  const Chips = <T extends string>({ opts, val, set }: { opts: [T, string][]; val: T; set: (v: T) => void }) => (
    <div role="group" className="flex gap-1 rounded-2xl bg-muted p-1">
      {opts.map(([k, l]) => <button key={k} type="button" aria-pressed={val === k} onClick={() => set(k)} className={`h-[34px] rounded-xl px-4 text-[13px] ${val === k ? 'bg-card font-semibold text-primary shadow-sm' : 'text-muted-foreground'}`}>{l}</button>)}
    </div>
  );

  if (!counts[0]) {
    return (
      <div className="space-y-6">
        <Header sem={sem} />
        <div className="rounded-3xl border bg-card p-10 text-center text-muted-foreground">Ainda não há pedidos de apoio suficientes neste recorte (mínimo de 10).</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Header sem={sem} />

      <Sheet id="j1" open={fs} setOpen={setFs} label="Pilares do Método AME" className="grid gap-4 md:grid-cols-3">
        {ame.map((p) => (
          <div key={p.letter} className="flex flex-col gap-2 rounded-3xl bg-accent/50 p-5">
            <div className="flex items-center justify-between">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-lg font-semibold text-primary-foreground">{p.letter}</span>
              <span className="text-xs font-semibold text-primary">{pct(p.n, population).toLocaleString('pt-BR')}% dos elegíveis</span>
            </div>
            <span className="text-lg font-semibold">{p.title}</span>
            <span className="text-3xl font-semibold tabular-nums">{p.n.toLocaleString('pt-BR')}</span>
            <p className="text-sm text-muted-foreground">{p.desc}</p>
          </div>
        ))}
      </Sheet>

      <Sheet id="j2" open={fs} setOpen={setFs} label="Etapas do encaminhamento" className="flex flex-col gap-5">
        {(() => {
          const ff = flU === 'all' ? flowsU : flows.filter((f) => f.unit === flU && (d?.units_population?.[f.unit] ?? 10) >= 0);
          const c = stageCounts(ff);
          const wts = Object.fromEntries([...sumBy(ff, (f) => f.unit)]);
          const wv = (d?.waits ?? []).filter((w) => w.sem === sem && (flU === 'all' ? inU(w) : w.unit === flU));
          const med = (['w1', 'w2', 'w3', 'w4'] as const).map((k) => pooledWait(wv, k, wts));
          const nr = sumBy(ff.filter((f) => f.stage < 5), (f) => f.outcome);
          const rt = [...nr.values()].reduce((x, v) => x + v, 0);
          let wi = 1; let wd = -1;
          for (let k = 1; k <= 4; k++) { const dd = c[k - 1] - c[k]; if (dd > wd) { wd = dd; wi = k; } }
          const HMAX = 200, CY = 140, base = c[0] || 1;
          const hh = (n: number) => Math.max((n / base) * HMAX, 6);
          const medSum = med.reduce<number>((x, v) => x + (v ?? 0), 0);
          const PINK = 'hsl(var(--highlight-pink))';
          const unitOpts = units.filter((u) => (stageCounts(flows.filter((f) => f.unit === u))[0] ?? 0) >= 10);
          return (<>
            <div className="flex flex-wrap items-end justify-between gap-4 pr-10">
              <H2 title="Etapas do encaminhamento" sub={`${c[0].toLocaleString('pt-BR')} pessoas pediram apoio humano em ${sem}. Cada etapa é contada separadamente.`} />
              <div className="flex flex-wrap gap-6">
                <div className="flex flex-col"><span className="text-[28px] font-semibold leading-tight tabular-nums">{days(medSum)}</span><span className="text-[13px] text-muted-foreground">do pedido à 1ª consulta</span></div>
                <div className="flex flex-col"><span className="text-[28px] font-semibold leading-tight tabular-nums">{pct(c[4], c[0])}%</span><span className="text-[13px] text-muted-foreground">chegaram a atendimento</span></div>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div role="group" aria-label="Unidade exibida no fluxo" className="flex flex-wrap gap-2">
                {unitFilter === 'all' && [['all', 'Toda a instituição'] as const, ...unitOpts.map((u) => [u, u.replace(/^Afya\s+/i, '')] as const)].map(([k, l], i) => (
                  <button key={k} type="button" aria-pressed={flU === k} onClick={() => setFlU(k)} className={`inline-flex h-[38px] items-center gap-2 rounded-full border pr-3.5 text-[13px] ${k === 'all' ? 'pl-3.5' : 'pl-1.5'} ${flU === k ? 'border-primary bg-accent font-semibold' : 'bg-card font-medium'}`}>
                    {k !== 'all' && <span aria-hidden className="flex h-[26px] w-[26px] items-center justify-center rounded-full text-[10px] font-bold text-primary-foreground" style={{ background: unitColor(i - 1) }}>{initials(k)}</span>}
                    {l}
                  </button>
                ))}
              </div>
              <Chips opts={[['n', 'Pessoas'], ['pct', '% do pedido']]} val={flMode} set={(v) => setFlMode(v as 'n' | 'pct')} />
            </div>
            <div className="overflow-x-auto">
              <div role="img" aria-label="Fluxo das etapas do encaminhamento" className="grid min-w-[720px] grid-cols-6">
                {STAGES.map((st, i) => {
                  const n = c[i], h = hh(n), ph = i > 0 ? hh(c[i - 1]) : h;
                  const worstI = i === wi, last = i === 5;
                  const ya = CY - ph / 2, yb = CY - h / 2, yb2 = CY + h / 2, ya2 = CY + ph / 2;
                  const ribbon = `M0 ${ya} C50 ${ya} 50 ${yb} 100 ${yb} L100 ${yb2} C50 ${yb2} 50 ${ya2} 0 ${ya2} Z`;
                  const t1 = i >= 1 && i <= 4 ? `−${(c[i - 1] - n).toLocaleString('pt-BR')}` : last ? `${pct(n, c[4])}%` : '';
                  const t2 = i >= 1 && i <= 4 ? days(med[i - 1]) : last ? 'continuam' : '';
                  return (
                    <div key={st} className="relative flex flex-col">
                      <div className="relative h-[280px]">
                        {i > 0 && (<>
                          <svg viewBox="0 0 100 280" preserveAspectRatio="none" aria-hidden className="absolute top-0 h-full w-[56%] overflow-visible" style={{ left: '-28%' }}>
                            <path d={ribbon} fill={worstI ? PINK : 'hsl(var(--primary))'} fillOpacity={worstI ? 0.3 : last ? 0.08 : 0.14} />
                          </svg>
                          <div className="absolute top-0 flex w-[56%] flex-col items-center leading-tight" style={{ left: '-28%', color: worstI ? PINK : undefined }}>
                            <span className="text-[15px] font-semibold">{t1}</span>
                            <span className={`text-[11px] ${worstI ? '' : 'text-muted-foreground'}`}>{t2}</span>
                          </div>
                        </>)}
                        <div title={`${st}: ${n} pessoas (${pct(n, c[0])}% do pedido)`} className={`absolute left-[28%] w-[44%] rounded-xl ${last ? 'bg-primary/50' : 'bg-primary/80'}`} style={{ top: CY - h / 2, height: h }} />
                      </div>
                      <div className="flex flex-col gap-0.5 px-1 pt-3 text-center">
                        <span className="min-h-[34px] text-[13px] font-medium leading-snug">{st}</span>
                        <span className="text-2xl font-semibold tabular-nums">{flMode === 'pct' ? `${pct(n, c[0])}%` : n.toLocaleString('pt-BR')}</span>
                        <span className="text-xs text-muted-foreground">{flMode === 'pct' ? `${n} pessoas` : `${pct(n, c[0])}% do pedido`}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Entre as etapas: quantas pessoas não seguiram (−) e o tempo médio até a etapa seguinte. A faixa rosa marca a maior perda até a 1ª consulta.</p>
            <div className="flex flex-wrap gap-4">
              <div className="flex flex-[1_1_320px] flex-col gap-1 rounded-[20px] p-5" style={{ background: 'hsl(var(--highlight-pink) / .12)' }}>
                <span className="font-semibold" style={{ color: PINK }}>Maior perda: entre {STAGES[wi - 1].toLowerCase()} e {STAGES[wi].toLowerCase()}</span>
                <span className="text-sm">{wd.toLocaleString('pt-BR')} pessoas chegaram a "{STAGES[wi - 1].toLowerCase()}" e não seguiram para a etapa seguinte. Vale olhar horários oferecidos e faltas na aba Atendimentos.</span>
              </div>
              {rt > 0 && (
                <div className="flex flex-[1_1_320px] flex-col gap-2 rounded-[20px] bg-muted/60 p-5">
                  <span className="font-semibold">As {rt.toLocaleString('pt-BR')} pessoas ainda não atendidas</span>
                  <div aria-hidden className="flex h-3 gap-0.5 overflow-hidden rounded-full">
                    {['em_andamento', 'sem_retorno', 'outro_recurso'].map((k) => <div key={k} style={{ width: `${pct(nr.get(k) ?? 0, rt)}%`, background: OUT_CLS[k] }} />)}
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-[13px] text-muted-foreground">
                    {['em_andamento', 'sem_retorno', 'outro_recurso'].map((k) => <span key={k} className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: OUT_CLS[k] }} />{nr.get(k) ?? 0} {OUTCOMES[k].toLowerCase()}</span>)}
                  </div>
                </div>
              )}
            </div>
          </>);
        })()}
      </Sheet>

      <Sheet id="j3" open={fs} setOpen={setFs} label="Origem e destino dos pedidos" className="space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-3 pr-10">
          <H2 title="De onde vêm e para onde vão os pedidos" sub="A largura de cada faixa é o número de pessoas. Passe o mouse sobre uma faixa para ver o que ela representa. Escolha uma origem para olhar só para ela." />
          <Chips opts={[['origem', 'Porta de entrada'], ['unid', 'Unidade']]} val={by} set={(v) => { setBy(v as "origem" | "unid"); setSrcFocus(null); }} />
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => setSrcFocus(null)} aria-pressed={!srcFocus} className={`rounded-full border px-3 py-1 text-sm ${!srcFocus ? 'border-primary bg-accent font-semibold' : 'bg-card'}`}>Todos os pedidos · {counts[0]}</button>
          {cols[0].map((x) => <button key={x.k} type="button" onClick={() => setSrcFocus(srcFocus === x.k ? null : x.k)} aria-pressed={srcFocus === x.k} className={`rounded-full border px-3 py-1 text-sm ${srcFocus === x.k ? 'border-primary bg-accent font-semibold' : 'bg-card'}`}>{x.label} · {x.v}</button>)}
        </div>
        <div className="relative overflow-x-auto">
          <svg viewBox={`0 -24 ${W} ${H + 30}`} className="block h-auto min-w-[720px] w-full" role="img" aria-label="Fluxo dos pedidos da porta de entrada à situação atual">
            {[by === 'unid' ? 'Unidade' : 'Porta de entrada', 'Encaminhamento', 'Situação hoje'].map((h, i) => <text key={h} x={X[i] + NW / 2} y={-10} textAnchor="middle" fontSize="12" fontWeight="600" fill="hsl(var(--muted-foreground))">{h}</text>)}
            {ribbons.map((r) => <path key={r.key} d={r.path} fill={r.fill} fillOpacity={hover && hover !== r.key ? 0.25 : 0.75} onMouseEnter={() => setHover(r.key)} onMouseLeave={() => setHover(null)}><title>{r.tip}</title></path>)}
            {cols.map((col, ci) => col.map((x) => {
              const p = pos[ci].m.get(x.k)!;
              const dim = ci === 0 && srcFocus && srcFocus !== x.k;
              return (
                <g key={`${ci}${x.k}`} opacity={dim ? 0.3 : 1}>
                  <rect x={X[ci]} y={p.y} width={NW} height={p.h} rx="3" fill={ci === 2 ? OUT_CLS[x.k] : 'hsl(var(--primary))'} />
                  <text x={ci === 0 ? X[ci] - 8 : X[ci] + NW + 8} y={p.y + p.h / 2} dy="4" textAnchor={ci === 0 ? 'end' : 'start'} fontSize="12" fill="hsl(var(--foreground))">{x.label} <tspan fill="hsl(var(--muted-foreground))">{x.v}</tspan></text>
                </g>
              );
            }))}
          </svg>
        </div>
        {hover && <p className="text-sm text-muted-foreground">{ribbons.find((r) => r.key === hover)?.tip}</p>}
      </Sheet>

      {perUnit.length > 1 && (
        <Sheet id="j4" open={fs} setOpen={setFs} label="Comparação entre unidades" className="space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-3 pr-10">
            <H2 title="Comparação entre unidades" sub="Escolha uma unidade para destacar a sua curva. A curva mostra quantos pedidos seguem em cada etapa, em % do pedido inicial." />
            <Chips opts={[['curva', 'Curva'], ['tabela', 'Tabela']]} val={cmpView} set={(v) => setCmpView(v as "curva" | "tabela")} />
          </div>
          <div className="flex flex-wrap items-start gap-6">
            <div className="min-w-0 flex-[3_1_480px]">
              {cmpView === 'curva' ? (
                <svg viewBox={`0 0 ${CW} ${CH}`} className="block h-auto w-full" role="img" aria-label="Curva por unidade">
                  {[0, 25, 50, 75, 100].map((p) => <g key={p}><line x1={30} x2={CW - 20} y1={cy(p)} y2={cy(p)} stroke="hsl(var(--border))" /><text x={24} y={cy(p) + 4} textAnchor="end" fontSize="10" fill="hsl(var(--muted-foreground))">{p}%</text></g>)}
                  <polyline points={curve(instC).map((p, i) => `${cx(i)},${cy(p)}`).join(' ')} fill="none" stroke="hsl(var(--muted-foreground))" strokeWidth="1.5" strokeDasharray="5 4" />
                  {perUnit.map((u) => (
                    <g key={u.u} opacity={cmpFocus && cmpFocus !== u.u ? 0.2 : 1}>
                      <polyline points={u.cv.map((p, i) => `${cx(i)},${cy(p)}`).join(' ')} fill="none" stroke={unitColor(u.i)} strokeWidth={cmpFocus === u.u ? 3.5 : 2.5} strokeLinejoin="round" />
                      {u.cv.map((p, i) => <circle key={i} cx={cx(i)} cy={cy(p)} r="4" fill={unitColor(u.i)} stroke="hsl(var(--card))" strokeWidth="2"><title>{`${u.u} · ${STAGES[i]}: ${p}% (${u.c[i]})`}</title></circle>)}
                    </g>
                  ))}
                  {STAGES.map((s, i) => <text key={s} x={cx(i)} y={CH - 6} textAnchor="middle" fontSize="10" fill="hsl(var(--muted-foreground))">{s.replace(' realizada', '').replace(' enviado', '').replace(' realizado', '')}</text>)}
                </svg>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-separate border-spacing-1 text-sm">
                    <thead><tr><th className="text-left text-xs text-muted-foreground">Etapa</th><th className="text-xs">Instituição</th>{perUnit.map((u) => <th key={u.u} className="text-xs">{initials(u.u)}</th>)}</tr></thead>
                    <tbody>{STAGES.map((s, i) => (
                      <tr key={s}>
                        <td className="pr-2 font-medium">{s}</td>
                        {[curve(instC)[i], ...perUnit.map((u) => u.cv[i])].map((p, j) => (
                          <td key={j} className="rounded-lg px-2 py-2 text-center" style={{ background: `hsl(var(--primary) / ${(0.04 + (p / 100) * 0.36).toFixed(2)})` }}>
                            <div className="font-semibold">{p}%</div><div className="text-[11px] text-muted-foreground">{j === 0 ? instC[i] : perUnit[j - 1].c[i]}</div>
                          </td>
                        ))}
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
              )}
            </div>
            <div className="flex min-w-0 flex-[2_1_260px] flex-col gap-2.5">
              {perUnit.map((u) => (
                <button key={u.u} type="button" aria-pressed={cmpFocus === u.u} onClick={() => setCmpFocus(cmpFocus === u.u ? null : u.u)}
                  className={`flex w-full items-center gap-3 rounded-[18px] border px-4 py-3 text-left ${cmpFocus === u.u ? 'border-primary bg-accent' : 'bg-muted/30'}`}>
                  <span aria-hidden className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-primary-foreground" style={{ background: unitColor(u.i) }}>{initials(u.u)}</span>
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="text-sm font-semibold">{u.u}</span>
                    <span className="text-xs text-muted-foreground">{u.taxa}% pediram apoio · espera mediana {days(u.wait)}</span>
                  </span>
                  <span className="text-right"><span className="block text-lg font-semibold text-primary">{u.atend}%</span><span className="text-[11px] text-muted-foreground">atendidos</span></span>
                </button>
              ))}
            </div>
          </div>
          {worstUnit && <p className="text-xs text-muted-foreground">{worstUnit.u} tem a menor proporção de pedidos que chegam à 1ª consulta ({worstUnit.atend}%). Leitura descritiva, não indica causa.</p>}
        </Sheet>
      )}
    </div>
  );
}

const Header = ({ sem }: { sem: string | null }) => (
  <header className="space-y-2">
    <span className="text-[13px] font-semibold text-primary">Método AME · Acolher, Mapear, Encaminhar</span>
    <h1 className="text-3xl font-semibold leading-tight md:text-4xl">Do pedido de apoio ao atendimento</h1>
    <p className="max-w-[62ch] text-muted-foreground">Como os pedidos caminham em {sem ?? '—'}. Cada etapa é contada separadamente: pedir apoio não é o mesmo que ser atendido.</p>
  </header>
);
