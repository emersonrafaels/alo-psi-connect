import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Check, ClipboardList, Database, PenLine, GraduationCap, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { LogoLoader } from '@/components/ui/logo-loader';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Sheet, H2 } from '../overview/OverviewView';
import { METRICS, ROLES, DEM, BEST_PRACTICES, INDICATORS, enrich, mean, byAttention, quadrant, alertText, type Ned, type NedRaw, type MetricKey } from './nedLogic';

const int = (n: number) => Math.round(n).toLocaleString('pt-BR');
const br = (v: number, d = 1) => v.toFixed(d).replace('.', ',');
const CELL = { '1': 'bg-primary/15 text-primary', '0': 'bg-muted/60', '-1': 'bg-destructive/10 text-destructive' } as const;
const TOOLTIP_ROWS: { k: MetricKey; label: string; unit?: string }[] = [
  { k: 'alc', label: 'Atendidos por 100' },
  { k: 'hor', label: 'Horas de equipe' },
  { k: 'esp', label: 'Espera', unit: ' d' },
  { k: 'com', label: 'Comparecimento' },
  { k: 'sat', label: 'Satisfação' },
];
const pill = (on: boolean) => `rounded-full px-3.5 py-1.5 text-sm ${on ? 'bg-card font-semibold text-primary shadow-sm' : 'text-muted-foreground'}`;
const STATUS = ['Não enviado', 'Em dia', 'Atrasado'];
const MONTHS3 = ['Ago', 'Set', 'Out'];

export function NedView({ institutionId, semester }: { institutionId?: string; semester: string | null }) {
  const qc = useQueryClient();
  const [fs, setFs] = useState<string | null>(null);
  const [region, setRegion] = useState('todas');
  const [sortKey, setSortKey] = useState<MetricKey | 'att'>('att');
  const [sel, setSel] = useState<string | null>(null);
  const [tab, setTab] = useState<'geral' | 'equipe' | 'demandas'>('geral');
  const [bpKey, setBpKey] = useState(BEST_PRACTICES[0].key);
  const [planOpen, setPlanOpen] = useState(false);
  const [planText, setPlanText] = useState('');
  const [hov, setHov] = useState<Ned | null>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });

  const q = useQuery({
    queryKey: ['ned-snapshots', institutionId], enabled: !!institutionId,
    queryFn: async () => {
      const { data, error } = await (supabase as any).from('institution_ned_snapshots').select('semester, ned_key, data').eq('institution_id', institutionId);
      if (error) throw error;
      return data as { semester: string; ned_key: string; data: NedRaw }[];
    },
  });
  const plans = useQuery({
    queryKey: ['ned-plans', institutionId], enabled: !!institutionId,
    queryFn: async () => {
      const { data, error } = await (supabase as any).from('institution_ned_action_plans').select('id, ned_key, plan, created_at').eq('institution_id', institutionId).order('created_at', { ascending: false });
      if (error) throw error;
      return data as { id: string; ned_key: string; plan: string; created_at: string }[];
    },
  });
  const addPlan = useMutation({
    mutationFn: async (v: { ned_key: string; plan: string }) => {
      const { error } = await (supabase as any).from('institution_ned_action_plans').insert({ institution_id: institutionId, ...v });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['ned-plans', institutionId] }); setPlanOpen(false); setPlanText(''); toast.success('Plano de ação registrado'); },
    onError: () => toast.error('Não foi possível registrar o plano.'),
  });

  const sems = useMemo(() => [...new Set((q.data ?? []).map((r) => r.semester))].sort(), [q.data]);
  if (q.isLoading) return <LogoLoader className="min-h-[40vh]" />;
  if (q.error) return <div className="rounded-3xl border bg-card p-10 text-center text-muted-foreground">Não foi possível carregar o NED Nacional.</div>;
  const sem = semester && sems.includes(semester) ? semester : null;
  if (!sem) return <div className="rounded-3xl border bg-card p-10 text-center text-muted-foreground">Ainda sem dados dos NEDs para {semester ?? 'este semestre'}.</div>;

  const { neds, med } = enrich(q.data!.filter((r) => r.semester === sem).map((r) => r.data));
  const prevSem = sems[sems.indexOf(sem) - 1];
  const prev = prevSem ? enrich(q.data!.filter((r) => r.semester === prevSem).map((r) => r.data)) : null;
  const totEst = neds.reduce((s, n) => s + n.est, 0), totAt = neds.reduce((s, n) => s + n.atend, 0);
  const relN = neds.length * 3, relOk = neds.reduce((s, n) => s + n.rel.filter((x) => x === 1).length, 0);
  const full = neds.filter((n) => n.full).length;
  const regions = [...new Set(neds.map((n) => n.reg))];
  const esps = neds.map((n) => n.esp);
  const kpis = [
    { label: 'NEDs acompanhados', value: String(neds.length), note: `em ${regions.length} regiões · ${int(totEst)} estudantes` },
    { label: 'Estudantes atendidos', value: int(totAt), note: `${br((totAt / totEst) * 100)} por 100 matriculados` },
    { label: 'Espera até o acolhimento', value: `${br(med.esp, 0)} dias`, note: `média nacional · de ${Math.min(...esps)} a ${Math.max(...esps)} dias` },
    { label: 'Relatórios mensais em dia', value: `${Math.round((relOk / relN) * 100)}%`, note: `${relOk} de ${relN} entre agosto e outubro` },
    { label: 'Equipes completas', value: `${full} de ${neds.length}`, note: 'frente ao regulamento do NED', warn: full < neds.length / 2 + 1 },
  ];
  const alerts = [...neds].sort(byAttention).filter((n) => n.bad >= 3).slice(0, 3).map((n) => ({ n, text: alertText(n, med) }));

  const list = neds.filter((n) => region === 'todas' || n.reg === region);
  const sorted = [...list].sort(sortKey === 'att' ? byAttention : (a, b) => { const m = METRICS.find((x) => x.k === sortKey)!; return m.up ? a[m.k] - b[m.k] : b[m.k] - a[m.k]; });
  const f = neds.find((n) => n.key === (sel ?? alerts[0]?.n.key)) ?? neds[0];
  const fPrev = prev?.neds.find((n) => n.key === f.key);
  const TABLE_METRICS = METRICS.filter((m) => m.k !== 'ges');
  const demMed = DEM.map((_, i) => mean(neds.map((n) => n.dem[i])));
  const strengths = METRICS.filter((m) => f.g[m.k] === 1).map((m) => `${m.label}: ${m.f(f[m.k])} (média ${m.f(med[m.k])})`);
  const weak = METRICS.filter((m) => f.g[m.k] === -1).map((m) => `${m.label}: ${m.f(f[m.k])} (média ${m.f(med[m.k])})`);
  ROLES.forEach((r, i) => { if (f.eq[i] < f.need[i]) weak.push(`${r}: ${f.eq[i]} de ${f.need[i]} previstos no regulamento`); });
  const topDem = DEM.map((d, i) => ({ d, v: f.dem[i], diff: f.dem[i] - demMed[i] })).sort((a, b) => b.diff - a.diff)[0];
  const fPlans = (plans.data ?? []).filter((p) => p.ned_key === f.key);

  // Scatter
  const maxA = Math.max(...neds.map((n) => n.alc)) * 1.15, maxH = Math.max(...neds.map((n) => n.hor)) * 1.15;
  const maxEsp = Math.max(1, ...neds.map((n) => n.esp));
  const SX = (h: number) => 60 + (h / maxH) * 600, SY = (a: number) => 360 - (a / maxA) * 320;

  // Best practices
  const bp = BEST_PRACTICES.find((p) => p.key === bpKey)!;
  const origin = neds.find((n) => n.key === bp.origem)!;
  const bpMetric = METRICS.find((m) => m.k === bp.k)!;
  const cands = neds.filter((n) => n.key !== bp.origem && bp.cand(n, med));
  const benefit = new Set(BEST_PRACTICES.flatMap((p) => neds.filter((n) => p.cand(n, med)).map((n) => n.key)));

  const GROUPS = [
    { k: 'rbe', title: 'Automático pela plataforma', desc: 'Chega sozinho, a partir do uso da Rede Bem-Estar. Não dá trabalho extra ao NED.', I: Zap, tone: 'bg-primary text-primary-foreground' },
    { k: 'ned', title: 'Registro do NED', desc: 'O próprio NED registra na plataforma, uma vez por mês ou por semestre.', I: PenLine, tone: 'bg-primary/25 text-primary' },
    { k: 'aca', title: 'Sistema acadêmico Afya', desc: 'Vem da integração com o sistema acadêmico da instituição.', I: GraduationCap, tone: 'bg-muted text-muted-foreground' },
  ] as const;

  const openNed = (k: string) => { setSel(k); document.getElementById('ned-ficha')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); };

  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-accent px-3 py-1 text-xs font-semibold text-primary">Escopo: {neds.length} NEDs · Afya</span><span className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">Dados demonstrativos</span></div>
        <p className="text-xs font-semibold uppercase tracking-wider text-primary">NED Nacional · Núcleos de Experiência Discente</p>
        <h1 className="text-[34px] font-semibold leading-tight tracking-tight">Como estão os NEDs da Afya, lado a lado</h1>
        <p className="max-w-[72ch] text-muted-foreground">Uma leitura para o NED Nacional acompanhar os NEDs de cada unidade: quem tem procura acima da equipe, onde a espera cresce, quem está com a rotina de gestão em dia e quais práticas vale levar para outras unidades. Só dados do serviço, nunca de estudantes identificados.</p>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {kpis.map((x) => (
          <div key={x.label} className="rounded-[22px] border bg-card p-5">
            <p className="text-sm text-muted-foreground">{x.label}</p>
            <p className={`mt-1 text-[30px] font-semibold tabular-nums leading-tight ${x.warn ? 'text-destructive' : ''}`}>{x.value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{x.note}</p>
          </div>
        ))}
      </div>

      {alerts.length > 0 && (
        <section className="space-y-3 rounded-[28px] border border-destructive/20 bg-destructive/5 p-5 md:p-6">
          <p className="flex items-center gap-2 font-semibold text-destructive"><AlertTriangle className="h-4 w-4" />Pede atenção agora</p>
          <div className="grid gap-3 md:grid-cols-3">
            {alerts.map((a) => (
              <button key={a.n.key} type="button" onClick={() => openNed(a.n.key)} className="rounded-2xl bg-card p-4 text-left hover:shadow-sm">
                <p className="font-semibold">{a.n.nome} · {a.n.uf}</p><p className="mt-1 text-sm text-muted-foreground">{a.text}</p>
              </button>
            ))}
          </div>
        </section>
      )}

      <Sheet id="s1" open={fs} setOpen={setFs} label="Painel dos NEDs" className="space-y-4">
        <H2 title="Painel dos NEDs" sub="Cada célula compara o NED com a média nacional. Toque no título de uma coluna para ordenar (o que pede mais atenção aparece primeiro) e em uma linha para abrir a ficha do NED." />
        <div className="flex w-fit rounded-full bg-muted p-1">{['todas', ...regions].map((r) => <button key={r} type="button" onClick={() => setRegion(r)} className={pill(region === r)}>{r === 'todas' ? 'Todas' : r}</button>)}</div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] border-separate border-spacing-1 text-sm">
            <thead>
              <tr>
                <th className="text-left text-xs font-medium text-muted-foreground">NED<button type="button" onClick={() => setSortKey('att')} className={`ml-2 rounded-full px-2 py-0.5 text-[11px] ${sortKey === 'att' ? 'bg-accent text-primary' : 'hover:bg-muted'}`}>Mais pontos de atenção</button></th>
                {TABLE_METRICS.map((m) => (
                  <th key={m.k} title={m.tip} className="align-bottom">
                    <button type="button" onClick={() => setSortKey(m.k)} className={`w-full rounded-lg px-1.5 py-1 text-left ${sortKey === m.k ? 'bg-accent text-primary' : 'hover:bg-muted'}`}>
                      <span className="block text-[10px] uppercase tracking-wider text-muted-foreground">{m.pillar}</span><span className="text-xs font-semibold">{m.label}</span>
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map((n) => (
                <tr key={n.key} onClick={() => openNed(n.key)} className="cursor-pointer">
                  <td className={`rounded-lg border-2 px-2 py-1.5 ${f.key === n.key ? 'border-primary bg-accent/40' : 'border-transparent'}`}>
                    <p className="font-semibold">{n.nome} · {n.uf}</p><p className={`text-xs ${n.bad >= 3 ? 'text-destructive' : 'text-muted-foreground'}`}>{n.bad ? `${n.bad} ${n.bad === 1 ? 'ponto' : 'pontos'} de atenção` : 'Sem pontos de atenção'}</p>
                  </td>
                  {TABLE_METRICS.map((m) => <td key={m.k} title={`${n.nome} · ${m.label}: ${m.f(n[m.k])} (média ${m.f(med[m.k])})`} className={`rounded-lg text-center font-semibold tabular-nums ${CELL[String(n.g[m.k]) as '1' | '0' | '-1']}`}>{m.f(n[m.k])}</td>)}
                </tr>
              ))}
              <tr><td className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Média nacional</td>{TABLE_METRICS.map((m) => <td key={m.k} className="rounded-lg border border-dashed text-center text-xs tabular-nums">{m.f(med[m.k])}</td>)}</tr>
            </tbody>
          </table>
        </div>
        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5"><i className="h-3 w-4 rounded bg-primary/15" />Melhor que a média</span>
          <span className="flex items-center gap-1.5"><i className="h-3 w-4 rounded bg-muted/60" />Perto da média</span>
          <span className="flex items-center gap-1.5"><i className="h-3 w-4 rounded bg-destructive/10" />Pede atenção</span>
        </div>
      </Sheet>

      <div id="ned-ficha" className="scroll-mt-20">
        <Sheet id="s2" open={fs} setOpen={setFs} label="Ficha do NED" className="space-y-5">
          <div className="flex flex-wrap items-start gap-4 pr-10">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-sm font-bold text-primary-foreground">{f.nome.slice(0, 2).toUpperCase()}</span>
            <div className="flex-1"><p className="text-xs uppercase tracking-wider text-muted-foreground">Ficha do NED</p><p className="text-2xl font-semibold">{f.nome} · {f.uf}</p><p className="text-sm text-muted-foreground">{f.tipo} · {f.reg} · {int(f.est)} estudantes matriculados</p></div>
            <label className="text-xs text-muted-foreground">Trocar NED
              <select value={f.key} onChange={(e) => setSel(e.target.value)} className="ml-2 rounded-md border bg-background px-2 py-1.5 text-sm text-foreground">{neds.map((n) => <option key={n.key} value={n.key}>{n.nome} · {n.uf}</option>)}</select>
            </label>
          </div>
          <div className="flex w-fit rounded-full bg-muted p-1">{([['geral', 'Visão geral'], ['equipe', 'Equipe e rotina'], ['demandas', 'Demandas']] as const).map(([k, l]) => <button key={k} type="button" onClick={() => setTab(k)} className={pill(tab === k)}>{l}</button>)}</div>

          {tab === 'geral' && (
            <>
              <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-5">
                {METRICS.map((m) => {
                  const p = fPrev?.[m.k]; const d = p == null ? null : f[m.k] - p; const better = d == null ? null : m.up ? d > 0 : d < 0;
                  return (
                    <div key={m.k} className={`rounded-xl border p-3 ${f.g[m.k] === -1 ? 'border-destructive/30' : ''}`}>
                      <p className="text-xs text-muted-foreground">{m.label}</p>
                      <p className={`text-xl font-semibold tabular-nums ${f.g[m.k] === -1 ? 'text-destructive' : ''}`}>{m.f(f[m.k])}</p>
                      {d != null && Math.abs(d) > 0.05 && <p className={`text-[11px] ${better ? 'text-primary' : 'text-destructive'}`}>{d > 0 ? '+' : '−'}{m.f(Math.abs(d))} vs {prevSem}</p>}
                      <p className="text-[11px] text-muted-foreground">média nacional: {m.f(med[m.k])}</p>
                    </div>
                  );
                })}
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2 rounded-2xl bg-primary/5 p-4"><p className="font-semibold text-primary">Pontos fortes</p>{strengths.length ? strengths.map((t) => <p key={t} className="flex gap-2 text-sm"><Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />{t}</p>) : <p className="text-sm text-muted-foreground">Nenhum indicador acima da média.</p>}</div>
                <div className="space-y-2 rounded-2xl bg-destructive/5 p-4"><p className="font-semibold text-destructive">Pontos de atenção</p>{weak.length ? weak.map((t) => <p key={t} className="flex gap-2 text-sm"><span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-destructive/15 text-[10px] font-bold text-destructive">!</span>{t}</p>) : <p className="text-sm text-muted-foreground">Sem pontos de atenção.</p>}</div>
              </div>
            </>
          )}

          {tab === 'equipe' && (
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="space-y-3 rounded-2xl border p-4">
                <p className="font-semibold">Equipe frente ao regulamento</p>
                {ROLES.map((r, i) => (
                  <div key={r} className="grid grid-cols-[150px_1fr_60px] items-center gap-3 text-sm">
                    <span>{r}</span>
                    <div className="flex gap-1">{Array.from({ length: Math.max(f.need[i], f.eq[i], 1) }, (_, j) => <i key={j} className={`h-5 flex-1 rounded ${j < f.eq[i] ? 'bg-primary' : j < f.need[i] ? 'border-2 border-dashed border-destructive/50' : 'bg-muted'}`} />)}</div>
                    <span className={`text-right font-semibold tabular-nums ${f.eq[i] < f.need[i] ? 'text-destructive' : ''}`}>{f.eq[i]} / {f.need[i]}</span>
                  </div>
                ))}
                <p className="text-xs text-muted-foreground">{f.full ? 'Equipe completa conforme o regulamento.' : 'Faltam profissionais previstos no regulamento.'}</p>
              </div>
              <div className="space-y-3 rounded-2xl border p-4">
                <p className="font-semibold">Como o NED funciona</p>
                {[['Atendimento até', f.ate], ['Canais', f.canais], ['Participantes em ações em grupo', String(f.grupo)], ['PEIs ativos', String(f.peis)], ['Plano semestral', STATUS[f.plano]], ['CIA ativa', f.cia === 1 ? 'Sim' : 'Não']].map(([l, v]) => (
                  <div key={l} className="flex justify-between gap-4 border-b pb-2 text-sm last:border-0"><span className="text-muted-foreground">{l}</span><span className={`text-right font-medium ${v === 'Não enviado' || v === 'Atrasado' || v === 'Não' ? 'text-destructive' : ''}`}>{v}</span></div>
                ))}
                <div className="flex gap-2">{f.rel.map((r, i) => <span key={i} className={`flex-1 rounded-lg px-2 py-1.5 text-center text-xs ${r === 1 ? 'bg-primary/10 text-primary' : 'bg-destructive/10 text-destructive'}`}>Relatório {MONTHS3[i]} · {STATUS[r]}</span>)}</div>
              </div>
            </div>
          )}

          {tab === 'demandas' && (
            <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
              <div className="space-y-2">
                {DEM.map((d, i) => (
                  <div key={d} className="grid grid-cols-[230px_1fr_44px] items-center gap-3 text-sm">
                    <span>{d}</span>
                    <div className="relative h-3 rounded-full bg-muted"><div className="h-3 rounded-full bg-primary/70" style={{ width: `${f.dem[i] * 2.2}%` }} /><div className="absolute -top-1 h-5 w-0.5 bg-foreground/60" style={{ left: `${demMed[i] * 2.2}%` }} /></div>
                    <span className="text-right font-semibold tabular-nums">{f.dem[i]}%</span>
                  </div>
                ))}
                <p className="text-xs text-muted-foreground">traço = média nacional</p>
              </div>
              <div className="rounded-2xl bg-accent/60 p-4 text-sm"><p className="mb-1 text-xs font-semibold text-primary">Leitura</p>{topDem.diff > 1 ? `${topDem.d} pesa mais aqui (${topDem.v}%) do que na média nacional (${Math.round(demMed[DEM.indexOf(topDem.d)])}%).` : 'As demandas seguem o padrão nacional.'}</div>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
            <p className="text-xs text-muted-foreground">Dados do serviço do NED, sem identificar estudantes.{fPlans.length ? ` · ${fPlans.length} ${fPlans.length === 1 ? 'plano registrado' : 'planos registrados'}, último em ${new Date(fPlans[0].created_at).toLocaleDateString('pt-BR')}` : ''}</p>
            <Button onClick={() => setPlanOpen(true)}><ClipboardList className="mr-2 h-4 w-4" />Registrar plano de ação com o NED</Button>
          </div>
          {fPlans.length > 0 && <div className="space-y-2">{fPlans.slice(0, 3).map((p) => <p key={p.id} className="rounded-xl bg-muted/50 p-3 text-sm"><span className="mr-2 text-xs text-muted-foreground">{new Date(p.created_at).toLocaleDateString('pt-BR')}</span>{p.plan}</p>)}</div>}
        </Sheet>
      </div>

      <Sheet id="s3" open={fs} setOpen={setFs} label="Procura x tamanho da equipe" className="space-y-4">
        <H2 title="Procura x tamanho da equipe" sub="Quantos estudantes cada NED atende e quantas horas de equipe tem, ambos por 100 estudantes matriculados. Ajuda a decidir onde reforçar equipe ou redistribuir apoio. Toque em um NED para abrir a ficha." />
        <svg viewBox="0 0 700 400" className="w-full" role="img" aria-label="Procura por equipe">
          {[2, 4, 6, 8, 10].filter((h) => h <= maxH).map((h) => <g key={h}><line x1={SX(h)} x2={SX(h)} y1={360} y2={365} className="stroke-border" /><text x={SX(h)} y={378} textAnchor="middle" className="fill-muted-foreground text-[10px]">{h} h</text></g>)}
          <line x1={60} x2={680} y1={360} y2={360} className="stroke-border" />
          <line x1={60} x2={60} y1={30} y2={360} className="stroke-border" />
          <line x1={SX(med.hor)} x2={SX(med.hor)} y1={30} y2={360} className="stroke-muted-foreground/25" strokeDasharray="3 4" />
          <line x1={60} x2={680} y1={SY(med.alc)} y2={SY(med.alc)} className="stroke-muted-foreground/25" strokeDasharray="3 4" />
          {[[70, 45, 'start', 'Muita procura, pouca equipe'], [670, 45, 'end', 'Muita procura, equipe forte'], [70, 350, 'start', 'Pouca procura, pouca equipe'], [670, 350, 'end', 'Equipe com folga']].map(([x, y, a, l]) => <text key={l as string} x={x as number} y={y as number} textAnchor={a as any} className={`text-[10px] ${l === 'Muita procura, pouca equipe' ? 'fill-destructive' : 'fill-muted-foreground'}`}>{l}</text>)}
          {neds.map((n) => { const r = 6 + (n.esp / maxEsp) * 10, sel = f.key === n.key; return (
            <g key={n.key} onClick={() => openNed(n.key)} className="cursor-pointer">
              <title>{`${n.nome}: ${br(n.alc)} atendidos e ${br(n.hor)} h por 100 · espera ${n.esp} dias · ${quadrant(n.alc, n.hor, med.alc, med.hor)}`}</title>
              {sel && <circle cx={SX(n.hor)} cy={SY(n.alc)} r={r + 4} fill="none" stroke="hsl(var(--foreground))" strokeWidth={1.5} />}
              <circle cx={SX(n.hor)} cy={SY(n.alc)} r={r} className={n.esp > 7 ? 'fill-destructive' : 'fill-primary'} fillOpacity={0.55} />
              <text x={SX(n.hor) + r + 8} y={SY(n.alc) + 4} className={`fill-foreground text-[11px] ${sel ? 'font-semibold' : ''}`}>{n.nome}</text>
            </g>
          ); })}
          <text x={680} y={396} textAnchor="end" className="fill-muted-foreground text-[10px]">Horas de equipe por semana, por 100 estudantes</text>
          <text x={60} y={20} className="fill-muted-foreground text-[10px]">Estudantes atendidos por 100</text>
        </svg>
        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5"><i className="h-3 w-3 rounded-full bg-primary/60" />Espera até 7 dias</span>
          <span className="flex items-center gap-1.5"><i className="h-3 w-3 rounded-full bg-destructive/60" />Espera acima de 7 dias</span>
          <span className="flex items-center gap-1.5"><i className="w-5 border-t border-dashed border-muted-foreground" />Médias nacionais</span>
          <span>Tamanho do círculo = dias de espera</span>
        </div>
      </Sheet>

      <Sheet id="s4" open={fs} setOpen={setFs} label="Boas práticas" className="space-y-5">
        <div><p className="text-xs font-semibold uppercase tracking-wider text-primary">Boas práticas</p><H2 title="O que funciona em um NED pode ajudar outro" sub="Práticas que já deram resultado em uma unidade e os NEDs onde elas poderiam fazer diferença, segundo os próprios indicadores." /></div>
        <div className="grid gap-3 sm:grid-cols-3">
          {[[String(BEST_PRACTICES.length), 'práticas mapeadas'], [String(new Set(BEST_PRACTICES.map((p) => p.origem)).size), 'NEDs de origem'], [String(benefit.size), 'NEDs que podem se beneficiar']].map(([v, l]) => <div key={l} className="rounded-2xl bg-muted/40 p-4"><p className="text-2xl font-semibold">{v}</p><p className="text-xs text-muted-foreground">{l}</p></div>)}
        </div>
        <div className="grid gap-5 lg:grid-cols-[280px_1fr]">
          <div className="space-y-2">
            {BEST_PRACTICES.map((p) => { const o = neds.find((n) => n.key === p.origem); const c = neds.filter((n) => n.key !== p.origem && p.cand(n, med)).length; return (
              <button key={p.key} type="button" onClick={() => setBpKey(p.key)} className={`w-full rounded-2xl border p-3 text-left ${bpKey === p.key ? 'border-primary bg-accent/50' : 'hover:bg-muted/40'}`}>
                <p className="text-xs text-muted-foreground">{o?.nome} · {o?.uf}</p><p className="font-semibold">{p.titulo}</p><span className="mt-1 inline-block rounded-full bg-primary/10 px-2 py-0.5 text-[11px] text-primary">pode ajudar {c} {c === 1 ? 'NED' : 'NEDs'}</span>
              </button>
            ); })}
          </div>
          <div className="space-y-4">
            <div><p className="text-xs text-muted-foreground">{origin.nome} · {origin.uf}</p><p className="text-xl font-semibold">{bp.titulo}</p><p className="mt-1 text-sm text-muted-foreground">{bp.texto}</p></div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 rounded-2xl border p-4">
                <p className="text-xs font-semibold">Resultado no NED de origem</p>
                <p className="text-3xl font-semibold tabular-nums text-primary">{bpMetric.f(origin[bp.k])}</p><p className="text-xs text-muted-foreground">{bp.unit}</p>
                {[['Antes', bp.antes], ['Depois', origin[bp.k]]].map(([l, v]) => <div key={l as string} className="grid grid-cols-[52px_1fr_60px] items-center gap-2 text-xs"><span>{l}</span><div className="h-2.5 rounded-full bg-muted"><div className={`h-2.5 rounded-full ${l === 'Antes' ? 'bg-muted-foreground/40' : 'bg-primary'}`} style={{ width: `${Math.min(100, ((v as number) / bp.max) * 100)}%` }} /></div><span className="text-right tabular-nums">{bpMetric.f(v as number)}</span></div>)}
              </div>
              <div className="space-y-2 rounded-2xl border p-4">
                <p className="text-xs font-semibold">O que precisa para replicar</p>
                {bp.steps.map((s, i) => <p key={s} className="flex gap-2 text-sm"><span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">{i + 1}</span>{s}</p>)}
              </div>
            </div>
            <div className="space-y-2 rounded-2xl bg-muted/40 p-4">
              <p className="text-xs font-semibold">Onde pode ajudar <span className="font-normal text-muted-foreground">· {bpMetric.label}</span></p>
              {cands.length ? cands.map((c) => (
                <div key={c.key} className="grid grid-cols-[140px_1fr_60px] items-center gap-2 text-sm">
                  <button type="button" onClick={() => openNed(c.key)} className="text-left font-medium hover:text-primary">{c.nome}</button>
                  <div className="relative h-2.5 rounded-full bg-card"><div className="h-2.5 rounded-full bg-destructive/50" style={{ width: `${Math.min(100, (c[bp.k] / bp.max) * 100)}%` }} /><div className="absolute -top-1 h-4.5 h-[18px] w-0.5 bg-foreground/60" style={{ left: `${Math.min(100, (med[bp.k] / bp.max) * 100)}%` }} /></div>
                  <span className="text-right tabular-nums">{bpMetric.f(c[bp.k])}</span>
                </div>
              )) : <p className="text-sm text-muted-foreground">Nenhum outro NED com esse perfil agora.</p>}
              <p className="text-[11px] text-muted-foreground">traço = média nacional · toque no nome para abrir a ficha</p>
            </div>
            <div className="flex flex-wrap items-center gap-3"><Button variant="outline" onClick={() => openNed(origin.key)}>Ver ficha de {origin.nome}</Button><p className="text-xs text-muted-foreground">Leitura descritiva: o resultado pode ter outras causas além da prática.</p></div>
          </div>
        </div>
      </Sheet>

      <Sheet id="s5" open={fs} setOpen={setFs} label="De onde vem cada número" className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3 pr-10"><H2 title="De onde vem cada número" sub="Proposta de indicadores para validar com o NED Nacional, organizada pela fonte de cada dado." /><span className="rounded-full bg-accent px-3 py-1 text-xs font-semibold text-primary">Proposta · a validar com a Afya</span></div>
        <div className="grid gap-4 lg:grid-cols-3">
          {GROUPS.map((g) => { const items = INDICATORS.filter((x) => x[2] === g.k); return (
            <div key={g.k} className="space-y-3 rounded-2xl border p-4">
              <div className="flex items-center gap-3"><span className={`flex h-9 w-9 items-center justify-center rounded-xl ${g.tone}`}><g.I className="h-4 w-4" /></span><div><p className="font-semibold">{g.title}</p><p className="text-xs text-muted-foreground">{items.length} {items.length === 1 ? 'indicador' : 'indicadores'}</p></div></div>
              <p className="text-xs text-muted-foreground">{g.desc}</p>
              {items.map(([n, d, , qq]) => <div key={n} className="rounded-xl bg-muted/40 p-3"><div className="flex justify-between gap-2"><p className="text-sm font-medium">{n}</p><span className="text-[11px] text-muted-foreground">{qq}</span></div><p className="text-xs text-muted-foreground">{d}</p></div>)}
            </div>
          ); })}
        </div>
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground"><Database className="h-3.5 w-3.5" />Nenhum dado de estudante identificado entra nesta leitura.</p>
      </Sheet>

      <Dialog open={planOpen} onOpenChange={setPlanOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Plano de ação · {f.nome}</DialogTitle></DialogHeader>
          <Textarea rows={6} value={planText} onChange={(e) => setPlanText(e.target.value)} placeholder="O que foi combinado com o NED, responsáveis e prazos." maxLength={2000} />
          <DialogFooter><Button variant="outline" onClick={() => setPlanOpen(false)}>Cancelar</Button><Button disabled={planText.trim().length < 5 || addPlan.isPending} onClick={() => addPlan.mutate({ ned_key: f.key, plan: planText.trim() })}>Registrar</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
