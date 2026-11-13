import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  AlertTriangle, ArrowDownRight, ArrowRight, ArrowUpRight, Building2, CalendarDays, ClipboardList, Clock, LifeBuoy, Minus,
  Radar, RefreshCw, ShieldCheck, Activity, Users, X, Stethoscope, Sparkles, CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TourOverlay } from '@/components/ui/tour-overlay';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { InfoTip } from './InfoTip';
import { HELP, LEVELS, institutionStatus, outcomeLabel, rankInstitutions, safePct, trend, trendIsGood, type ClinicalSummary } from './clinicalHomeLogic';

const TOUR_KEY = (uid: string) => `clinical-home-tour-v2:${uid}`;
const TOUR = [
  { id: 'prio', title: 'Prioridades de hoje', description: 'O que precisa de ação clínica agora, em ordem de gravidade.', target: '[data-tour="ch-prio"]' },
  { id: 'health', title: 'Saúde da rede', description: 'Níveis de sinal e médias dos últimos 30 dias, comparados aos 30 anteriores.', target: '[data-tour="ch-health"]' },
  { id: 'flow', title: 'Fluxo de cuidado', description: 'Tempos médios entre pedido, triagem e primeira consulta.', target: '[data-tour="ch-flow"]' },
  { id: 'inst', title: 'Instituições', description: 'Ordenadas por quem precisa de mais atenção. "Abrir" leva ao portal completo.', target: '[data-tour="ch-inst"]' },
];
const dot = { critical: 'bg-destructive', warning: 'bg-destructive/40', ok: 'bg-success' } as const;
const STATUS_TXT = { critical: 'Ação imediata', warning: 'Acompanhar', ok: 'Em dia' } as const;
const LEVEL_STROKE: Record<string, string> = {
  critical: 'hsl(var(--destructive))', alert: 'hsl(var(--destructive) / 0.6)', attention: 'hsl(var(--destructive) / 0.3)',
  healthy: 'hsl(var(--success))', none: 'hsl(var(--muted-foreground) / 0.35)',
};
const fmt = (n: number | null | undefined, d = 1) => (n == null ? '—' : Number(n).toLocaleString('pt-BR', { maximumFractionDigits: d }));

const Panel = ({ children, className, ...rest }: { children: ReactNode; className?: string } & React.HTMLAttributes<HTMLElement>) => (
  <section {...rest} className={cn('rounded-[28px] border bg-card p-5 md:p-7 animate-in fade-in slide-in-from-bottom-2 duration-500', className)}>{children}</section>
);
const H2 = ({ title, sub, icon: Icon, right }: { title: string; sub?: ReactNode; icon?: typeof Users; right?: ReactNode }) => (
  <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
    <div>
      <h2 className="flex items-center gap-2 text-[20px] font-semibold leading-tight">
        {Icon && <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary"><Icon className="h-4 w-4" /></span>}{title}
      </h2>
      {sub && <p className="mt-1.5 max-w-[62ch] text-sm text-muted-foreground">{sub}</p>}
    </div>
    {right}
  </div>
);

function Donut({ parts, total, center }: { parts: { key: string; n: number }[]; total: number; center: ReactNode }) {
  const r = 52, c = 2 * Math.PI * r; let acc = 0;
  return (
    <div className="relative h-44 w-44 shrink-0">
      <svg viewBox="0 0 128 128" className="h-full w-full -rotate-90" role="img" aria-label="Distribuição dos níveis de sinal">
        <circle cx="64" cy="64" r={r} fill="none" stroke="hsl(var(--muted))" strokeWidth="14" />
        {total > 0 && parts.map((p) => {
          const len = (p.n / total) * c; const el = (
            <circle key={p.key} cx="64" cy="64" r={r} fill="none" stroke={LEVEL_STROKE[p.key]} strokeWidth="14"
              strokeDasharray={`${Math.max(0, len - 1.5)} ${c}`} strokeDashoffset={-acc} className="transition-all duration-700"><title>{p.n}</title></circle>
          ); acc += len; return el;
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">{center}</div>
    </div>
  );
}

function Ring({ pct }: { pct: number | null }) {
  const r = 30, c = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 72 72" className="h-20 w-20 -rotate-90" aria-hidden>
      <circle cx="36" cy="36" r={r} fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
      <circle cx="36" cy="36" r={r} fill="none" stroke="hsl(var(--primary))" strokeWidth="8" strokeLinecap="round"
        strokeDasharray={`${((pct ?? 0) / 100) * c} ${c}`} className="transition-all duration-700" />
    </svg>
  );
}

export default function ClinicalHome({ userId }: { userId: string }) {
  const q = useQuery({
    queryKey: ['clinical-home', userId],
    queryFn: async () => {
      const { data, error } = await (supabase as any).rpc('get_clinical_home_summary');
      if (error) throw error;
      return data as ClinicalSummary;
    },
  });
  const s = q.data;
  const [tourStep, setTourStep] = useState(-1);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [hideInfo, setHideInfo] = useState(() => localStorage.getItem('clinical-home-info-hidden') === '1');
  useEffect(() => { if (!localStorage.getItem(TOUR_KEY(userId))) setTourStep(0); }, [userId]);
  const endTour = () => { localStorage.setItem(TOUR_KEY(userId), '1'); setTourStep(-1); };

  const ranked = useMemo(() => {
    if (!s) return [];
    const t = query.trim().toLowerCase();
    return rankInstitutions(s.by_institution).filter((i) => (!t || i.name.toLowerCase().includes(t)) && (
      filter === 'all' || (filter === 'urgent' && i.triage_urgent > 0) || (filter === 'triage' && i.triage_open > 0) ||
      (filter === 'overdue' && i.followups_overdue > 0) || (filter === 'care' && i.care_stalled > 0)));
  }, [s, query, filter]);

  const prio = !s ? [] : [
    { label: 'Sinal elevado sem triagem', value: s.elevated_untriaged, icon: AlertTriangle, sev: 'critical', to: '/portal-institucional/triagem' },
    { label: 'Prioridade alta em aberto', value: s.triage_urgent, icon: AlertTriangle, sev: 'critical', to: '/portal-institucional/triagem' },
    { label: 'Retornos vencidos', value: s.followups_overdue, icon: Clock, sev: 'warning', to: '/portal-institucional/triagem' },
    { label: 'Pedidos parados > 3 dias', value: s.care_stalled, icon: LifeBuoy, sev: 'warning', to: '/portal-institucional/comparador' },
    { label: 'Triagens em aberto', value: s.triage_open, icon: ClipboardList, sev: 'info', to: '/portal-institucional/triagem' },
    { label: 'Sinal elevado em 7 dias', value: s.elevated_7d, icon: Activity, sev: 'info', to: '/portal-institucional/triagem' },
  ];
  const actionsToday = prio.filter((p) => p.sev !== 'info' && p.value > 0).reduce((a, p) => a + p.value, 0);
  const levelTotal = s ? Object.values(s.levels ?? {}).reduce((a, b) => a + b, 0) : 0;
  const withData = levelTotal - (s?.levels?.none ?? 0);
  const cur = s?.averages?.cur, prev = s?.averages?.prev;
  const avgs = [
    { label: 'Humor', c: cur?.mood, p: prev?.mood, inv: false },
    { label: 'Ansiedade', c: cur?.anx, p: prev?.anx, inv: true },
    { label: 'Sono', c: cur?.sleep, p: prev?.sleep, inv: false },
    { label: 'Energia', c: cur?.energy, p: prev?.energy, inv: false },
  ];
  const outcomes = s ? Object.entries(s.flow.outcomes).sort((a, b) => b[1] - a[1]) : [];
  const outcomeMax = Math.max(1, ...outcomes.map(([, n]) => n));
  const radarPct = s ? safePct(s.radar_answered, s.students) : null;
  const engagedPct = s ? safePct(s.engaged_7d, s.students) : null;
  const radarLow = s ? [...s.by_institution].filter((i) => i.students >= 10).sort((a, b) => a.radar_answered / a.students - b.radar_answered / b.students).slice(0, 3) : [];

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden rounded-[28px] border bg-card p-6 md:p-8 animate-in fade-in duration-500">
        <div aria-hidden className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-primary/15 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -bottom-24 left-1/3 h-56 w-56 rounded-full bg-accent/40 blur-3xl" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary"><Stethoscope className="h-3.5 w-3.5" />Coordenação clínica</span>
              <span className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs text-muted-foreground">
                <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-60" /><span className="relative inline-flex h-2 w-2 rounded-full bg-success" /></span>
                <span className="capitalize">{format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })}</span>
              </span>
            </div>
            <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">Meu espaço</h1>
            <p className="max-w-[56ch] text-muted-foreground">
              {!s ? 'Visão clínica de toda a rede.' : actionsToday > 0
                ? <><span className="font-semibold text-foreground">{actionsToday.toLocaleString('pt-BR')} situações</span> pedem ação clínica hoje em {s.by_institution.length} instituições.</>
                : <>Nenhuma situação urgente agora. A rede acompanha {s.students.toLocaleString('pt-BR')} alunos.</>}
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              <Button asChild size="sm" className="rounded-xl"><Link to="/portal-institucional/triagem">Abrir triagem <ArrowRight className="ml-1 h-4 w-4" /></Link></Button>
              <Button variant="outline" size="sm" className="rounded-xl" onClick={() => setTourStep(0)}><Sparkles className="mr-1 h-4 w-4" />Ver tour</Button>
              <Button variant="ghost" size="sm" className="rounded-xl" onClick={() => q.refetch()} disabled={q.isFetching}><RefreshCw className={cn('mr-1 h-4 w-4', q.isFetching && 'animate-spin')} />Atualizar</Button>
            </div>
          </div>
          {s && (
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {[
                { k: 'Alunos', v: s.students.toLocaleString('pt-BR') },
                { k: 'Instituições', v: s.by_institution.length.toLocaleString('pt-BR') },
                { k: 'Diário em 7 dias', v: engagedPct == null ? '—' : `${engagedPct}%` },
              ].map((x) => (
                <div key={x.k} className="rounded-2xl border bg-background/70 px-4 py-3 backdrop-blur">
                  <p className="text-2xl font-semibold tabular-nums">{x.v}</p>
                  <p className="text-xs text-muted-foreground">{x.k}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {!hideInfo && <div className="flex items-start gap-3 rounded-2xl border-l-4 border-primary bg-primary/5 p-4 text-sm">
        <ShieldCheck className="h-5 w-5 shrink-0 text-primary" />
        <div className="flex-1 space-y-1">
          <p className="font-semibold">Como ler este painel</p>
          <p>Os números são totais e médias de toda a rede. Os alunos aparecem sempre como "Aluno #N" e você nunca vê o que escreveram. Percentuais de grupos com menos de 10 alunos ficam ocultos.</p>
          <p className="text-muted-foreground">Os níveis de sinal ajudam a priorizar a triagem e não são diagnóstico. Passe o mouse ou toque no ícone ⓘ para ver o que cada indicador mede.</p>
        </div>
        <button type="button" aria-label="Fechar explicação" onClick={() => { localStorage.setItem('clinical-home-info-hidden', '1'); setHideInfo(true); }} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
      </div>}

      {q.isLoading && (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-32 animate-pulse rounded-3xl bg-muted" />)}</div>
      )}
      {q.isError && <p className="text-sm text-destructive">Não foi possível carregar o resumo clínico.</p>}

      {s && (<>
        {/* Priorities */}
        <section data-tour="ch-prio" aria-label="Prioridades de hoje" className="space-y-3">
          <div className="flex items-baseline justify-between"><h2 className="text-[20px] font-semibold">Prioridades de hoje</h2><span className="text-xs text-muted-foreground">Clique para abrir a lista</span></div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
            {prio.map((p, idx) => {
              const hot = p.value > 0 && p.sev !== 'info';
              return (
                <Link key={p.label} to={p.to} style={{ animationDelay: `${idx * 60}ms` }}
                  className={cn('group relative flex flex-col gap-2 rounded-3xl border bg-card p-4 transition-all hover:-translate-y-0.5 hover:shadow-lg animate-in fade-in slide-in-from-bottom-2 fill-mode-both duration-500',
                    hot && p.sev === 'critical' && 'border-destructive/50 bg-destructive/5',
                    hot && p.sev === 'warning' && 'border-destructive/25')}>
                  <div className="flex items-center justify-between">
                    <span className={cn('flex h-9 w-9 items-center justify-center rounded-xl', hot ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary')}><p.icon className="h-4 w-4" /></span>
                    {hot && p.sev === 'critical' && <span className="relative flex h-2.5 w-2.5"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-destructive opacity-60" /><span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-destructive" /></span>}
                    {!hot && p.sev !== 'info' && <CheckCircle2 className="h-4 w-4 text-success" />}
                  </div>
                  <p className="text-3xl font-semibold tabular-nums">{p.value.toLocaleString('pt-BR')}</p>
                  <p className="flex items-start gap-1 text-xs text-muted-foreground">{p.label}<InfoTip label={p.label} text={HELP[p.label]} /></p>
                  <ArrowRight className="absolute bottom-4 right-4 h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                </Link>
              );
            })}
          </div>
        </section>

        {/* Network health */}
        <div data-tour="ch-health" className="grid gap-4 lg:grid-cols-5">
          <Panel className="lg:col-span-3">
            <H2 icon={Activity} title="Níveis de sinal · últimos 30 dias" sub="Quantos alunos estão em cada nível, pelo último registro analisado no diário. Classificação de apoio à triagem, nunca diagnóstico." />
            <div className="flex flex-col items-center gap-6 sm:flex-row">
              <Donut total={levelTotal} parts={LEVELS.map((l) => ({ key: l.key, n: s.levels?.[l.key] ?? 0 }))}
                center={<><span className="text-3xl font-semibold tabular-nums">{safePct(withData, levelTotal) ?? '—'}%</span><span className="text-[11px] leading-tight text-muted-foreground">com dados<br />no período</span></>} />
              <div className="w-full flex-1 space-y-2.5">
                {LEVELS.map((l) => {
                  const n = s.levels?.[l.key] ?? 0; const pct = levelTotal ? Math.round((n / levelTotal) * 100) : 0;
                  return (
                    <div key={l.key} className="rounded-2xl px-3 py-2 transition-colors hover:bg-muted/50">
                      <div className="flex justify-between text-sm">
                        <span className="flex items-center gap-2"><span className={cn('h-2.5 w-2.5 rounded-full', l.tone)} />{l.label}<InfoTip label={l.label} text={HELP[l.key]} /></span>
                        <span className="tabular-nums"><span className="font-semibold">{n.toLocaleString('pt-BR')}</span> <span className="text-muted-foreground">· {pct}%</span></span>
                      </div>
                      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted"><div className={cn('h-full rounded-full transition-all duration-700', l.tone)} style={{ width: `${pct}%` }} /></div>
                    </div>
                  );
                })}
              </div>
            </div>
          </Panel>
          <Panel className="lg:col-span-2">
            <H2 icon={Sparkles} title="Médias da rede" sub="Registros dos últimos 30 dias, escala 1–5. A seta compara com os 30 dias anteriores." />
            <div className="space-y-4">
              {avgs.map((a) => {
                const dir = trend(a.c, a.p); const good = trendIsGood(dir, a.inv);
                const Icon = dir === 'up' ? ArrowUpRight : dir === 'down' ? ArrowDownRight : Minus;
                const delta = a.c != null && a.p != null ? a.c - a.p : null;
                const pos = a.c == null ? null : ((a.c - 1) / 4) * 100;
                return (
                  <div key={a.label}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-1 font-medium">{a.label}<InfoTip label={a.label} text={HELP[a.label]} /></span>
                      <span className="flex items-center gap-2">
                        <span className="text-xl font-semibold tabular-nums">{fmt(a.c)}</span>
                        {dir && <span className={cn('inline-flex items-center rounded-full px-1.5 py-0.5 text-[11px] font-semibold',
                          good === true && 'bg-success/10 text-success', good === false && 'bg-destructive/10 text-destructive', good === null && 'bg-muted text-muted-foreground')}>
                          <Icon className="h-3 w-3" />{delta != null && fmt(Math.abs(delta))}</span>}
                      </span>
                    </div>
                    <div className="relative mt-2 h-1.5 rounded-full bg-muted">
                      {pos != null && <div className={cn('absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-card shadow', a.inv ? 'bg-destructive/70' : 'bg-primary')} style={{ left: `${Math.max(0, Math.min(100, pos))}%` }} />}
                    </div>
                    <div className="mt-1 flex justify-between text-[10px] text-muted-foreground"><span>1</span><span>{a.inv ? 'menor = melhor' : 'maior = melhor'}</span><span>5</span></div>
                  </div>
                );
              })}
            </div>
          </Panel>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <Panel data-tour="ch-flow">
            <H2 icon={LifeBuoy} title="Fluxo de cuidado" sub="Últimos 90 dias, do pedido à primeira consulta." />
            <div className="flex items-stretch gap-2 text-center">
              {[{ k: 'Pedido', v: null }, { k: 'Triagem', v: `${fmt(s.flow.hours_to_triage)}h`, h: HELP.hours_to_triage }, { k: '1ª consulta', v: `${fmt(s.flow.days_to_consult)}d`, h: HELP.days_to_consult }].map((st, i) => (
                <div key={st.k} className="flex flex-1 items-center gap-2">
                  {i > 0 && <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />}
                  <div className={cn('flex-1 rounded-2xl px-2 py-3', i === 0 ? 'bg-muted/60' : 'bg-primary/10')}>
                    <p className="text-xl font-semibold tabular-nums">{st.v ?? '●'}</p>
                    <p className="flex items-center justify-center gap-1 text-[11px] text-muted-foreground">{st.k}{st.h && <InfoTip label={st.k} text={st.h} />}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-5 border-t pt-4">
              <p className="text-sm"><span className="text-lg font-semibold tabular-nums">{s.flow.resolved_30d.toLocaleString('pt-BR')}</span> <span className="text-muted-foreground">triagens concluídas em 30 dias</span></p>
              <div className="mt-3 space-y-2">
                {outcomes.length === 0 && <p className="text-xs text-muted-foreground">Nenhum desfecho registrado no período.</p>}
                {outcomes.slice(0, 6).map(([k, n]) => (
                  <div key={k} className="text-xs">
                    <div className="flex justify-between"><span>{outcomeLabel(k)}</span><span className="font-semibold tabular-nums">{n.toLocaleString('pt-BR')}</span></div>
                    <div className="mt-1 h-1 rounded-full bg-muted"><div className="h-1 rounded-full bg-primary/70 transition-all duration-700" style={{ width: `${(n / outcomeMax) * 100}%` }} /></div>
                  </div>
                ))}
              </div>
            </div>
          </Panel>

          <Panel>
            <H2 icon={Radar} title={`Radar ${s.radar_semester}`} sub="Participação no Radar de Permanência neste semestre." />
            <div className="flex items-center gap-4">
              <div className="relative"><Ring pct={radarPct} /><span className="absolute inset-0 flex items-center justify-center text-lg font-semibold tabular-nums">{radarPct ?? '—'}%</span></div>
              <p className="text-sm text-muted-foreground"><span className="font-semibold text-foreground">{s.radar_answered.toLocaleString('pt-BR')}</span> alunos responderam <InfoTip label="Radar" text={HELP.radar} /></p>
            </div>
            {radarLow.length > 0 && <div className="mt-5 space-y-2 border-t pt-4">
              <p className="text-xs font-semibold text-muted-foreground">Menor participação</p>
              {radarLow.map((i) => { const p = safePct(i.radar_answered, i.students) ?? 0; return (
                <div key={i.id} className="text-xs">
                  <div className="flex justify-between gap-2"><span className="truncate">{i.name}</span><span className="font-semibold tabular-nums">{p}%</span></div>
                  <div className="mt-1 h-1 rounded-full bg-muted"><div className="h-1 rounded-full bg-primary/60" style={{ width: `${p}%` }} /></div>
                </div>); })}
            </div>}
          </Panel>

          <Panel>
            <H2 icon={CalendarDays} title="Próximos 7 dias" sub="Consultas e encontros da rede." />
            <div className="rounded-2xl bg-primary/10 px-4 py-3"><span className="text-3xl font-semibold tabular-nums">{s.appointments_week}</span> <span className="text-sm text-muted-foreground">consultas agendadas</span></div>
            <div className="mt-4 space-y-2">
              {s.sessions_week.length === 0 && <p className="text-xs text-muted-foreground">Nenhum encontro na semana.</p>}
              {s.sessions_week.slice(0, 4).map((e) => {
                const d = new Date(`${e.date}T00:00`);
                return (
                  <Link key={e.id} to={`/encontros/${e.id}`} className="flex items-center gap-3 rounded-2xl border p-2.5 text-xs transition-colors hover:bg-muted/50">
                    <span className="flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-xl bg-muted leading-none">
                      <span className="text-sm font-semibold">{format(d, 'dd')}</span><span className="text-[9px] uppercase text-muted-foreground">{format(d, 'MMM', { locale: ptBR })}</span>
                    </span>
                    <span className="min-w-0 flex-1"><span className="block truncate font-medium">{e.title}</span><span className="text-muted-foreground">{e.time?.slice(0, 5)}</span></span>
                    <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-muted-foreground">{e.free_spots} vagas</span>
                  </Link>
                );
              })}
            </div>
          </Panel>
        </div>

        <Panel data-tour="ch-inst">
          <H2 icon={Users} title="Instituições que precisam de atenção" sub="Ordenadas por gravidade: prioridade alta, retornos vencidos e pedidos parados pesam mais."
            right={<div className="flex flex-col gap-2 sm:flex-row">
              <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar instituição..." className="rounded-xl sm:w-56" aria-label="Buscar instituição" />
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger className="rounded-xl sm:w-52" aria-label="Filtrar instituições"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="urgent">Com prioridade alta</SelectItem>
                  <SelectItem value="triage">Com triagens abertas</SelectItem>
                  <SelectItem value="overdue">Com retornos vencidos</SelectItem>
                  <SelectItem value="care">Com pedidos parados</SelectItem>
                </SelectContent>
              </Select>
            </div>} />
          <div className="overflow-x-auto">
            {ranked.length === 0 ? <p className="py-6 text-center text-sm text-muted-foreground">Nenhuma instituição encontrada.</p> : (
              <table className="w-full min-w-[820px] text-sm">
                <thead><tr className="border-b text-left text-xs text-muted-foreground">
                  <th className="py-2 pr-3 font-semibold">Instituição</th><th className="px-2 text-right font-semibold">Alunos</th>
                  <th className="px-2 font-semibold"><span className="inline-flex items-center gap-1">% sinal elevado<InfoTip label="% sinal elevado" text={HELP.col_elevated} /></span></th>
                  <th className="px-2 text-right font-semibold"><span className="inline-flex items-center gap-1">Triagens<InfoTip label="Triagens" text={HELP.col_triage} /></span></th>
                  <th className="px-2 text-right font-semibold"><span className="inline-flex items-center gap-1">Prioridade alta<InfoTip label="Prioridade alta" text={HELP.col_urgent} /></span></th>
                  <th className="px-2 text-right font-semibold"><span className="inline-flex items-center gap-1">Retornos vencidos<InfoTip label="Retornos vencidos" text={HELP.col_overdue} /></span></th>
                  <th className="px-2 text-right font-semibold"><span className="inline-flex items-center gap-1">Pedidos parados<InfoTip label="Pedidos parados" text={HELP.col_care} /></span></th><th /></tr></thead>
                <tbody className="divide-y">
                  {ranked.map((i) => {
                    const st = institutionStatus(i); const ep = safePct(i.elevated, i.students);
                    return (
                      <tr key={i.id} className="transition-colors hover:bg-muted/40">
                        <td className="py-3 pr-3"><div className="flex items-center gap-3">
                          {i.logo_url ? <img src={i.logo_url} alt="" className="h-8 w-8 rounded-lg border bg-background object-contain p-0.5" /> : <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted"><Building2 className="h-4 w-4 text-muted-foreground" /></span>}
                          <div><p className="font-medium">{i.name}</p><p className="flex items-center gap-1.5 text-[11px] text-muted-foreground"><span className={cn('h-2 w-2 rounded-full', dot[st])} />{STATUS_TXT[st]}</p></div>
                        </div></td>
                        <td className="px-2 text-right tabular-nums">{i.students.toLocaleString('pt-BR')}</td>
                        <td className="px-2">{ep == null ? <span className="text-muted-foreground">—</span> : (
                          <div className="flex items-center gap-2"><div className="h-1.5 w-20 rounded-full bg-muted"><div className="h-1.5 rounded-full bg-destructive/70" style={{ width: `${Math.min(100, ep * 4)}%` }} /></div><span className="tabular-nums">{ep}%</span></div>)}</td>
                        <td className="px-2 text-right tabular-nums">{i.triage_open}</td>
                        <td className={cn('px-2 text-right tabular-nums', i.triage_urgent > 0 && 'font-semibold text-destructive')}>{i.triage_urgent}</td>
                        <td className={cn('px-2 text-right tabular-nums', i.followups_overdue > 0 && 'font-semibold text-destructive')}>{i.followups_overdue}</td>
                        <td className="px-2 text-right tabular-nums">{i.care_stalled}</td>
                        <td className="pl-2 text-right"><Button asChild size="sm" variant="outline" className="rounded-xl"><Link to={`/portal-institucional?inst=${i.id}`}>Abrir <ArrowRight className="ml-1 h-3.5 w-3.5" /></Link></Button></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </Panel>
      </>)}

      <TourOverlay show={tourStep >= 0} currentStep={Math.max(0, tourStep)} totalSteps={TOUR.length} stepData={TOUR[Math.max(0, tourStep)]}
        onNext={() => (tourStep + 1 >= TOUR.length ? endTour() : setTourStep(tourStep + 1))} onPrev={() => setTourStep(Math.max(0, tourStep - 1))} onSkip={endTour} />
    </>
  );
}
