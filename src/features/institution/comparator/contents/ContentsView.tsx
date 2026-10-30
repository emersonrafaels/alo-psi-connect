import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ArrowDownRight, ArrowRight, ArrowUpRight, Minus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { LogoLoader } from '@/components/ui/logo-loader';
import { Button } from '@/components/ui/button';
import { Sheet, H2 } from '../overview/OverviewView';
import { examWeeks } from '../diary/diaryLogic';
import { conversion, themeGap, peakWeek, trailTrend, attendance, normToPeak } from './contentsLogic';

type ThemeW = { unit: string; semester: string; week_index: number; theme: string; accesses: number; people: number; empty_searches: number; contents_available: number; useful_pct: number | null };
type Trail = { unit: string; semester: string; trail: string; theme: string; format: string; started: number; completed: number; last_month: number; prev_month: number };
type Practice = { unit: string; semester: string; practice: string; times: number; people: number; helped_pct: number | null; sources: Record<string, number>; next_steps: Record<string, number>; hours: Record<string, number> };
type Event = { unit: string; semester: string; title: string; kind: string; event_date: string; capacity: number; registered: number; present: number; rating: number | null; waitlist: number };

const int = (n: number) => Math.round(n).toLocaleString('pt-BR');
const sum = <T,>(a: T[], f: (x: T) => number) => a.reduce((s, x) => s + f(x), 0);
const initials = (s: string) => s.replace(/^Afya\s+/i, '').split(/\s+/).filter((w) => w.length > 2).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
const intensity = (v: number) => (v >= 0.85 ? 'bg-primary' : v >= 0.6 ? 'bg-primary/70' : v >= 0.4 ? 'bg-primary/45' : v >= 0.2 ? 'bg-primary/25' : 'bg-primary/10');
const pill = (on: boolean) => `rounded-full border px-3.5 py-1.5 text-sm ${on ? 'border-primary bg-accent font-semibold text-primary' : 'bg-card text-muted-foreground hover:bg-muted'}`;

async function load(table: string, id: string) {
  const { data, error } = await (supabase as any).from(table).select('*').eq('institution_id', id).limit(5000);
  if (error) throw error;
  return data as any[];
}

export function ContentsView({ institutionId, semester, unitFilter }: { institutionId?: string; semester: string | null; unitFilter: string }) {
  const [fs, setFs] = useState<string | null>(null);
  const [fmt, setFmt] = useState<'all' | 'conteudos' | 'trilhas' | 'praticas' | 'encontros'>('all');
  const [mapView, setMapView] = useState<'chart' | 'table'>('chart');
  const [theme, setTheme] = useState<string | null>(null);
  const [practice, setPractice] = useState<string | null>(null);
  const [kind, setKind] = useState<string | null>(null);

  const q = useQuery({
    queryKey: ['contents-practices', institutionId], enabled: !!institutionId,
    queryFn: async () => {
      const [t, tr, p, e] = await Promise.all(['institution_content_theme_weeks', 'institution_trail_progress', 'institution_practice_usage', 'institution_event_usage'].map((x) => load(x, institutionId!)));
      return { themes: t as ThemeW[], trails: tr as Trail[], practices: p as Practice[], events: e as Event[] };
    },
  });
  const d = q.data;
  const sems = useMemo(() => [...new Set((d?.themes ?? []).map((t) => t.semester))].sort(), [d]);
  if (q.isLoading) return <LogoLoader className="min-h-[40vh]" />;
  if (q.error) return <div className="rounded-3xl border bg-card p-10 text-center text-muted-foreground">Não foi possível carregar conteúdos e práticas.</div>;
  const sem = semester && sems.includes(semester) ? semester : null;
  if (!d || !sem) return <div className="rounded-3xl border bg-card p-10 text-center text-muted-foreground">Ainda sem dados de conteúdos e práticas para {semester ?? 'este semestre'}.</div>;

  const inU = (r: { unit: string }) => unitFilter === 'all' || r.unit === unitFilter;
  const S = <T extends { semester: string; unit: string }>(a: T[]) => a.filter((r) => r.semester === sem && inU(r));
  const themesAllU = d.themes.filter((t) => t.semester === sem);
  const themesU = S(d.themes), trails = S(d.trails), practices = S(d.practices), events = S(d.events);
  const units = [...new Set(themesAllU.map((t) => t.unit))].sort();

  // Themes
  const themeNames = [...new Set(themesU.map((t) => t.theme))];
  const weeksN = Math.max(0, ...themesU.map((t) => t.week_index));
  const totalAcc = sum(themesU, (t) => t.accesses) || 1;
  const contentsTotal = sum(themeNames, (n) => Math.max(0, ...themesU.filter((t) => t.theme === n).map((t) => t.contents_available)));
  const themeRows = themeNames.map((n) => {
    const rows = themesU.filter((t) => t.theme === n);
    const n_contents = Math.max(0, ...rows.map((r) => r.contents_available));
    const acc = sum(rows, (r) => r.accesses);
    const p = Math.round((acc / totalAcc) * 100);
    const series = Array.from({ length: weeksN }, (_, i) => sum(rows.filter((r) => r.week_index === i + 1), (r) => r.accesses));
    const useful = Math.round(sum(rows, (r) => (r.useful_pct ?? 0) * r.accesses) / (acc || 1));
    return { n, acc, p, contents: n_contents, offer: Math.round((n_contents / (contentsTotal || 1)) * 100), useful, empty: sum(rows, (r) => r.empty_searches), people: sum(rows, (r) => r.people), series,
      gap: themeGap(p, Math.round((n_contents / (contentsTotal || 1)) * 100)) };
  }).sort((a, b) => b.p - a.p);
  const anxSeries = themeRows.find((t) => t.n === 'Ansiedade em provas')?.series ?? [];
  const anxTot = anxSeries.map((v, i) => Math.round((v / (sum(themeRows, (t) => t.series[i]) || 1)) * 100));
  const exam = examWeeks(anxTot.map((v) => v * 2));
  const toMonths = (w: number[]) => { const m = Array(12).fill(0); w.forEach((v, i) => { m[Math.min(11, Math.floor(i / 4.345))] += v; }); return m; };
  const examM = Array.from({ length: 12 }, (_, mi) => exam.some((e, i) => e && Math.min(11, Math.floor(i / 4.345)) === mi));
  const tm = themeRows.find((t) => t.n === theme) ?? themeRows[0];

  // Ladder
  const peopleContents = sum(themesU, (t) => t.people);
  const trailsN = new Set(trails.map((t) => t.trail)).size;
  const pr = practices;
  const helpedPr = Math.round(sum(pr, (p) => (p.times * (p.helped_pct ?? 0)) / 100));
  const usefulCt = Math.round(sum(themesU, (t) => (t.people * (t.useful_pct ?? 0)) / 100));
  const ladders = {
    conteudos: { cat: contentsTotal, catLabel: 'conteúdos', steps: [peopleContents, null, usefulCt] },
    trilhas: { cat: trailsN, catLabel: 'trilhas', steps: [sum(trails, (t) => t.started), sum(trails, (t) => t.completed), null] },
    praticas: { cat: new Set(pr.map((p) => p.practice)).size, catLabel: 'práticas', steps: [sum(pr, (p) => p.times), sum(pr, (p) => p.times), helpedPr] },
    encontros: { cat: events.length, catLabel: 'encontros', steps: [sum(events, (e) => e.registered), sum(events, (e) => e.present), null] },
  } as const;
  const lad = fmt === 'all'
    ? { cat: contentsTotal + trailsN + ladders.praticas.cat + events.length, catLabel: 'itens no catálogo', steps: [0, 1, 2].map((i) => sum(Object.values(ladders), (l) => l.steps[i] ?? 0)) as (number | null)[] }
    : ladders[fmt];
  const STEPS = [['Abriram', 'Alguém se interessou?'], ['Foram até o fim', 'O formato segura a atenção?'], ['Disseram que ajudou', 'Fez sentido para quem usou?']];
  const unitOpen = units.map((u) => ({ u, v: sum(themesAllU.filter((t) => t.unit === u), (t) => t.people) }));
  const uMax = Math.max(1, ...unitOpen.map((x) => x.v));
  const weakest = (() => { const s = lad.steps; const c = [conversion(s[0] ?? 0, s[1] ?? 0), conversion(s[1] ?? 0, s[2] ?? 0)]; return s[1] == null ? null : c[0] <= c[1] ? 'entre abrir e ir até o fim' : 'entre concluir e sentir que ajudou'; })();

  // Trails
  const trailAgg = [...new Set(trails.map((t) => t.trail))].map((n) => {
    const r = trails.filter((t) => t.trail === n);
    const st = sum(r, (x) => x.started), cp = sum(r, (x) => x.completed), lm = sum(r, (x) => x.last_month), pm = sum(r, (x) => x.prev_month);
    return { n, theme: r[0].theme, format: r[0].format, st, cp, pct: Math.round((cp / (st || 1)) * 100), lm, trend: trailTrend(lm, pm) };
  }).sort((a, b) => b.st - a.st);
  const noTrail = themeRows.filter((t) => !trails.some((x) => x.theme === t.n) && t.empty > 0).sort((a, b) => b.empty - a.empty).slice(0, 4);
  const hottest = [...trailAgg].sort((a, b) => b.lm - a.lm)[0], leastDone = [...trailAgg].sort((a, b) => a.pct - b.pct)[0];

  // Practices
  const pNames = [...new Set(pr.map((p) => p.practice))];
  const pAgg = pNames.map((n) => {
    const r = pr.filter((p) => p.practice === n); const times = sum(r, (x) => x.times);
    const mix = (k: 'sources' | 'next_steps' | 'hours') => { const m: Record<string, number> = {}; r.forEach((x) => Object.entries(x[k] ?? {}).forEach(([kk, v]) => { m[kk] = (m[kk] ?? 0) + v * x.times; })); const t = sum(Object.values(m), (v) => v) || 1; return Object.entries(m).map(([l, v]) => ({ l, v: Math.round((v / t) * 100) })).sort((a, b) => b.v - a.v); };
    return { n, times, people: sum(r, (x) => x.people), helped: Math.round(sum(r, (x) => (x.helped_pct ?? 0) * x.times) / (times || 1)), sources: mix('sources'), next: mix('next_steps'), hours: mix('hours') };
  }).sort((a, b) => b.times - a.times);
  const pSel = pAgg.find((p) => p.n === practice) ?? pAgg[0];
  const HOURS = ['Manhã', 'Tarde', 'Noite', 'Madrugada'];

  // Events
  const kinds = [...new Set(events.map((e) => e.kind))];
  const evs = events.filter((e) => !kind || e.kind === kind).sort((a, b) => a.event_date.localeCompare(b.event_date));
  const evReg = sum(events, (e) => e.registered), evPres = sum(events, (e) => e.present);
  const bestKind = kinds.map((k) => ({ k, a: attendance(sum(events.filter((e) => e.kind === k), (e) => e.present), sum(events.filter((e) => e.kind === k), (e) => e.registered)) })).sort((a, b) => b.a - a.a)[0];

  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <div className="flex flex-wrap items-center gap-2"><p className="text-xs font-semibold uppercase tracking-wider text-primary">Conteúdos, trilhas, práticas e encontros</p><span className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">Dados demonstrativos</span></div>
        <h1 className="text-[34px] font-semibold leading-tight tracking-tight">O que os estudantes procuram para se cuidar</h1>
        <p className="max-w-[66ch] text-muted-foreground">Uso do catálogo em {sem}: o que existe, o que é aberto, o que vai até o fim e o que as pessoas dizem que ajudou. Contamos pessoas e acessos, nunca listas de quem participou.</p>
      </section>

      <Sheet id="s1" open={fs} setOpen={setFs} label="Do catálogo ao cuidado" className="space-y-5">
        <H2 title="Do catálogo ao cuidado" sub="Cada degrau responde a uma pergunta diferente. Escolha o formato para comparar." />
        <div className="flex flex-wrap gap-2">
          {([['all', 'Todos'], ['conteudos', 'Conteúdos'], ['trilhas', 'Trilhas'], ['praticas', 'Práticas'], ['encontros', 'Encontros']] as const).map(([k, l]) => <button key={k} type="button" onClick={() => setFmt(k)} aria-pressed={fmt === k} className={pill(fmt === k)}>{l}</button>)}
        </div>
        <div className="grid gap-4 lg:grid-cols-[240px_1fr]">
          <div className="space-y-3 rounded-2xl bg-muted/40 p-5">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">O que existe</p>
            <p className="text-[34px] font-semibold tabular-nums leading-none">{int(lad.cat)}</p>
            <p className="text-sm">{lad.catLabel}</p>
            <p className="pt-2 text-xs text-muted-foreground">Pessoas que abriram conteúdos, por unidade</p>
            {unitOpen.map((u) => (
              <div key={u.u} className="grid grid-cols-[28px_1fr_48px] items-center gap-2 text-xs">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/15 font-bold text-primary">{initials(u.u)}</span>
                <div className="h-2 rounded-full bg-muted"><div className="h-2 rounded-full bg-primary" style={{ width: `${(u.v / uMax) * 100}%` }} /></div>
                <span className="text-right tabular-nums">{int(u.v)}</span>
              </div>
            ))}
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {STEPS.map(([l, qq], i) => {
              const v = lad.steps[i]; const prev = i === 0 ? null : lad.steps[i - 1];
              return (
                <div key={l} className="relative flex flex-col justify-end rounded-2xl border p-4">
                  {i > 0 && v != null && prev != null && <span className="absolute -left-3 top-4 rounded-full bg-primary px-2 py-0.5 text-[11px] font-semibold text-primary-foreground">{conversion(prev, v)}%</span>}
                  <div className="mb-3 rounded-xl bg-primary/15" style={{ height: `${v == null ? 8 : Math.max(16, 140 * (v / (lad.steps[0] || 1)))}px` }} />
                  <p className="text-2xl font-semibold tabular-nums">{v == null ? '—' : int(v)}</p>
                  <p className="font-medium">{l}</p>
                  <p className="text-xs text-muted-foreground">{v == null ? 'ainda não medido neste formato' : qq}</p>
                </div>
              );
            })}
          </div>
        </div>
        {weakest && <p className="rounded-2xl bg-accent/60 p-4 text-sm">A maior perda acontece <strong>{weakest}</strong>.</p>}
      </Sheet>

      {themeRows.length > 0 && (
        <Sheet id="s2" open={fs} setOpen={setFs} label="Mapa de temas" className="space-y-5">
          <H2 title="Mapa de temas: procura x oferta" sub="Quanto cada tema é procurado e quantos conteúdos existem sobre ele. Temas acima da linha são procurados além do que o catálogo oferece. Toque em um tema para ver o detalhe." />
          <div className="flex gap-2">{([['chart', 'Gráfico'], ['table', 'Tabela']] as const).map(([k, l]) => <button key={k} type="button" onClick={() => setMapView(k)} className={pill(mapView === k)}>{l}</button>)}</div>
          <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
            {mapView === 'chart' ? (() => {
              const maxP = Math.max(...themeRows.map((t) => t.p)) * 1.15, maxC = Math.max(...themeRows.map((t) => t.contents)) * 1.15;
              const X = (c: number) => 50 + (c / maxC) * 520, Y = (p: number) => 330 - (p / maxP) * 300;
              return (
                <div>
                  <svg viewBox="0 0 600 360" className="w-full" role="img" aria-label="Mapa de temas">
                    <line x1={50} y1={330} x2={570} y2={330} className="stroke-border" /><line x1={50} y1={30} x2={50} y2={330} className="stroke-border" />
                    <line x1={X(0)} y1={Y(0)} x2={X(maxC)} y2={Y((maxC / (contentsTotal || 1)) * 100)} className="stroke-muted-foreground/50" strokeDasharray="5 5" />
                    {themeRows.map((t) => (
                      <g key={t.n} onClick={() => setTheme(t.n)} className="cursor-pointer">
                        <circle cx={X(t.contents)} cy={Y(t.p)} r={8 + Math.sqrt(t.people) / 6} className={t.gap === 'gap' ? 'fill-destructive/60' : t.gap === 'over' ? 'fill-muted-foreground/40' : 'fill-primary/60'} stroke={tm?.n === t.n ? 'hsl(var(--primary))' : 'none'} strokeWidth={3} />
                        <text x={X(t.contents) + 14} y={Y(t.p) + 4} className="fill-foreground text-[12px]">{t.n}</text>
                      </g>
                    ))}
                    <text x={50} y={352} className="fill-muted-foreground text-[11px]">Conteúdos disponíveis no tema →</text>
                    <text x={56} y={24} className="fill-muted-foreground text-[11px]">↑ Procura: % dos acessos e buscas</text>
                  </svg>
                  <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5"><i className="h-3 w-3 rounded-full bg-destructive/60" />Lacunas: procura acima da oferta</span>
                    <span className="flex items-center gap-1.5"><i className="h-3 w-3 rounded-full bg-muted-foreground/40" />Oferta acima da procura</span>
                    <span className="flex items-center gap-1.5"><i className="w-5 border-t border-dashed border-muted-foreground" />Procura proporcional à oferta</span>
                  </div>
                </div>
              );
            })() : (
              <table className="w-full text-sm">
                <thead className="text-left text-xs text-muted-foreground"><tr><th className="py-2">Tema</th><th>Procura</th><th>Conteúdos</th><th>Útil</th></tr></thead>
                <tbody>{themeRows.map((t) => <tr key={t.n} onClick={() => setTheme(t.n)} className={`cursor-pointer border-t ${tm?.n === t.n ? 'bg-accent/50' : ''}`}><td className="py-2 font-medium">{t.n}{t.gap === 'gap' && <span className="ml-2 rounded-full bg-destructive/10 px-2 py-0.5 text-[11px] text-destructive">Lacuna</span>}</td><td className="tabular-nums">{t.p}%</td><td className="tabular-nums">{t.contents}</td><td className="tabular-nums">{t.useful}%</td></tr>)}</tbody>
              </table>
            )}
            {tm && (
              <aside className="space-y-4 rounded-2xl bg-muted/40 p-5">
                <div><p className="text-xs uppercase tracking-wider text-muted-foreground">Tema selecionado</p><p className="text-xl font-semibold">{tm.n} {tm.gap === 'gap' && <span className="ml-1 rounded-full bg-destructive/10 px-2 py-0.5 align-middle text-[11px] text-destructive">Lacuna</span>}</p></div>
                <div className="grid grid-cols-3 gap-2">{[[`${tm.p}%`, 'da procura'], [String(tm.contents), 'conteúdos'], [`${tm.useful}%`, 'acharam útil']].map(([v, l]) => <div key={l} className="rounded-xl bg-card p-3"><p className="text-lg font-semibold tabular-nums">{v}</p><p className="text-[11px] text-muted-foreground">{l}</p></div>)}</div>
                <div>
                  <p className="mb-1 text-xs font-medium">Procura ao longo do semestre</p>
                  <div className="flex h-16 items-end gap-0.5">{normToPeak(tm.series).map((v, i) => <div key={i} className={`flex-1 rounded-t ${exam[i] ? 'bg-muted-foreground/30' : ''}`} style={{ height: '100%' }}><div className="w-full rounded-t bg-primary" style={{ height: `${v * 100}%`, marginTop: `${(1 - v) * 64}px` }} /></div>)}</div>
                  <p className="mt-1 text-[11px] text-muted-foreground">Pico na semana {peakWeek(tm.series) + 1} · faixas cinza = semanas de prova</p>
                </div>
                <div className="space-y-1.5">
                  <p className="text-xs font-medium">Peso do tema nos acessos de cada unidade</p>
                  {units.map((u) => { const tu = themesAllU.filter((t) => t.unit === u); const v = Math.round((sum(tu.filter((t) => t.theme === tm.n), (t) => t.accesses) / (sum(tu, (t) => t.accesses) || 1)) * 100); return <div key={u} className="grid grid-cols-[28px_1fr_36px] items-center gap-2 text-xs"><span className="font-bold text-primary">{initials(u)}</span><div className="h-2 rounded-full bg-muted"><div className="h-2 rounded-full bg-primary" style={{ width: `${v * 2.5}%` }} /></div><span className="text-right tabular-nums">{v}%</span></div>; })}
                </div>
                <p className="rounded-xl bg-card p-3 text-sm"><span className="block text-xs font-semibold text-primary">Sugestão de leitura</span>{tm.gap === 'gap' ? `Procura acima da oferta${tm.empty ? ` e ${int(tm.empty)} buscas sem resultado` : ''}: vale ampliar o catálogo neste tema.` : tm.gap === 'over' ? 'Há mais conteúdo do que procura: divulgar melhor pode ajudar.' : 'Procura e oferta estão equilibradas.'}</p>
              </aside>
            )}
          </div>
        </Sheet>
      )}

      {themeRows.length > 0 && (
        <Sheet id="s3" open={fs} setOpen={setFs} label="Quando cada tema é procurado" className="space-y-4">
          <H2 title="Quando cada tema é procurado" sub="Intensidade mensal de cada tema, comparada com o próprio pico. Toque em uma linha para abrir o tema no mapa acima." />
          <div className="overflow-x-auto">
            <table className="w-full border-separate border-spacing-0.5 text-[11px]">
              <thead><tr><th />{Array.from({ length: 12 }, (_, i) => <th key={i} className={`rounded font-medium ${examM[i] ? 'bg-muted-foreground/25' : 'text-muted-foreground'}`}>{i + 1}</th>)}</tr></thead>
              <tbody>{themeRows.map((t) => { const ms = toMonths(t.series); return (
                <tr key={t.n} onClick={() => setTheme(t.n)} className="cursor-pointer">
                  <th className="whitespace-nowrap pr-3 text-left font-medium">{t.n}</th>
                  {normToPeak(ms).map((v, i) => <td key={i} title={`Mês ${i + 1}: ${int(ms[i])} acessos`} className={`h-7 min-w-[22px] rounded ${ms[i] ? intensity(v) : 'bg-muted/40'} ${v === 1 ? 'ring-2 ring-highlight-pink' : ''}`} />)}
                </tr>
              ); })}</tbody>
            </table>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">Menos{[0.1, 0.3, 0.5, 0.7, 0.9].map((v) => <i key={v} className={`h-3 w-5 rounded ${intensity(v)}`} />)}<span className="ml-3 flex items-center gap-1"><i className="h-3 w-3 rounded ring-2 ring-highlight-pink" />Pico do tema</span><span className="ml-3 flex items-center gap-1"><i className="h-3 w-4 rounded bg-muted-foreground/25" />Mês com provas (cabeçalho)</span></div>
        </Sheet>
      )}

      {trailAgg.length > 0 && (
        <Sheet id="s4" open={fs} setOpen={setFs} label="Trilhas" className="space-y-4">
          <H2 title="Trilhas" sub="As trilhas disponíveis, quantas pessoas começaram e terminaram, e o que está sendo procurado agora." />
          <div className="overflow-x-auto"><table className="w-full text-sm">
            <thead className="text-left text-xs text-muted-foreground"><tr><th className="py-2">Trilha</th><th>Tema</th><th>Formato</th><th>Iniciaram</th><th>Concluíram</th><th>Último mês</th></tr></thead>
            <tbody>{trailAgg.map((t) => { const I = t.trend === 'up' ? ArrowUpRight : t.trend === 'down' ? ArrowDownRight : Minus; return (
              <tr key={t.n} className="border-t"><td className="py-2.5 font-medium">{t.n}</td><td className="text-muted-foreground">{t.theme}</td><td className="text-muted-foreground">{t.format}</td><td className="tabular-nums">{int(t.st)}</td><td className="tabular-nums"><span className="font-semibold">{t.pct}%</span> <span className="text-muted-foreground">{int(t.cp)}</span></td><td className="tabular-nums"><span className={`inline-flex items-center gap-1 ${t.trend === 'up' ? 'text-primary' : 'text-muted-foreground'}`}><I className="h-3.5 w-3.5" />{int(t.lm)}</span></td></tr>
            ); })}</tbody>
          </table></div>
          {noTrail.length > 0 && <div className="flex flex-wrap gap-2"><span className="text-xs font-medium text-muted-foreground">Temas procurados que ainda não têm trilha:</span>{noTrail.map((t) => <span key={t.n} className="rounded-full border border-dashed px-3 py-1 text-xs">{t.n} · {int(t.empty)} buscas sem resultado</span>)}</div>}
          {hottest && leastDone && <p className="rounded-2xl bg-accent/60 p-4 text-sm"><strong>{hottest.n}</strong> é a mais procurada no último mês. <strong>{leastDone.n}</strong> é a menos concluída: só {leastDone.pct}% terminam.</p>}
        </Sheet>
      )}

      {pSel && (
        <Sheet id="s5" open={fs} setOpen={setFs} label="Práticas" className="space-y-5">
          <H2 title="Práticas: como chegam e o que acontece depois" sub={`${int(sum(pAgg, (p) => p.times))} práticas realizadas por cerca de ${int(sum(pAgg, (p) => p.people))} pessoas. Escolha uma prática para ver de onde as pessoas vêm, a que horas praticam e o que fazem em seguida.`} />
          <div className="flex flex-wrap gap-2">{pAgg.map((p) => <button key={p.n} type="button" onClick={() => setPractice(p.n)} aria-pressed={pSel.n === p.n} className={pill(pSel.n === p.n)}>{p.n} <span className="opacity-70">{int(p.times)} vezes · {p.helped}% ajudou</span></button>)}</div>
          <div className="grid gap-4 lg:grid-cols-3">
            {([['De onde vêm', pSel.sources], ['O que fazem depois', pSel.next]] as const).map(([t, rows]) => (
              <div key={t} className="space-y-2 rounded-2xl border p-4">
                <p className="font-semibold">{t}</p>
                {rows.map((g) => <div key={g.l} className="space-y-1"><div className="flex justify-between text-xs"><span>{g.l}</span><span className="font-semibold tabular-nums">{g.v}%</span></div><div className="h-2 rounded-full bg-muted"><div className="h-2 rounded-full bg-primary" style={{ width: `${g.v * 2}%` }} /></div></div>)}
              </div>
            ))}
            <div className="space-y-2 rounded-2xl border p-4">
              <p className="font-semibold">A que horas praticam</p>
              <div className="flex h-32 items-end gap-3">{HOURS.map((h) => { const v = pSel.hours.find((x) => x.l === h)?.v ?? 0; return <div key={h} className="flex flex-1 flex-col items-center gap-1"><span className="text-xs font-semibold tabular-nums">{v}%</span><div className="w-full rounded-t-lg bg-primary/70" style={{ height: `${v * 2}px` }} /><span className="text-[11px] text-muted-foreground">{h}</span></div>; })}</div>
              <p className="text-xs text-muted-foreground">{(() => { const top = [...pSel.hours].sort((a, b) => b.v - a.v)[0]; return top ? `${top.l} concentra ${top.v}% das vezes em que "${pSel.n}" é feita.` : ''; })()}</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">Concluir uma prática mostra procura e utilidade percebida, não redução clínica de ansiedade.</p>
        </Sheet>
      )}

      {events.length > 0 && (
        <Sheet id="s6" open={fs} setOpen={setFs} label="Encontros, rodas e oficinas" className="space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-3 pr-10">
            <H2 title="Encontros, rodas e oficinas" sub={`${events.length} encontros no semestre · ${int(evReg)} inscrições · ${int(evPres)} presenças. Escolha um tipo para filtrar.`} />
            <Button asChild variant="outline" size="sm"><Link to="/encontros" onClick={() => window.scrollTo(0, 0)}>Ver agenda de encontros</Link></Button>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {kinds.map((k) => { const r = events.filter((e) => e.kind === k); return (
              <button key={k} type="button" onClick={() => setKind(kind === k ? null : k)} aria-pressed={kind === k} className={`rounded-2xl border p-4 text-left ${kind === k ? 'border-primary bg-accent/50' : ''}`}>
                <p className="font-semibold">{k}</p><p className="text-2xl font-semibold tabular-nums">{attendance(sum(r, (e) => e.present), sum(r, (e) => e.registered))}%</p><p className="text-xs text-muted-foreground">presença · {r.length} encontros</p>
              </button>
            ); })}
          </div>
          <div className="overflow-x-auto"><table className="w-full text-sm">
            <thead className="text-left text-xs text-muted-foreground"><tr><th className="py-2">Encontro</th><th>Unidade</th><th className="w-[30%]">Inscritos e presentes</th><th>Presença</th><th>Nota</th></tr></thead>
            <tbody>{evs.map((e) => (
              <tr key={e.title + e.event_date} className="border-t">
                <td className="py-2.5"><p className="font-medium">{e.title}</p><p className="text-xs text-muted-foreground">{e.kind} · {new Date(e.event_date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}{e.registered >= e.capacity && <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">Lotou · {e.waitlist} na lista de interesse</span>}</p></td>
                <td><span className="mr-1 font-bold text-primary">{initials(e.unit)}</span>{e.unit.replace(/^Afya\s+/, '')}</td>
                <td><div className="relative h-3 rounded-full bg-muted"><div className="absolute inset-y-0 left-0 rounded-full bg-primary/30" style={{ width: `${(e.registered / 120) * 100}%` }} /><div className="absolute inset-y-0 left-0 rounded-full bg-primary" style={{ width: `${(e.present / 120) * 100}%` }} /></div></td>
                <td className="tabular-nums"><span className="font-semibold">{attendance(e.present, e.registered)}%</span> <span className="text-xs text-muted-foreground">{e.present}/{e.registered}</span></td>
                <td className="tabular-nums">{e.rating == null ? '—' : Number(e.rating).toLocaleString('pt-BR', { minimumFractionDigits: 1 })}</td>
              </tr>
            ))}</tbody>
          </table></div>
          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground"><span className="flex items-center gap-1.5"><i className="h-3 w-4 rounded bg-primary" />Presentes</span><span className="flex items-center gap-1.5"><i className="h-3 w-4 rounded bg-primary/30" />Inscritos</span><span>Escala de 0 a 120 pessoas</span></div>
          {bestKind && <p className="rounded-2xl bg-accent/60 p-4 text-sm"><strong>{bestKind.k}</strong> tem a maior presença ({bestKind.a}% dos inscritos).</p>}
        </Sheet>
      )}

      <section aria-label="Continue a leitura" className="space-y-3 rounded-[28px] border bg-card p-5 md:p-8">
        <h2 className="text-[22px] font-semibold">Continue a leitura</h2>
        <div className="grid gap-3 md:grid-cols-3">
          {([['diario', 'Diário emocional', 'O ritmo emocional do semestre'], ['atendimentos', 'Atendimentos', 'Oferta de cuidado e procura'], ['jornada', 'Jornada de cuidado', 'Do pedido ao acompanhamento']] as const).map(([k, l, s]) => (
            <a key={k} href={`?leitura=${k}`} className="flex items-center gap-3 rounded-2xl border p-4 hover:bg-muted/50"><span className="flex-1"><span className="block font-semibold">{l}</span><span className="text-xs text-muted-foreground">{s}</span></span><ArrowRight className="h-4 w-4 text-primary" /></a>
          ))}
        </div>
      </section>
    </div>
  );
}
