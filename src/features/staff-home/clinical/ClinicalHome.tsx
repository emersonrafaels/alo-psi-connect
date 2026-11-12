import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { X } from 'lucide-react';
import { AlertTriangle, ArrowDownRight, ArrowRight, ArrowUpRight, Building2, CalendarDays, ClipboardList, Clock, LifeBuoy, Minus, Radar, RefreshCw, ShieldCheck, Activity, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TourOverlay } from '@/components/ui/tour-overlay';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { InfoTip } from './InfoTip';
import { HELP, LEVELS, institutionStatus, rankInstitutions, safePct, trend, trendIsGood, type ClinicalSummary } from './clinicalHomeLogic';

const TOUR_KEY = (uid: string) => `clinical-home-tour-v2:${uid}`;
const TOUR = [
  { id: 'prio', title: 'Prioridades de hoje', description: 'O que precisa de ação clínica agora, em ordem de gravidade.', target: '[data-tour="ch-prio"]' },
  { id: 'health', title: 'Saúde da rede', description: 'Níveis de sinal e médias dos últimos 30 dias, comparados aos 30 anteriores.', target: '[data-tour="ch-health"]' },
  { id: 'flow', title: 'Fluxo de cuidado', description: 'Tempos médios entre pedido, triagem e primeira consulta.', target: '[data-tour="ch-flow"]' },
  { id: 'inst', title: 'Instituições', description: 'Ordenadas por quem precisa de mais atenção. "Abrir" leva ao portal completo.', target: '[data-tour="ch-inst"]' },
];
const dot = { critical: 'bg-destructive', warning: 'bg-destructive/40', ok: 'bg-success' } as const;
const fmt = (n: number | null | undefined, d = 1) => (n == null ? '—' : Number(n).toLocaleString('pt-BR', { maximumFractionDigits: d }));

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
  const levelTotal = s ? Object.values(s.levels ?? {}).reduce((a, b) => a + b, 0) : 0;
  const cur = s?.averages?.cur, prev = s?.averages?.prev;
  const avgs = [
    { label: 'Humor', c: cur?.mood, p: prev?.mood, inv: false },
    { label: 'Ansiedade', c: cur?.anx, p: prev?.anx, inv: true },
    { label: 'Sono', c: cur?.sleep, p: prev?.sleep, inv: false },
    { label: 'Energia', c: cur?.energy, p: prev?.energy, inv: false },
  ];
  const radarLow = s ? [...s.by_institution].filter((i) => i.students >= 10).sort((a, b) => a.radar_answered / a.students - b.radar_answered / b.students).slice(0, 3) : [];

  return (
    <>
      <section className="rounded-2xl border bg-gradient-to-br from-primary/10 via-background to-accent/10 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground capitalize">{format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })}</p>
          <h1 className="text-2xl md:text-3xl font-bold mt-1">Meu espaço</h1>
          <p className="text-muted-foreground mt-1">Coordenação clínica · {s ? `${s.students.toLocaleString('pt-BR')} alunos em ${s.by_institution.length} instituições` : 'todas as instituições'}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="ghost" size="sm" onClick={() => q.refetch()} disabled={q.isFetching}><RefreshCw className={cn('h-4 w-4 mr-1', q.isFetching && 'animate-spin')} />Atualizar</Button>
          <Button variant="outline" size="sm" onClick={() => setTourStep(0)}>Ver tour</Button>
          <Button asChild size="sm"><Link to="/portal-institucional/triagem">Abrir triagem <ArrowRight className="h-4 w-4 ml-1" /></Link></Button>
        </div>
      </section>

      {!hideInfo && <div className="flex items-start gap-3 rounded-xl border-l-4 border-primary bg-primary/5 p-4 text-sm">
        <ShieldCheck className="h-5 w-5 text-primary shrink-0" />
        <div className="space-y-1 flex-1">
          <p className="font-semibold">Como ler este painel</p>
          <p>Os números são totais e médias de toda a rede. Os alunos aparecem sempre como "Aluno #N" e você nunca vê o que escreveram. Percentuais de grupos com menos de 10 alunos ficam ocultos.</p>
          <p className="text-muted-foreground">Os níveis de sinal ajudam a priorizar a triagem e não são diagnóstico. Passe o mouse ou toque no ícone ⓘ para ver o que cada indicador mede.</p>
        </div>
        <button type="button" aria-label="Fechar explicação" onClick={() => { localStorage.setItem('clinical-home-info-hidden', '1'); setHideInfo(true); }} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
      </div>}

      {q.isLoading && <p className="text-sm text-muted-foreground">Carregando…</p>}
      {q.isError && <p className="text-sm text-destructive">Não foi possível carregar o resumo clínico.</p>}

      {s && (<>
        <section data-tour="ch-prio" className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
          {prio.map((p) => (
            <Link key={p.label} to={p.to} className={cn('rounded-xl border p-4 transition-colors hover:bg-muted/50',
              p.value > 0 && p.sev === 'critical' && 'border-destructive/50 bg-destructive/5',
              p.value > 0 && p.sev === 'warning' && 'border-destructive/25')}>
              <p.icon className={cn('h-5 w-5', p.value > 0 && p.sev !== 'info' ? 'text-destructive' : 'text-primary')} />
              <p className="text-2xl font-bold mt-2">{p.value.toLocaleString('pt-BR')}</p>
              <p className="text-xs text-muted-foreground flex items-start gap-1">{p.label}<InfoTip label={p.label} text={HELP[p.label]} /></p>
            </Link>
          ))}
        </section>

        <div data-tour="ch-health" className="grid lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-2">
            <CardHeader><CardTitle className="text-lg">Níveis de sinal · últimos 30 dias</CardTitle><p className="text-xs text-muted-foreground">Quantos alunos estão em cada nível, pelo último registro analisado no diário. Some 100% dos alunos vinculados.</p></CardHeader>
            <CardContent className="space-y-3">
              {LEVELS.map((l) => {
                const n = s.levels?.[l.key] ?? 0; const pct = levelTotal ? Math.round((n / levelTotal) * 100) : 0;
                return (
                  <div key={l.key} className="space-y-1">
                    <div className="flex justify-between text-sm"><span className="flex items-center gap-2"><span className={cn('h-2.5 w-2.5 rounded-full', l.tone)} />{l.label}<InfoTip label={l.label} text={HELP[l.key]} /></span><span className="text-muted-foreground">{n.toLocaleString('pt-BR')} · {pct}%</span></div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden"><div className={cn('h-full rounded-full', l.tone)} style={{ width: `${pct}%` }} /></div>
                  </div>
                );
              })}
              <p className="text-xs text-muted-foreground pt-1">Nível pelo último registro analisado de cada aluno. Classificação de apoio à triagem, nunca diagnóstico.</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-lg">Médias da rede</CardTitle><p className="text-xs text-muted-foreground">Média dos registros dos últimos 30 dias. Verde indica melhora; vermelho, piora.</p></CardHeader>
            <CardContent className="space-y-3">
              {avgs.map((a) => {
                const dir = trend(a.c, a.p); const good = trendIsGood(dir, a.inv);
                const Icon = dir === 'up' ? ArrowUpRight : dir === 'down' ? ArrowDownRight : Minus;
                return (
                  <div key={a.label} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1">{a.label}<InfoTip label={a.label} text={HELP[a.label]} /></span>
                    <span className="flex items-center gap-2 font-semibold">{fmt(a.c)}
                      {dir && <Icon className={cn('h-4 w-4', good === true && 'text-success', good === false && 'text-destructive', good === null && 'text-muted-foreground')} />}
                    </span>
                  </div>
                );
              })}
              <div className="border-t pt-3 text-sm flex justify-between"><span className="flex items-center gap-1">Registraram no diário (7 dias)<InfoTip label="Registraram no diário" text={HELP.engaged} /></span><span className="font-semibold">{safePct(s.engaged_7d, s.students) ?? '—'}%</span></div>
              <p className="text-xs text-muted-foreground">Escala 1–5. Seta compara com os 30 dias anteriores.</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-4">
          <Card data-tour="ch-flow">
            <CardHeader><CardTitle className="text-lg">Fluxo de cuidado · 90 dias</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 gap-3 text-sm">
              <div><p className="text-2xl font-bold">{fmt(s.flow.hours_to_triage)}h</p><p className="text-xs text-muted-foreground flex items-center gap-1">até a triagem<InfoTip label="até a triagem" text={HELP.hours_to_triage} /></p></div>
              <div><p className="text-2xl font-bold">{fmt(s.flow.days_to_consult)}d</p><p className="text-xs text-muted-foreground flex items-center gap-1">até a 1ª consulta<InfoTip label="até a 1ª consulta" text={HELP.days_to_consult} /></p></div>
              <div className="col-span-2 border-t pt-3"><p className="font-semibold">{s.flow.resolved_30d} triagens concluídas em 30 dias</p>
                <div className="flex flex-wrap gap-1.5 mt-2">{Object.entries(s.flow.outcomes).map(([k, n]) => <span key={k} className="rounded-full bg-muted px-2 py-0.5 text-xs">{k.replace(/_/g, ' ')} · {n}</span>)}</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Radar className="h-5 w-5" />Radar {s.radar_semester}</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p className="text-2xl font-bold">{safePct(s.radar_answered, s.students) ?? '—'}%</p>
              <p className="text-xs text-muted-foreground">dos alunos responderam neste semestre <InfoTip label="Radar" text={HELP.radar} /></p>
              {radarLow.length > 0 && <div className="border-t pt-2 space-y-1"><p className="text-xs font-medium">Menor participação</p>
                {radarLow.map((i) => <div key={i.id} className="flex justify-between text-xs"><span className="truncate">{i.name}</span><span>{safePct(i.radar_answered, i.students)}%</span></div>)}</div>}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-lg flex items-center gap-2"><CalendarDays className="h-5 w-5" />Próximos 7 dias</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p><span className="text-2xl font-bold">{s.appointments_week}</span> <span className="text-muted-foreground">consultas agendadas</span></p>
              <div className="border-t pt-2 space-y-1">
                {s.sessions_week.length === 0 && <p className="text-xs text-muted-foreground">Nenhum encontro na semana.</p>}
                {s.sessions_week.slice(0, 4).map((e) => (
                  <Link key={e.id} to={`/encontros/${e.id}`} className="flex justify-between gap-2 text-xs hover:underline">
                    <span className="truncate">{format(new Date(`${e.date}T00:00`), 'dd/MM')} · {e.title}</span><span className="shrink-0 text-muted-foreground">{e.free_spots} vagas</span>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card data-tour="ch-inst">
          <CardHeader className="gap-3">
            <CardTitle className="text-lg flex items-center gap-2"><Users className="h-5 w-5" />Instituições que precisam de atenção</CardTitle>
            <div className="flex flex-col sm:flex-row gap-2">
              <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar instituição..." className="sm:max-w-xs" aria-label="Buscar instituição" />
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger className="sm:w-56" aria-label="Filtrar instituições"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="urgent">Com prioridade alta</SelectItem>
                  <SelectItem value="triage">Com triagens abertas</SelectItem>
                  <SelectItem value="overdue">Com retornos vencidos</SelectItem>
                  <SelectItem value="care">Com pedidos parados</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            {ranked.length === 0 ? <p className="py-6 text-sm text-center text-muted-foreground">Nenhuma instituição encontrada.</p> : (
              <table className="w-full text-sm">
                <thead><tr className="text-left text-xs text-muted-foreground border-b">
                  <th className="py-2 pr-3 font-medium">Instituição</th><th className="px-2 font-medium text-right">Alunos</th><th className="px-2 font-medium text-right"><span className="inline-flex items-center gap-1">% sinal elevado<InfoTip label="% sinal elevado" text={HELP.col_elevated} /></span></th>
                  <th className="px-2 font-medium text-right"><span className="inline-flex items-center gap-1">Triagens<InfoTip label="Triagens" text={HELP.col_triage} /></span></th><th className="px-2 font-medium text-right"><span className="inline-flex items-center gap-1">Prioridade alta<InfoTip label="Prioridade alta" text={HELP.col_urgent} /></span></th><th className="px-2 font-medium text-right"><span className="inline-flex items-center gap-1">Retornos vencidos<InfoTip label="Retornos vencidos" text={HELP.col_overdue} /></span></th>
                  <th className="px-2 font-medium text-right"><span className="inline-flex items-center gap-1">Pedidos parados<InfoTip label="Pedidos parados" text={HELP.col_care} /></span></th><th /></tr></thead>
                <tbody className="divide-y">
                  {ranked.map((i) => (
                    <tr key={i.id}>
                      <td className="py-2.5 pr-3"><div className="flex items-center gap-2">
                        <span className={cn('h-2.5 w-2.5 rounded-full shrink-0', dot[institutionStatus(i)])} />
                        {i.logo_url ? <img src={i.logo_url} alt="" className="h-6 w-6 rounded object-contain" /> : <Building2 className="h-5 w-5 text-muted-foreground" />}
                        <span className="font-medium">{i.name}</span></div></td>
                      <td className="px-2 text-right">{i.students.toLocaleString('pt-BR')}</td>
                      <td className="px-2 text-right">{safePct(i.elevated, i.students) ?? '—'}{safePct(i.elevated, i.students) != null && '%'}</td>
                      <td className="px-2 text-right">{i.triage_open}</td>
                      <td className={cn('px-2 text-right', i.triage_urgent > 0 && 'text-destructive font-semibold')}>{i.triage_urgent}</td>
                      <td className={cn('px-2 text-right', i.followups_overdue > 0 && 'text-destructive font-semibold')}>{i.followups_overdue}</td>
                      <td className="px-2 text-right">{i.care_stalled}</td>
                      <td className="pl-2 text-right"><Button asChild size="sm" variant="ghost"><Link to={`/portal-institucional?inst=${i.id}`}>Abrir</Link></Button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      </>)}

      <TourOverlay show={tourStep >= 0} currentStep={Math.max(0, tourStep)} totalSteps={TOUR.length} stepData={TOUR[Math.max(0, tourStep)]}
        onNext={() => (tourStep + 1 >= TOUR.length ? endTour() : setTourStep(tourStep + 1))} onPrev={() => setTourStep(Math.max(0, tourStep - 1))} onSkip={endTour} />
    </>
  );
}
