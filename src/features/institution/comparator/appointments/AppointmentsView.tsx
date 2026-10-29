import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, Minus, Plus, Star } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { LogoLoader } from '@/components/ui/logo-loader';
import { Sheet, H2 } from '../overview/OverviewView';
import {
  SERVICES, PERIODS, DAYS, REASONS, STATUS_LABEL, capacityStatus, periodGap, gapLabel, shares, warn, bestUnit, serviceSentence,
  type Payload, type MetricKey,
} from './appointmentsLogic';

const br = (n: number, d = 0) => n.toLocaleString('pt-BR', { maximumFractionDigits: d, minimumFractionDigits: d });
const initials = (s: string) => s.replace(/^Afya\s+/i, '').split(/\s+/).filter((w) => w.length > 2).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
const unitTone = ['bg-primary text-primary-foreground', 'bg-primary/70 text-primary-foreground', 'bg-primary/30 text-foreground', 'bg-primary/15 text-foreground'];
const heatTone = (v: number) => (v >= 6.5 ? 'bg-primary text-primary-foreground' : v >= 5 ? 'bg-primary/75 text-primary-foreground' : v >= 3.5 ? 'bg-primary/45' : v >= 2 ? 'bg-primary/20' : 'bg-primary/10');

const MET: Record<MetricKey, { label: string; title: string; sub: string; max: number; fmt: (v: number) => string; unitD: string }> = {
  ocup: { label: 'Ocupação da agenda', title: 'Ocupação da agenda', sub: 'Horas usadas sobre horas ofertadas', max: 100, fmt: (v) => `${v}%`, unitD: ' p.p.' },
  espera: { label: 'Espera média', title: 'Espera até a 1ª consulta', sub: 'Média em dias, do pedido à consulta', max: 14, fmt: (v) => `${v} dias`, unitD: ' dias' },
  compar: { label: 'Comparecimento', title: 'Comparecimento às consultas', sub: 'Consultas realizadas sobre consultas marcadas', max: 100, fmt: (v) => `${v}%`, unitD: ' p.p.' },
  noite: { label: 'Horas a noite', title: 'Horas ofertadas a noite', sub: 'Parte da agenda semanal após as 18h', max: 40, fmt: (v) => `${v}%`, unitD: ' p.p.' },
  horas: { label: 'Horas por semana', title: 'Horas ofertadas por semana', sub: 'Soma da agenda dos profissionais do núcleo', max: 70, fmt: (v) => `${br(v)} h`, unitD: ' h' },
};
const MKEYS = Object.keys(MET) as MetricKey[];

export function AppointmentsView({ institutionId, semester, unitFilter }: { institutionId?: string; semester: string | null; unitFilter: string }) {
  const [fs, setFs] = useState<string | null>(null);
  const [metric, setMetric] = useState<MetricKey>('ocup');
  const [unitSel, setUnitSel] = useState<string | null>(null);

  const q = useQuery({
    queryKey: ['appointments-capacity', institutionId],
    enabled: !!institutionId,
    queryFn: async () => {
      const { data, error } = await (supabase as any).rpc('get_institution_appointments_capacity', { p_institution_id: institutionId });
      if (error) throw error;
      return data as Payload;
    },
  });
  const d = q.data;
  const sems = useMemo(() => [...new Set((d?.kpi ?? []).map((k) => k.sem))].sort(), [d]);
  const sem = semester && sems.includes(semester) ? semester : sems[sems.length - 1] ?? null;
  const prevSem = sem ? sems[sems.indexOf(sem) - 1] ?? null : null;
  const U = unitFilter === 'all' ? '__all__' : unitFilter;

  if (q.isLoading) return <LogoLoader className="min-h-[40vh]" />;
  if (q.error) return <div className="rounded-3xl border bg-card p-10 text-center text-muted-foreground">Não foi possível carregar os atendimentos.</div>;
  const k = d?.kpi.find((r) => r.sem === sem && r.unit === U);
  if (!d || !sem || !k) {
    return <div className="rounded-3xl border bg-card p-10 text-center text-muted-foreground">Ainda sem dados de atendimentos suficientes para este recorte. Grupos com menos de 10 consultas ficam ocultos.</div>;
  }
  const weeks = d.weeks[sem] ?? 1;
  const kPrev = prevSem ? d.kpi.find((r) => r.sem === prevSem && r.unit === U) : null;

  const capOf = (unit: string) => d.cap.filter((c) => c.sem === sem && c.unit === unit);
  const unitStats = (unit: string) => {
    const kk = d.kpi.find((r) => r.sem === sem && r.unit === unit)!;
    const cap = capOf(unit);
    const hours = cap.reduce((s, c) => s + Number(c.hours), 0);
    const night = cap.filter((c) => c.per === 'noite').reduce((s, c) => s + Number(c.hours), 0);
    return {
      kk, hours,
      ocup: hours ? Math.min(100, Math.round((kk.done / weeks / hours) * 100)) : null,
      espera: kk.wait == null ? null : Math.round(kk.wait),
      compar: kk.marked ? Math.round((kk.done / kk.marked) * 100) : null,
      noite: hours ? Math.round((night / hours) * 100) : null,
    };
  };
  const cur = unitStats(U);

  const kpis = [
    { label: 'Consultas realizadas', value: br(k.done), note: `para ${br(k.people)} pessoas · ${br(k.people ? k.done / k.people : 0, 1)} por pessoa` },
    { label: 'Comparecimento', value: `${cur.compar ?? '—'}%`, note: `${br(k.noshow)} faltas em ${br(k.marked)} consultas marcadas` },
    { label: 'Ocupação da agenda', value: cur.ocup == null ? '—' : `${cur.ocup}%`, note: 'horas usadas sobre horas ofertadas' },
    { label: 'Espera até a 1ª consulta', value: cur.espera == null ? '—' : `${cur.espera} dias`, note: `média${kPrev?.wait != null ? ` · era ${Math.round(kPrev.wait)} dias em ${prevSem}` : ''}` },
  ];

  // Services
  const svcRows = Object.entries(SERVICES).map(([key, nome]) => {
    const s = d.svc.find((r) => r.sem === sem && r.unit === U && r.service === key);
    const oferta = capOf(U).filter((c) => c.service === key).reduce((t, c) => t + Number(c.hours), 0);
    return { key, nome, oferta: Math.round(oferta * 10) / 10, procura: Math.round(((s?.marked ?? 0) / weeks) * 10) / 10 };
  }).filter((s) => s.oferta > 0 || s.procura > 0);
  const maxH = Math.max(1, ...svcRows.map((s) => Math.max(s.oferta, s.procura))) * 1.05;

  // Heat & periods
  const heat = d.heat.filter((h) => h.sem === sem && h.unit === U);
  const heatTot = heat.reduce((s, h) => s + h.n, 0) || 1;
  const cell = (wd: number, per: string) => ((heat.find((h) => h.wd === wd && h.per === per)?.n ?? 0) / heatTot) * 100;
  const dem = shares(Object.fromEntries(Object.keys(PERIODS).map((p) => [p, heat.filter((h) => h.per === p).reduce((s, h) => s + h.n, 0)])));
  const ag = shares(Object.fromEntries(Object.keys(PERIODS).map((p) => [p, capOf(U).filter((c) => c.per === p).reduce((s, c) => s + Number(c.hours), 0)])));
  const periodos = Object.entries(PERIODS).map(([p, nome]) => ({ nome, procura: dem[p] ?? 0, agenda: ag[p] ?? 0, gap: periodGap(dem[p] ?? 0, ag[p] ?? 0) }));
  const night = periodos.find((p) => p.nome === 'Noite')!;

  // Units
  const units = [...new Set(d.kpi.filter((r) => r.sem === sem && r.unit !== '__all__').map((r) => r.unit))].sort();
  const uRows = units.map((u, i) => ({ unit: u, i, ...unitStats(u) })).map((r) => ({ ...r, horasV: Math.round(r.hours * 10) / 10 }));
  const all = unitStats('__all__');
  const avg: Record<MetricKey, number | null> = { ocup: all.ocup, espera: all.espera, compar: all.compar, noite: all.noite, horas: uRows.length ? Math.round((uRows.reduce((s, r) => s + r.horasV, 0) / uRows.length) * 10) / 10 : null };
  const val = (r: (typeof uRows)[number], m: MetricKey) => (m === 'horas' ? r.horasV : r[m]);
  const best = bestUnit(uRows);
  const selUnit = uRows.find((r) => r.unit === (unitSel ?? best?.unit)) ?? uRows[0];
  const M = MET[metric];
  const ranked = [...uRows].sort((a, b) => (val(b, metric) ?? 0) - (val(a, metric) ?? 0));
  const top = ranked[0], bottom = ranked[ranked.length - 1];
  const insight = top && bottom && top !== bottom
    ? `${top.unit} tem o maior valor (${M.fmt(val(top, metric) ?? 0)}) e ${bottom.unit} o menor (${M.fmt(val(bottom, metric) ?? 0)}). Média da instituição: ${avg[metric] == null ? '—' : M.fmt(avg[metric]!)}.`
    : '';
  const unitNote = (r: (typeof uRows)[number]) => {
    if (best && r.unit === best.unit) return 'Menor espera e melhor comparecimento entre as unidades. Boa prática para replicar.';
    if (warn('ocup', r.ocup) || warn('espera', r.espera)) return 'Agenda pressionada: a procura cresce mais rápido que a oferta.';
    return 'Equilibrada em relação à média da instituição.';
  };

  const reasons = d.reasons.filter((r) => r.sem === sem && r.unit === U);
  const rTot = reasons.reduce((s, r) => s + r.n, 0) || 1;
  const rRows = Object.entries(REASONS).map(([key, l]) => ({ l, v: Math.round(((reasons.find((r) => r.reason === key)?.n ?? 0) / rTot) * 100) })).filter((r) => r.v > 0).sort((a, b) => b.v - a.v);
  const rMax = Math.max(1, ...rRows.map((r) => r.v));

  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-primary">Psicologia, psiquiatria, mentoria e núcleos</p>
        <h1 className="text-[34px] font-semibold leading-tight tracking-tight">A oferta de cuidado acompanha a procura?</h1>
        <p className="max-w-[62ch] text-muted-foreground">Horas, espera e comparecimento por serviço e por núcleo em {sem}. Nenhum conteúdo de consulta aparece aqui.</p>
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

      <div className="flex flex-wrap items-stretch gap-6">
        <Sheet id="s1" open={fs} setOpen={setFs} label="Procura x horas ofertadas por serviço" className="min-w-0 flex-[1.4_1_480px] space-y-5">
          <H2 title="Procura x horas ofertadas por serviço" sub={`Média semanal de ${sem}, em horas de atendimento.`} />
          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5"><i className="h-2.5 w-4 rounded-sm border-2 border-primary/40" />Horas ofertadas</span>
            <span className="flex items-center gap-1.5"><i className="h-2.5 w-4 rounded-sm bg-primary" />Procura dentro da oferta</span>
            <span className="flex items-center gap-1.5"><i className="h-2.5 w-4 rounded-sm bg-destructive/60" />Procura acima da oferta</span>
          </div>
          <div className="space-y-4">
            {svcRows.map((s) => {
              const st = capacityStatus(s.procura, s.oferta);
              const over = s.procura > s.oferta;
              const ratio = s.oferta ? Math.round((s.procura / s.oferta) * 100) : 0;
              const Icon = st === 'over' ? AlertTriangle : st === 'limit' ? Minus : Plus;
              return (
                <div key={s.key} className="grid items-center gap-3 md:grid-cols-[180px_1fr_170px]">
                  <div><p className="font-semibold">{s.nome}</p><p className="text-xs text-muted-foreground">{br(s.oferta, 1)} h ofertadas · {br(s.procura, 1)} h procuradas</p></div>
                  <div className="relative h-7 rounded-lg bg-muted/50">
                    <div className="absolute inset-y-0 left-0 rounded-lg border-2 border-primary/40" style={{ width: `${(s.oferta / maxH) * 100}%` }} />
                    <div className="absolute inset-y-1 left-1 rounded-md bg-primary" style={{ width: `calc(${(Math.min(s.procura, s.oferta) / maxH) * 100}% - 4px)` }} />
                    {over && <div className="absolute inset-y-1 rounded-r-md bg-destructive/60" style={{ left: `${(s.oferta / maxH) * 100}%`, width: `${((s.procura - s.oferta) / maxH) * 100}%` }} />}
                  </div>
                  <span className={`inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${st === 'over' ? 'bg-destructive/10 text-destructive' : 'bg-muted text-muted-foreground'}`}>
                    <Icon className="h-3.5 w-3.5" />{STATUS_LABEL[st]} · {ratio}%
                  </span>
                </div>
              );
            })}
          </div>
          <p className="rounded-2xl bg-accent/60 p-4 text-sm">{serviceSentence(svcRows)}</p>
        </Sheet>

        <Sheet id="s2" open={fs} setOpen={setFs} label="Quando os estudantes procuram apoio" className="min-w-0 flex-[1_1_380px] space-y-4">
          <H2 title="Quando os estudantes procuram apoio" sub="% dos pedidos de agendamento por dia e período." />
          <div className="overflow-x-auto">
            <table className="w-full border-separate border-spacing-1 text-xs">
              <thead><tr><th />{Object.values(PERIODS).map((p) => <th key={p} className="pb-1 font-medium text-muted-foreground">{p}</th>)}</tr></thead>
              <tbody>
                {DAYS.map((dia, i) => (
                  <tr key={dia}>
                    <th className="pr-2 text-left font-medium text-muted-foreground">{dia}</th>
                    {Object.keys(PERIODS).map((p) => { const v = cell(i + 1, p); return <td key={p} className={`h-9 rounded-md text-center font-semibold tabular-nums ${heatTone(v)}`}>{br(v, 1)}%</td>; })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">Menos pedidos{[1, 2, 3.5, 5, 6.5].map((v) => <i key={v} className={`h-3 w-6 rounded ${heatTone(v)}`} />)}Mais pedidos</div>
        </Sheet>
      </div>

      <Sheet id="s3" open={fs} setOpen={setFs} label="Procura x agenda por período" className="space-y-5">
        <H2 title="Procura x agenda por período" sub="Onde a agenda não encontra quem procura." />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {periodos.map((p) => (
            <div key={p.nome} className="space-y-3 rounded-2xl border p-4">
              <div className="flex items-baseline justify-between"><p className="font-semibold">{p.nome}</p><p className={`text-xs font-medium ${p.gap > 0 ? 'text-destructive' : 'text-muted-foreground'}`}>{gapLabel(p.gap)}</p></div>
              {([['Procura', p.procura, 'bg-primary'], ['Agenda', p.agenda, 'bg-primary/35']] as const).map(([l, v, c]) => (
                <div key={l} className="grid grid-cols-[60px_1fr_40px] items-center gap-2 text-xs">
                  <span className="text-muted-foreground">{l}</span>
                  <div className="h-2.5 rounded-full bg-muted"><div className={`h-2.5 rounded-full ${c}`} style={{ width: `${Math.min(100, v * 2)}%` }} /></div>
                  <span className="text-right font-semibold tabular-nums">{v}%</span>
                </div>
              ))}
            </div>
          ))}
        </div>
        <p className="rounded-2xl bg-accent/60 p-4 text-sm"><strong>{night.procura}% dos pedidos são a noite</strong>, mas {night.agenda}% das horas ofertadas estão nesse período.</p>
      </Sheet>

      {uRows.length > 1 && (
        <Sheet id="s4" open={fs} setOpen={setFs} label="Núcleos de cada unidade" className="space-y-5">
          <H2 title="Núcleos de cada unidade" sub="Escolha uma medida para comparar os núcleos e uma unidade para ver a ficha completa, lado a lado com a média da instituição." />
          <div className="flex flex-wrap gap-2">
            {MKEYS.map((m) => (
              <button key={m} type="button" onClick={() => setMetric(m)} aria-pressed={metric === m}
                className={`rounded-full border px-3.5 py-1.5 text-sm ${metric === m ? 'border-primary bg-accent font-semibold text-primary' : 'bg-card text-muted-foreground hover:bg-muted'}`}>{MET[m].label}</button>
            ))}
          </div>
          <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
            <div className="space-y-3 rounded-2xl bg-muted/40 p-5">
              <div><p className="font-semibold">{M.title}</p><p className="text-xs text-muted-foreground">{M.sub}</p></div>
              {uRows.map((r) => {
                const v = val(r, metric) ?? 0; const w = warn(metric, val(r, metric));
                return (
                  <button key={r.unit} type="button" onClick={() => setUnitSel(r.unit)}
                    className={`grid w-full grid-cols-[36px_1fr_70px] items-center gap-3 rounded-xl border-2 p-2 text-left ${selUnit?.unit === r.unit ? 'border-primary bg-card' : 'border-transparent'}`}>
                    <span className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold ${unitTone[r.i % 4]}`}>{initials(r.unit)}</span>
                    <div className="relative h-3 rounded-full bg-muted">
                      <div className={`h-3 rounded-full ${w ? 'bg-destructive/60' : 'bg-primary/70'}`} style={{ width: `${Math.min(100, (v / M.max) * 100)}%` }} />
                      {avg[metric] != null && <div className="absolute -top-1 h-5 w-0.5 bg-foreground/60" style={{ left: `${Math.min(100, (avg[metric]! / M.max) * 100)}%` }} />}
                    </div>
                    <span className={`text-right text-sm font-semibold tabular-nums ${w ? 'text-destructive' : ''}`}>{M.fmt(v)}</span>
                  </button>
                );
              })}
              <p className="text-xs text-muted-foreground">média da instituição: {avg[metric] == null ? '—' : M.fmt(avg[metric]!)}</p>
              {insight && <p className="text-sm">{insight}</p>}
            </div>
            {selUnit && (
              <div className="space-y-4 rounded-2xl border p-5">
                <div className="flex items-center gap-3">
                  <span className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold ${unitTone[selUnit.i % 4]}`}>{initials(selUnit.unit)}</span>
                  <p className="flex-1 font-semibold">{selUnit.unit}</p>
                  {best?.unit === selUnit.unit && <span className="inline-flex items-center gap-1 rounded-full bg-accent px-2.5 py-1 text-xs font-semibold text-primary"><Star className="h-3.5 w-3.5" />Referência</span>}
                </div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {([['horas', 'por semana'], ['ocup', 'ocupação'], ['espera', 'espera média'], ['compar', 'comparecimento'], ['noite', 'horas a noite']] as const).map(([m, l]) => {
                    const v = val(selUnit, m); const a = avg[m];
                    const diff = v != null && a != null ? Math.round((v - a) * 10) / 10 : null;
                    return (
                      <div key={m} className={`rounded-xl border p-3 ${metric === m ? 'border-primary bg-accent/50' : ''}`}>
                        <p className="text-xl font-semibold tabular-nums">{v == null ? '—' : MET[m].fmt(v)}</p>
                        <p className="text-xs text-muted-foreground">{l}</p>
                        <p className={`text-[11px] ${warn(m, v) ? 'text-destructive' : 'text-muted-foreground'}`}>{diff == null ? '' : diff === 0 ? 'igual à média' : `${diff > 0 ? '+' : '−'}${br(Math.abs(diff), 1)}${MET[m].unitD} vs média`}</p>
                      </div>
                    );
                  })}
                  <div className="rounded-xl border p-3"><p className="text-xl font-semibold tabular-nums">{br(selUnit.kk.people)}</p><p className="text-xs text-muted-foreground">pessoas atendidas</p></div>
                </div>
                <p className="text-sm text-muted-foreground">{unitNote(selUnit)}</p>
              </div>
            )}
          </div>
        </Sheet>
      )}

      <div className="flex flex-wrap items-stretch gap-6">
        <Sheet id="s5" open={fs} setOpen={setFs} label="Como foi o atendimento" className="min-w-0 flex-[1_1_320px] space-y-4">
          <H2 title="Como foi o atendimento" />
          {k.rating_n >= 10 ? (
            <div className="grid grid-cols-2 gap-4">
              <div><p className="text-[32px] font-semibold tabular-nums">{br(Number(k.rating), 1)} <span className="text-base text-muted-foreground">/ 5</span></p><p className="text-xs text-muted-foreground">avaliação média · {br(k.rating_n)} respostas</p></div>
              <div><p className="text-[32px] font-semibold tabular-nums">{k.recommend ?? '—'}%</p><p className="text-xs text-muted-foreground">indicariam a um colega</p></div>
            </div>
          ) : <p className="text-sm text-muted-foreground">Ainda sem avaliações suficientes.</p>}
        </Sheet>
        <Sheet id="s6" open={fs} setOpen={setFs} label="Por que faltam à consulta" className="min-w-0 flex-[1.4_1_420px] space-y-4">
          <H2 title="Por que faltam à consulta" />
          {k.noshow >= 10 && rRows.length ? (
            <>
              {rRows.map((r) => (
                <div key={r.l} className="grid grid-cols-[200px_1fr_44px] items-center gap-3 text-sm">
                  <span>{r.l}</span>
                  <div className="h-2.5 rounded-full bg-muted"><div className="h-2.5 rounded-full bg-primary" style={{ width: `${(r.v / rMax) * 100}%` }} /></div>
                  <span className="text-right font-semibold tabular-nums">{r.v}%</span>
                </div>
              ))}
              <p className="text-xs text-muted-foreground">Motivo informado ao remarcar · {br(k.noshow)} faltas no semestre.</p>
            </>
          ) : <p className="text-sm text-muted-foreground">Ainda sem dados suficientes.</p>}
        </Sheet>
      </div>
    </div>
  );
}
