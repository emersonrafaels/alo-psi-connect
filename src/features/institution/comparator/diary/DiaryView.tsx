import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { LogoLoader } from '@/components/ui/logo-loader';
import { EMOTION_FAMILIES, getEmotionLabel } from '@/features/jornada/config/emotion-taxonomy';
import { Sheet, H2 } from '../overview/OverviewView';
import { examWeeks, mean, dev, examInsight, hardestLightest, ppChange, type DiaryPayload } from './diaryLogic';

const br = (n: number, d = 1) => n.toLocaleString('pt-BR', { maximumFractionDigits: d, minimumFractionDigits: d });
const int = (n: number) => Math.round(n).toLocaleString('pt-BR');
const DOW = ['', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];
const DOW_S = ['', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
const MOOD_LV = [
  { l: 'Muito difícil', c: 'bg-destructive/70 text-primary-foreground' }, { l: 'Difícil', c: 'bg-destructive/35' },
  { l: 'Neutro', c: 'bg-muted' }, { l: 'Bom', c: 'bg-primary/45' }, { l: 'Muito bom', c: 'bg-primary text-primary-foreground' },
];
const famValence = Object.fromEntries(EMOTION_FAMILIES.map((f) => [f.id, f.valence]));
const heatTone = (v: number) => (v < 3 ? 'bg-destructive/35' : v < 3.2 ? 'bg-muted' : v < 3.3 ? 'bg-primary/30' : v < 3.4 ? 'bg-primary/65 text-primary-foreground' : 'bg-primary text-primary-foreground');

export function DiaryView({ institutionId, semester, unitFilter }: { institutionId?: string; semester: string | null; unitFilter: string }) {
  const [fs, setFs] = useState<string | null>(null);
  const [metric, setMetric] = useState<'both' | 'humor' | 'sono'>('both');
  const [view, setView] = useState<'curve' | 'cols' | 'heat'>('curve');
  const [selW, setSelW] = useState<number | null>(null);
  const q = useQuery({
    queryKey: ['diary-rhythm', institutionId], enabled: !!institutionId,
    queryFn: async () => {
      const { data, error } = await (supabase as any).rpc('get_institution_diary_rhythm', { p_institution_id: institutionId });
      if (error) throw error;
      return data as DiaryPayload;
    },
  });
  const d = q.data;
  const sems = useMemo(() => [...new Set((d?.kpi ?? []).map((k) => k.sem))].sort(), [d]);
  if (q.isLoading) return <LogoLoader className="min-h-[40vh]" />;
  if (q.error) return <div className="rounded-3xl border bg-card p-10 text-center text-muted-foreground">Não foi possível carregar o diário emocional.</div>;
  const sem = semester && sems.includes(semester) ? semester : null;
  const U = unitFilter === 'all' ? '__all__' : unitFilter;
  const k = d?.kpi.find((r) => r.sem === sem && r.unit === U);
  if (!d || !sem || !k) return <div className="rounded-3xl border bg-card p-10 text-center text-muted-foreground">Ainda sem registros do diário suficientes para {semester ?? 'este semestre'} neste recorte. Grupos com menos de 10 pessoas ficam ocultos.</div>;
  const prevSem = sems[sems.indexOf(sem) - 1] ?? null;

  const weeks = d.weekly.filter((w) => w.sem === sem && w.unit === U);
  const humor = weeks.map((w) => Number(w.mood)), sono = weeks.map((w) => Number(w.sleep));
  const exam = examWeeks(weeks.map((w) => w.provas));
  const mH = mean(humor), mS = mean(sono);
  const N = weeks.length;
  const sel = selW != null && selW < N ? selW : Math.max(0, exam.lastIndexOf(true) >= 0 ? exam.lastIndexOf(true) : N - 1);
  const showH = metric !== 'sono', showS = metric !== 'humor';
  const all = [...(showH ? humor : []), ...(showS ? sono : [])];
  const lo = Math.floor((Math.min(...all) - 0.1) * 10) / 10, hi = Math.ceil((Math.max(...all) + 0.1) * 10) / 10;
  const W = 900, H = 300, STEP = N > 1 ? 830 / (N - 1) : 0;
  const X = (i: number) => 50 + i * STEP, Y = (v: number) => 270 - ((v - lo) / (hi - lo || 1)) * 240;
  const path = (a: number[]) => a.map((v, i) => (i === 0 ? `M${X(i)} ${Y(v)}` : `C${(X(i - 1) + X(i)) / 2} ${Y(a[i - 1])} ${(X(i - 1) + X(i)) / 2} ${Y(v)} ${X(i)} ${Y(v)}`)).join(' ');
  const ins = examInsight(humor, sono, exam);
  const det = weeks[sel];

  const elig = d.elig[U] ?? 0;
  const kpis = [
    { label: 'Pessoas que registraram', value: int(k.people), note: `${elig ? Math.round((k.people / elig) * 100) : 0}% dos elegíveis` },
    { label: 'Registros no semestre', value: int(k.entries), note: 'conta registros, não pessoas' },
    { label: 'Registros por pessoa', value: int(k.median), note: 'mediana · voluntário, sem meta' },
    { label: 'Ativos nas últimas 2 semanas', value: `${k.people ? Math.round((k.active14 / k.people) * 100) : 0}%`, note: `${int(k.active14)} dos que já registraram` },
  ];

  const unitsList = [...new Set(d.dist.filter((r) => r.sem === sem && r.unit !== '__all__').map((r) => r.unit))].sort();
  const distRows = ['__all__', ...unitsList].map((u) => {
    const r = d.dist.filter((x) => x.sem === sem && x.unit === u);
    const t = r.reduce((s, x) => s + x.n, 0) || 1;
    return { nome: u === '__all__' ? 'Toda a instituição' : u, segs: [1, 2, 3, 4, 5].map((sc) => Math.round(((r.find((x) => x.score === sc)?.n ?? 0) / t) * 100)) };
  });

  const emoNow = d.emo.filter((e) => e.sem === sem && e.unit === U);
  const emoPrev = d.emo.filter((e) => e.sem === prevSem && e.unit === U);
  const eTot = emoNow.reduce((s, e) => s + e.n, 0), ePrevTot = emoPrev.reduce((s, e) => s + e.n, 0);
  const emoPeople = emoNow.reduce((s, e) => Math.max(s, e.people), 0);
  const emos = eTot >= 30 && emoPeople >= 10 ? Object.values(emoNow.reduce<Record<string, { id: string; fam: string; n: number }>>((acc, e) => {
    acc[e.emotion_id] = { id: e.emotion_id, fam: e.family_id, n: (acc[e.emotion_id]?.n ?? 0) + e.n }; return acc;
  }, {})).sort((a, b) => b.n - a.n).slice(0, 8).map((e) => {
    const v = Math.round((e.n / eTot) * 100);
    const p = ePrevTot >= 30 ? Math.round(((emoPrev.filter((x) => x.emotion_id === e.id).reduce((s, x) => s + x.n, 0)) / ePrevTot) * 100) : null;
    return { l: getEmotionLabel(e.id), v, d: ppChange(v, p), hard: famValence[e.fam] === 'unpleasant' };
  }) : [];
  const eMax = Math.max(1, ...emos.map((e) => e.v));

  const tot = d.totals.find((t) => t.sem === sem && t.unit === U);
  const ctx = d.ctx.filter((c) => c.sem === sem && c.unit === U).map((c) => ({ l: c.tag, v: tot?.n ? Math.round((c.n / tot.n) * 100) : 0, ex: c.tag === 'Provas' && tot?.n_exam ? 0 : 0 })).sort((a, b) => b.v - a.v);
  const cMax = Math.max(1, ...ctx.map((c) => c.v));
  const examWeekProvas = weeks.filter((_, i) => exam[i]).map((w) => w.provas);

  const dow = d.dow.filter((x) => x.sem === sem && x.unit === U).map((x) => ({ dow: x.dow, mood: Number(x.mood) })).sort((a, b) => a.dow - b.dow);
  const hl = hardestLightest(dow);
  const dowMean = mean(dow.map((x) => x.mood));

  const monthTicks = weeks.map((w, i) => ({ i, m: new Date(w.wk + 'T12:00:00').getMonth() })).filter((t, i, a) => i === 0 || a[i - 1].m !== t.m);

  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-primary">Diário emocional · registros voluntários</p>
        <h1 className="text-[34px] font-semibold leading-tight tracking-tight">O ritmo emocional do semestre</h1>
        <p className="max-w-[62ch] text-muted-foreground">Humor, sono, emoções e contextos marcados pelos estudantes, somados por semana. Textos livres nunca aparecem aqui.</p>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((x) => (
          <div key={x.label} className="rounded-[22px] border bg-card p-5">
            <p className="text-sm text-muted-foreground">{x.label}</p>
            <p className="mt-1 text-[32px] font-semibold tabular-nums leading-tight">{x.value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{x.note}</p>
          </div>
        ))}
      </div>

      <Sheet id="s1" open={fs} setOpen={setFs} label="Humor e sono, semana a semana" className="space-y-5">
        <H2 title="Humor e sono, semana a semana" sub={`Média semanal de 1 (muito difícil) a 5 (muito bom) · ${sem}. Troque a visualização e toque em uma semana para ver o detalhe.`} />
        <div className="flex flex-wrap gap-3">
          <div className="flex rounded-full bg-muted p-1">
            {([['both', 'Humor e sono'], ['humor', 'Humor'], ['sono', 'Sono']] as const).map(([m, l]) => (
              <button key={m} type="button" onClick={() => setMetric(m)} aria-pressed={metric === m} className={`rounded-full px-3.5 py-1.5 text-sm ${metric === m ? 'bg-card font-semibold text-primary shadow-sm' : 'text-muted-foreground'}`}>{l}</button>
            ))}
          </div>
          <div className="flex rounded-full bg-muted p-1">
            {([['curve', 'Curva'], ['cols', 'Colunas'], ['heat', 'Mapa de calor']] as const).map(([m, l]) => (
              <button key={m} type="button" onClick={() => setView(m)} aria-pressed={view === m} className={`rounded-full px-3.5 py-1.5 text-sm ${view === m ? 'bg-card font-semibold text-primary shadow-sm' : 'text-muted-foreground'}`}>{l}</button>
            ))}
          </div>
        </div>
        <div className="grid gap-6 xl:grid-cols-[1fr_300px]">
          <div className="min-w-0">
            {view === 'curve' && (
              <div className="relative">
                <svg viewBox={`0 0 ${W} ${H + 20}`} className="w-full" role="img" aria-label="Humor e sono por semana">
                  {exam.map((e, i) => e && <rect key={i} x={X(i) - STEP / 2} y={20} width={STEP} height={250} className="fill-muted" />)}
                  {[lo, (lo + hi) / 2, hi].map((v) => (
                    <g key={v}><line x1={40} x2={890} y1={Y(v)} y2={Y(v)} className="stroke-border" strokeDasharray="2 4" /><text x={4} y={Y(v) + 4} className="fill-muted-foreground text-[11px]">{br(v)}</text></g>
                  ))}
                  {showH && <path d={path(humor)} fill="none" className="stroke-primary" strokeWidth={3} />}
                  {showS && <path d={path(sono)} fill="none" className="stroke-primary/50" strokeWidth={3} strokeDasharray="7 5" />}
                  <line x1={X(sel)} x2={X(sel)} y1={20} y2={270} className="stroke-primary/40" />
                  {showH && <circle cx={X(sel)} cy={Y(humor[sel])} r={6} className="fill-primary stroke-card" strokeWidth={2} />}
                  {showS && <circle cx={X(sel)} cy={Y(sono[sel])} r={6} className="fill-primary/50 stroke-card" strokeWidth={2} />}
                  {monthTicks.map((t) => <text key={t.i} x={X(t.i)} y={H + 10} textAnchor="middle" className="fill-muted-foreground text-[12px]">{MONTHS[t.m]}</text>)}
                </svg>
                <div className="absolute inset-0 flex" style={{ paddingLeft: `${((50 - STEP / 2) / W) * 100}%` }}>
                  {weeks.map((w, i) => <button key={w.wk} type="button" title={`Semana ${i + 1} · humor ${br(humor[i], 2)} · sono ${br(sono[i], 2)}`} onClick={() => setSelW(i)} style={{ width: `${(STEP / W) * 100}%` }} className="h-full" />)}
                </div>
              </div>
            )}
            {view === 'cols' && (
              <div className="space-y-3">
                <div className="relative h-[260px] border-y">
                  <div className="absolute inset-x-0 top-1/2 border-t border-foreground/30" />
                  <div className="absolute inset-0 flex items-stretch gap-1">
                    {weeks.map((w, i) => {
                      const v = showH ? humor[i] : sono[i], m = showH ? mH : mS, maxD = Math.max(0.01, ...(showH ? humor : sono).map((x) => Math.abs(x - m))), dv = ((v - m) / maxD) * 118;
                      return (
                        <button key={w.wk} type="button" onClick={() => setSelW(i)} title={`Semana ${i + 1}`} className={`relative flex-1 rounded ${exam[i] ? 'bg-muted' : ''} ${i === sel ? 'ring-2 ring-primary' : ''}`}>
                          <span className={`absolute inset-x-1 rounded ${dv >= 0 ? 'bg-primary/70' : 'bg-destructive/50'}`} style={dv >= 0 ? { bottom: '50%', height: Math.max(2, dv) } : { top: '50%', height: Math.max(2, -dv) }} />
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="flex gap-1">{weeks.map((w, i) => <span key={w.wk} className={`flex-1 rounded text-center text-[11px] ${exam[i] ? 'bg-muted font-semibold' : 'text-muted-foreground'}`}>{i + 1}</span>)}</div>
                <p className="text-xs text-muted-foreground">Cada coluna mostra o desvio da semana em relação à média do semestre ({br(showH ? mH : mS, 2)}). A linha central é a média; o número abaixo é a semana.</p>
              </div>
            )}
            {view === 'heat' && (
              <div className="space-y-3 overflow-x-auto">
                <table className="w-full border-separate border-spacing-1 text-[11px]">
                  <thead><tr><th />{weeks.map((w, i) => <th key={w.wk} className={`rounded font-medium ${exam[i] ? 'bg-muted' : 'text-muted-foreground'}`}>{i + 1}</th>)}</tr></thead>
                  <tbody>
                    {([showH && ['Humor', humor], showS && ['Sono', sono]].filter(Boolean) as [string, number[]][]).map(([l, a]) => (
                      <tr key={l}><th className="pr-2 text-left font-medium">{l}</th>{a.map((v, i) => <td key={i} onClick={() => setSelW(i)} className={`h-10 cursor-pointer rounded text-center font-semibold tabular-nums ${heatTone(v)} ${i === sel ? 'ring-2 ring-primary' : ''}`}>{br(v)}</td>)}</tr>
                    ))}
                  </tbody>
                </table>
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">Escala:{[[2.9, 'abaixo de 3,0'], [3.1, '3,0 a 3,2'], [3.25, '3,2 a 3,3'], [3.35, '3,3 a 3,4'], [3.5, '3,4 ou mais']].map(([v, l]) => <span key={l} className="flex items-center gap-1"><i className={`h-3 w-5 rounded ${heatTone(v as number)}`} />{l}</span>)}</div>
              </div>
            )}
            <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
              {showH && view === 'curve' && <span className="flex items-center gap-1.5"><i className="h-[3px] w-[18px] bg-primary" />Humor</span>}
              {showS && view === 'curve' && <span className="flex items-center gap-1.5"><i className="w-[18px] border-t-[3px] border-dashed border-primary/50" />Sono percebido</span>}
              <span className="flex items-center gap-1.5"><i className="h-3 w-3.5 rounded-sm bg-muted" />Semana de provas</span>
            </div>
          </div>
          {det && (
            <aside className="space-y-4 rounded-2xl bg-muted/40 p-5">
              <div><p className="text-xs uppercase tracking-wider text-muted-foreground">Semana selecionada</p>
                <p className="text-xl font-semibold">Semana {sel + 1}</p>
                <p className="text-xs text-muted-foreground">{exam[sel] ? 'Semana de provas' : new Date(det.wk + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</p></div>
              {([['Humor', humor[sel], mH], ['Sono percebido', sono[sel], mS]] as const).map(([l, v, m]) => {
                const dd = dev(v, m);
                return (
                  <div key={l} className="space-y-1">
                    <div className="flex justify-between text-sm"><span>{l}</span><span className="font-semibold tabular-nums">{br(v, 2)}</span></div>
                    <p className={`text-xs ${dd < -0.1 ? 'text-destructive' : 'text-muted-foreground'}`}>{dd === 0 ? 'igual à média' : `${dd > 0 ? '+' : '−'}${br(Math.abs(dd), 2)}`} vs semestre (média {br(m, 2)})</p>
                  </div>
                );
              })}
              <p className="text-sm text-muted-foreground">{det.provas}% dos registros desta semana marcaram "Provas".</p>
            </aside>
          )}
        </div>
        {ins && (
          <div className="grid gap-3 md:grid-cols-2">
            <p className="rounded-2xl bg-accent/60 p-4 text-sm">O humor médio cai de <strong>{br(ins.outside)}</strong> para <strong>{br(ins.during)}</strong> nas semanas de prova.</p>
            <p className="rounded-2xl bg-accent/60 p-4 text-sm">{ins.sleepLeads ? <>O <strong>sono cai antes do humor</strong>: a piora começa uma semana antes de cada período de provas.</> : 'Sono e humor variam juntos ao longo do semestre.'}</p>
          </div>
        )}
      </Sheet>

      <div className="flex flex-wrap items-stretch gap-6">
        <Sheet id="s2" open={fs} setOpen={setFs} label="Como os registros se distribuem" className="min-w-0 flex-[1.3_1_460px] space-y-4">
          <H2 title="Como os registros se distribuem" sub={`Proporção de registros de humor por unidade · ${sem}`} />
          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">{MOOD_LV.map((m) => <span key={m.l} className="flex items-center gap-1.5"><i className={`h-3 w-3.5 rounded-sm ${m.c}`} />{m.l}</span>)}</div>
          {distRows.map((r) => (
            <div key={r.nome} className="space-y-1">
              <p className="text-sm font-medium">{r.nome}</p>
              <div className="flex h-8 overflow-hidden rounded-lg">{r.segs.map((v, i) => <div key={i} title={`${MOOD_LV[i].l}: ${v}%`} className={`flex items-center justify-center text-[11px] font-semibold ${MOOD_LV[i].c}`} style={{ width: `${v}%` }}>{v >= 8 ? `${v}%` : ''}</div>)}</div>
            </div>
          ))}
        </Sheet>
        <Sheet id="s3" open={fs} setOpen={setFs} label="Emoções mais registradas" className="min-w-0 flex-[1_1_360px] space-y-4">
          <H2 title="Emoções mais registradas" sub={`% dos registros${prevSem ? ` · variação desde ${prevSem}` : ''}`} />
          {emos.length ? (
            <>
              {emos.map((e) => (
                <div key={e.l} className="grid grid-cols-[110px_1fr_40px_60px] items-center gap-2 text-sm">
                  <span>{e.l}</span>
                  <div className="h-2.5 rounded-full bg-muted"><div className={`h-2.5 rounded-full ${e.hard ? 'bg-destructive/50' : 'bg-primary/70'}`} style={{ width: `${(e.v / eMax) * 100}%` }} /></div>
                  <span className="text-right font-semibold tabular-nums">{e.v}%</span>
                  <span className="text-right text-xs text-muted-foreground">{e.d == null ? '' : e.d === 0 ? '=' : `${e.d > 0 ? '+' : '−'}${Math.abs(e.d)} p.p.`}</span>
                </div>
              ))}
              <div className="flex gap-4 text-xs text-muted-foreground"><span className="flex items-center gap-1.5"><i className="h-3 w-3.5 rounded-sm bg-destructive/50" />Emoções difíceis</span><span className="flex items-center gap-1.5"><i className="h-3 w-3.5 rounded-sm bg-primary/70" />Emoções agradáveis</span></div>
            </>
          ) : <p className="text-sm text-muted-foreground">Ainda sem dados: poucas pessoas registraram emoções na Jornada Emocional neste recorte.</p>}
        </Sheet>
      </div>

      <div className="flex flex-wrap items-stretch gap-6">
        <Sheet id="s4" open={fs} setOpen={setFs} label="O que está por trás" className="min-w-0 flex-[1_1_380px] space-y-4">
          <H2 title="O que está por trás" sub="Contextos marcados junto ao registro · cada um pode marcar mais de um" />
          {ctx.map((c) => (
            <div key={c.l} className="grid grid-cols-[130px_1fr_44px] items-center gap-3 text-sm">
              <span>{c.l}</span>
              <div className="h-2.5 rounded-full bg-muted"><div className="h-2.5 rounded-full bg-primary" style={{ width: `${(c.v / cMax) * 100}%` }} /></div>
              <span className="text-right font-semibold tabular-nums">{c.v}%</span>
            </div>
          ))}
          {examWeekProvas.length > 0 && <p className="rounded-2xl bg-accent/60 p-4 text-sm">Nas semanas de prova, "Provas" aparece em {Math.round(mean(examWeekProvas))}% dos registros.</p>}
        </Sheet>
        <Sheet id="s5" open={fs} setOpen={setFs} label="Humor por dia da semana" className="min-w-0 flex-[1.2_1_420px] space-y-4">
          <H2 title="Humor por dia da semana" sub={hl ? `${DOW[hl.hardest]} é o dia mais difícil; ${DOW[hl.lightest].toLowerCase()}, o mais leve. Um bom ponto de partida para escolher quando enviar convites e conteúdos.` : undefined} />
          <div className="grid grid-cols-7 gap-2">
            {dow.map((x) => {
              const dd = dev(x.mood, dowMean);
              return (
                <div key={x.dow} className={`space-y-1 rounded-xl p-3 text-center ${heatTone(x.mood)}`}>
                  <p className="text-xs font-medium">{DOW_S[x.dow]}</p>
                  <p className="text-lg font-semibold tabular-nums">{br(x.mood, 2)}</p>
                  <p className="text-[10px] opacity-80">{dd === 0 ? '=' : `${dd > 0 ? '+' : '−'}${br(Math.abs(dd), 2)}`}</p>
                </div>
              );
            })}
          </div>
        </Sheet>
      </div>
    </div>
  );
}
