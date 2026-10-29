import { useMemo, useState, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ShieldCheck, Database } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { LogoLoader } from '@/components/ui/logo-loader';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Sheet } from '../overview/OverviewView';
import { DEMO_MODEL } from './permanenceModel';
import { resolveModel, type SnapshotData, C, LK, LK_LEGEND, P, bars, contextFlags, heat, layout, lkRow, makeEngine, sum, type LkRow } from './permanenceLogic';

const Eyebrow = ({ children }: { children: ReactNode }) => <p className="text-[11px] font-semibold tracking-[0.1em]" style={{ color: C.brand }}>{children}</p>;
const Head = ({ n, title, sub }: { n: string; title: string; sub: string }) => (
  <div className="pr-11"><Eyebrow>{n}</Eyebrow><h2 className="mt-1 text-[22px] font-semibold leading-tight" style={{ color: C.ink }}>{title}</h2><p className="mt-1 max-w-[66ch] text-sm" style={{ color: C.muted }}>{sub}</p></div>
);
const Tip = ({ tip, children }: { tip: string; children: ReactNode }) => (
  <Tooltip><TooltipTrigger asChild>{children}</TooltipTrigger><TooltipContent>{tip}</TooltipContent></Tooltip>
);
const Pill = ({ on, onClick, children }: { on: boolean; onClick: () => void; children: ReactNode }) => (
  <button onClick={onClick} className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm transition-colors"
    style={{ background: on ? C.card : 'transparent', color: on ? C.brand : C.text, fontWeight: on ? 600 : 500, boxShadow: on ? '0 1px 3px hsl(var(--rp-deep) / .15)' : 'none' }}>{children}</button>
);
const Track = ({ children }: { children: ReactNode }) => <div className="inline-flex flex-wrap gap-1 rounded-full p-1" style={{ background: C.bg }}>{children}</div>;
const Ini = ({ ini, bg, fg }: { ini: string; bg: string; fg: string }) => <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full font-mono text-[10px] font-bold" style={{ background: bg, color: fg }}>{ini}</span>;

function HBars({ rows }: { rows: ReturnType<typeof bars> }) {
  return <div className="flex flex-col gap-2.5">{rows.map((t) => (
    <div key={t.l} className="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1">
      <span className="text-[13px]" style={{ color: C.text, fontWeight: t.fw }}>{t.l}</span>
      <span className="text-right font-mono text-[13px] font-semibold" style={{ color: C.ink }}>{t.v}</span>
      <span className="col-span-2 block h-2 rounded-full" style={{ background: C.bg }}><span className="block h-full rounded-full" style={{ width: t.w, background: t.c }} /></span>
    </div>))}</div>;
}
function Diverging({ rows, labelW = 'md:grid-cols-[minmax(180px,260px)_1fr_auto]' }: { rows: LkRow[]; labelW?: string }) {
  return (
    <div className="flex flex-col gap-3">
      <div className={`hidden ${labelW} gap-3 font-mono text-[10px] tracking-wider md:grid`} style={{ color: C.muted }}>
        <span /><span className="flex justify-between"><span>← SEM DIFICULDADE</span><span>COM FREQUÊNCIA →</span></span><span className="w-20 text-right">SEM · FREQ.</span>
      </div>
      {rows.map((r) => (
        <div key={r.label} className={`grid grid-cols-1 items-center gap-1.5 md:gap-3 ${labelW}`}>
          <span className="text-[13px]" style={{ color: C.ink, fontWeight: r.fw ?? 500 }}>{r.label}</span>
          <div className="relative h-6">
            <span className="absolute inset-y-[-4px] left-1/2 w-px" style={{ background: C.lilac }} />
            {r.segs!.map((s, i) => <Tip key={i} tip={s.tip}><span className="absolute inset-y-0 cursor-default" style={{ left: s.left, width: s.w, background: s.c, borderRadius: s.r }} /></Tip>)}
          </div>
          <span className="flex w-20 justify-end gap-2 font-mono text-[13px] font-semibold"><span style={{ color: C.deep }}>{r.favT}</span><span style={{ color: C.roseFg }}>{r.unfT}</span></span>
        </div>))}
      <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs" style={{ color: C.muted }}>
        {LK_LEGEND.map((l) => <span key={l.l} className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-sm" style={{ background: l.c }} />{l.l}</span>)}
        <span>· passe o mouse para ver a alternativa exata</span>
      </div>
    </div>
  );
}
const Insight = ({ children, tone = 'soft' }: { children: ReactNode; tone?: 'soft' | 'rose' }) => (
  <p className="rounded-2xl p-4 text-sm leading-relaxed" style={{ background: tone === 'rose' ? C.roseBg : C.soft, color: tone === 'rose' ? C.roseFg : C.deep }}>{children}</p>
);

export function PermanenceView({ institutionId, semester }: { institutionId?: string; semester: string | null }) {
  const [fs, setFs] = useState<string | null>(null);
  const [rec, setRec] = useState('all');
  const [prof, setProf] = useState('work');
  const [expTab, setExpTab] = useState('pert');
  const [expSel, setExpSel] = useState<number>(0);
  const [sem, setSem] = useState<string | null>(null);

  const q = useQuery({
    queryKey: ['permanence-snapshots', institutionId], enabled: !!institutionId,
    queryFn: async () => {
      const { data, error } = await (supabase as any).from('institution_permanence_snapshots').select('semester, data').eq('institution_id', institutionId).order('semester');
      if (error) throw error;
      return data as { semester: string; data: SnapshotData }[];
    },
  });
  const rows = q.data ?? [];
  const semesters = rows.map((r) => r.semester);
  const activeSem = sem && semesters.includes(sem) ? sem : semester && semesters.includes(semester) ? semester : semesters[semesters.length - 1];
  const snap = rows.find((r) => r.semester === activeSem)?.data;
  const model = useMemo(() => (snap ? resolveModel(DEMO_MODEL, snap) : null), [snap]);

  const vm = useMemo(() => (model ? build(model, rec, prof, expTab, expSel) : null), [model, rec, prof, expTab, expSel]);

  if (q.isLoading) return <div className="grid min-h-[50vh] place-items-center"><LogoLoader /></div>;
  if (!vm || !model) return (
    <div className="radar-perm rounded-[28px] border p-10 text-center" style={{ background: C.card }}>
      <Database className="mx-auto h-8 w-8" style={{ color: C.lav }} />
      <h2 className="mt-3 text-lg font-semibold">Ainda sem dados do Radar de Permanência</h2>
      <p className="mx-auto mt-1 max-w-md text-sm" style={{ color: C.muted }}>Quando a instituição aplicar o questionário de permanência, as leituras coletivas aparecerão aqui. Grupos com menos de 10 respostas ficam ocultos.</p>
    </div>
  );
  const { hero, who, perm, mat, ev, hid, exp, cli, voz, fic, recs } = vm;
  const S = (id: string, label: string, children: ReactNode, cls = '') => <Sheet id={id} open={fs} setOpen={setFs} label={label} className={`flex flex-col gap-5 ${cls}`}>{children}</Sheet>;

  return (
    <TooltipProvider delayDuration={100}>
      <div className="radar-perm flex flex-col gap-6" style={{ color: C.ink }}>
        {/* hero */}
        <section className="relative overflow-hidden rounded-[28px] p-6 md:p-9" style={{ background: C.deep, color: C.onDeep }}>
          <div className="rp-gridbg pointer-events-none absolute inset-0" aria-hidden />
          <div className="relative flex flex-col gap-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="max-w-[70ch]">
                <p className="font-mono text-[11px] tracking-[0.14em]" style={{ color: C.onDeepRose }}>RADAR DE PERMANÊNCIA · {activeSem}</p>
                <h1 className="mt-2 text-[clamp(24px,3vw,34px)] font-semibold leading-tight">O que acontece fora da sala e pesa na decisão de ficar</h1>
                <p className="mt-2 text-sm opacity-80">O que só o Radar mostra: condições de vida, barreiras concretas, vínculo com o curso, confiança na instituição e o que os estudantes pedem. Leitura coletiva e protegida, sem respostas individuais e sem previsão de evasão.</p>
              </div>
              {semesters.length > 1 && (
                <div className="inline-flex gap-1 rounded-full bg-background/10 p-1">{semesters.map((s) => (
                  <button key={s} onClick={() => setSem(s)} className="rounded-full px-3 py-1 font-mono text-xs" style={{ background: s === activeSem ? C.card : 'transparent', color: s === activeSem ? C.brand : C.onDeep }}>{s}</button>))}</div>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-[10px] tracking-widest opacity-70">RECORTE</span>
              {recs.map((r) => (
                <button key={r.k} onClick={() => setRec(r.k)} className="rp-glassrow flex items-center gap-1.5 rounded-full py-1 pr-3 text-sm" style={{ paddingLeft: r.ini ? 6 : 12, background: r.k === rec ? C.card : 'hsl(var(--rp-card) / .08)', color: r.k === rec ? C.brand : C.onDeep, fontWeight: r.k === rec ? 600 : 500 }}>
                  {r.ini && <Ini ini={r.ini} bg={r.bg!} fg={r.fg!} />}{r.label}
                </button>))}
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{hero.kpis.map((k) => (
              <div key={k.label} className="rounded-2xl p-4" style={{ background: k.rose ? C.roseBg : C.soft, color: k.rose ? C.roseFg : C.deep }}>
                <p className="text-[13px] font-medium" style={{ color: C.text }}>{k.label}</p>
                <p className="mt-1 font-mono text-[34px] font-semibold leading-none">{k.v}</p>
                <p className="mt-1 text-xs" style={{ color: C.muted }}>{k.note}</p>
              </div>))}</div>
            <div className="flex flex-wrap gap-x-6 gap-y-2 border-t pt-4" style={{ borderColor: 'hsl(var(--rp-card) / .15)' }}>{hero.meta.map((m) => (
              <span key={m.l} className="font-mono text-[11px] tracking-wider"><span className="opacity-60">{m.l}</span> <span className="font-semibold">{m.v}</span></span>))}</div>
          </div>
        </section>

        {S('s1', 'Quem são os estudantes', <>
          <Head n="01 · QUEM SÃO OS ESTUDANTES" title="A vida que chega junto com o estudante" sub="De cada 100 estudantes que responderam: quem trabalha muitas horas, quem cuida de alguém e quem passa mais de uma hora no trajeto. Escolha um perfil para destacar. É contexto, não fator de risco." />
          <div className="flex flex-wrap gap-6">
            <div role="img" aria-label={who.aria} className="grid w-full max-w-[320px] grid-cols-10 gap-1.5">
              {who.dots.map((c, i) => <span key={i} className="aspect-square rounded-full transition-colors" style={{ background: c }} />)}
            </div>
            <div className="flex min-w-0 flex-[1_1_320px] flex-col gap-2">{who.profiles.map((p) => (
              <button key={p.k} onClick={() => setProf(p.k)} className="rp-arow flex items-center gap-3 rounded-2xl border px-4 py-3 text-left"
                style={{ borderColor: p.on ? C.brand : C.lil2, background: p.on ? C.soft : C.card, color: p.on ? C.deep : C.text }}>
                <i className="h-3 w-3 shrink-0 rounded-full" style={{ background: p.dot }} />
                <span className="flex-1"><span className="block text-sm font-semibold">{p.label}</span><span className="block text-xs" style={{ color: C.muted }}>{p.sub}</span></span>
                <span className="font-mono text-2xl font-semibold">{p.n}</span>
              </button>))}</div>
          </div>
          <div className="grid gap-5 md:grid-cols-2">{who.bars.map((b) => (
            <div key={b.title} className="flex flex-col gap-2">
              <p className="text-sm font-semibold">{b.title}</p>
              <div className="flex h-9 overflow-hidden rounded-xl">{b.segs.map((s) => <Tip key={s.l} tip={`${s.l}: ${s.v}`}><span className="grid place-items-center font-mono text-xs font-semibold" style={{ width: s.w, background: s.c, color: s.fg }}>{s.txt}</span></Tip>)}</div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs" style={{ color: C.muted }}>{b.segs.map((s) => <span key={s.l} className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-sm" style={{ background: s.c }} />{s.l} {s.v}</span>)}</div>
            </div>))}</div>
          <Insight>{who.insight}</Insight>
        </>)}

        {S('s2', 'Intenção de permanência', <>
          <Head n="02 · INTENÇÃO DE PERMANÊNCIA" title="Quatro sinais diferentes, nunca somados" sub="Rematrícula, trancamento, abandono e mudança de curso são decisões distintas e aparecem separadas. Cada cartão mostra a distribuição das respostas e a comparação entre as unidades." />
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{perm.cards.map((c) => (
            <div key={c.title} className="rp-arow flex flex-col gap-3 rounded-2xl border p-4" style={{ borderColor: C.lil2 }}>
              <p className="text-sm font-semibold">{c.title}</p>
              <div><p className="font-mono text-[32px] font-semibold leading-none" style={{ color: c.rose ? C.roseFg : C.deep }}>{c.v}</p><p className="mt-1 text-xs" style={{ color: C.muted }}>{c.what}</p></div>
              <div className="flex h-3 overflow-hidden rounded-full">{c.segs.map((s, i) => <Tip key={i} tip={s.tip}><span style={{ width: s.w, background: s.c }} /></Tip>)}</div>
              <p className="text-xs italic" style={{ color: C.muted }}>{c.q}</p>
              <div className="flex flex-col gap-1.5">{c.units.map((u) => (
                <div key={u.ini} className="flex items-center gap-2" style={{ opacity: u.op }}><Ini ini={u.ini} bg={u.bg} fg={u.fg} /><span className="h-2 flex-1 rounded-full" style={{ background: C.bg }}><span className="block h-full rounded-full" style={{ width: u.w, background: C.rose }} /></span><span className="w-9 text-right font-mono text-xs font-semibold">{u.v}</span></div>))}</div>
            </div>))}</div>
          <div className="grid gap-4 lg:grid-cols-[1.1fr_1fr]">
            <div className="flex flex-col gap-3 rounded-2xl p-5" style={{ background: C.deep, color: C.onDeep }}>
              <p className="font-mono text-[11px] tracking-widest" style={{ color: C.onDeepRose }}>PERMANÊNCIA RECUPERÁVEL</p>
              <p className="font-mono text-[48px] font-semibold leading-none" aria-label={perm.recAria}>{perm.rec}</p>
              <p className="text-sm opacity-90">{perm.recText}</p>
              <p className="text-sm opacity-70">{perm.altText}</p>
            </div>
            <div className="flex flex-col gap-3">
              <p className="text-sm font-semibold">O que mais ameaça a continuidade</p>
              <HBars rows={perm.threats} />
              <p className="text-xs" style={{ color: C.muted }}>Mais de uma escolha por pessoa.</p>
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2">{perm.extra.map((e) => (
            <div key={e.t} className="flex items-center gap-4 rounded-2xl p-4" style={{ background: e.rose ? C.roseBg : C.soft, color: e.rose ? C.roseFg : C.deep }}>
              <span className="font-mono text-3xl font-semibold">{e.v}</span><span className="text-sm" style={{ color: C.text }}>{e.t}</span></div>))}</div>
        </>)}

        {S('s3', 'O que pesa fora da sala', <>
          <Head n="03 · O QUE PESA FORA DA SALA" title="Barreiras concretas nos últimos 30 dias" sub="Cada barreira aparece separada, porque pedem respostas diferentes. A barra parte do centro: à esquerda, quem não enfrentou a barreira; à direita, em rosa, quem enfrentou com frequência." />
          <Diverging rows={mat.rows} />
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="flex flex-col gap-3"><p className="text-sm font-semibold">Apoios materiais que fariam diferença agora</p><HBars rows={mat.needs} /></div>
            <div className="flex flex-col gap-3">
              <p className="text-sm font-semibold">Eventos de vida no semestre <span className="font-normal" style={{ color: C.muted }}>· {ev.any}</span></p>
              <HBars rows={ev.rows} />
              <Insight tone="rose"><b>{ev.alertTitle}</b> {ev.alertText}</Insight>
            </div>
          </div>
        </>)}

        {S('s4', 'Demanda oculta', <>
          <Head n="04 · DEMANDA OCULTA" title="Quem precisou de apoio e não chegou" sub="Nos últimos 6 meses: quem precisou e conseguiu acessar, quem tentou e não conseguiu, e quem precisou mas nem procurou. E o quanto os estudantes conhecem e confiam nos caminhos de apoio." />
          <div className="grid gap-3 md:grid-cols-3">{hid.steps.map((s) => (
            <div key={s.l} className="rounded-2xl p-4" style={{ background: s.bg, color: s.fg }}>
              <p className="text-[13px]" style={{ color: s.lfg }}>{s.l}</p><p className="mt-1 font-mono text-[34px] font-semibold leading-none">{s.v}</p><p className="mt-1 text-xs" style={{ color: s.nfg }}>{s.n}</p></div>))}</div>
          <div role="img" aria-label={hid.aria} className="flex h-10 overflow-hidden rounded-xl">{hid.segs.map((s) => <Tip key={s.l} tip={`${s.l}: ${s.v}`}><span className="grid place-items-center font-mono text-xs font-semibold" style={{ width: s.w, background: s.c, color: s.fg }}>{s.txt}</span></Tip>)}</div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs" style={{ color: C.muted }}>{hid.segs.map((s) => <span key={s.l} className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-sm border" style={{ background: s.c }} />{s.l} {s.v}</span>)}</div>
          <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
            <div className="flex flex-col gap-3"><p className="text-sm font-semibold">Confiança nos caminhos de apoio</p><Diverging rows={hid.trust} /></div>
            <div className="flex flex-col gap-3"><p className="text-sm font-semibold">Como gostariam de ser procurados</p><HBars rows={hid.contact} /></div>
          </div>
          <Insight>{hid.insight}</Insight>
        </>)}

        {S('s5', 'Vínculo com o curso e a instituição', <>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <Head n="05 · VÍNCULO COM O CURSO E A INSTITUIÇÃO" title="Pertencimento, sentido do curso e vida acadêmica" sub="Percentual de respostas favoráveis em cada pergunta, por unidade. Clique numa linha para ver a distribuição completa." />
            <Track>{exp.tabs.map((t) => <Pill key={t.k} on={t.on} onClick={() => { setExpTab(t.k); setExpSel(0); }}>{t.label}</Pill>)}</Track>
          </div>
          <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
            <div className="overflow-x-auto">
              <table className="w-full border-separate border-spacing-1 text-sm">
                <thead><tr><th />{exp.heads.map((h) => <th key={h.l} className="rounded-lg px-2 py-1 font-mono text-[11px]" style={{ background: h.on ? C.ink : 'transparent', color: h.on ? C.card : C.muted }}>{h.l}</th>)}</tr></thead>
                <tbody>{exp.rows.map((r, i) => (
                  <tr key={r.label} onClick={() => setExpSel(i)} className="rp-grow cursor-pointer">
                    <td className="rounded-lg border-l-[3px] px-3 py-2" style={{ borderColor: r.on ? C.brand : 'transparent', background: r.on ? C.soft : 'transparent', fontWeight: r.on ? 600 : 500 }}>{r.label}</td>
                    {r.cells.map((c, j) => <td key={j} title={c.tip} className="w-16 rounded-lg py-2 text-center font-mono text-[13px] font-semibold" style={{ background: c.bg, color: c.fg, outline: c.ol, outlineOffset: -2 }}>{c.v}</td>)}
                  </tr>))}</tbody>
              </table>
            </div>
            <div className="flex flex-col gap-3 rounded-2xl p-4" style={{ background: C.bg }}>
              <p className="font-mono text-[11px] tracking-wider" style={{ color: C.muted }}>{exp.d.period.toUpperCase()}</p>
              <p className="text-sm font-semibold">“{exp.d.q}”</p>
              <Diverging rows={exp.d.rows} labelW="md:grid-cols-[110px_1fr_auto]" />
            </div>
          </div>
          <Insight>{exp.insight}</Insight>
        </>)}

        {S('s6', 'Convivência e segurança', <>
          <Head n="06 · CONVIVÊNCIA E SEGURANÇA" title="Respeito, segurança e saber a quem recorrer" sub="Experiências de desrespeito e discriminação no semestre, sensação de segurança no campus e conhecimento dos canais de proteção." />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{cli.tiles.map((t) => (
            <div key={t.l} className="rounded-2xl p-4" style={{ background: t.rose ? C.roseBg : C.soft, color: t.rose ? C.roseFg : C.deep }}>
              <p className="font-mono text-[32px] font-semibold leading-none">{t.v}</p><p className="mt-2 text-[13px]" style={{ color: C.text }}>{t.l}</p><p className="mt-1 text-xs" style={{ color: C.muted }}>{t.q}</p></div>))}</div>
          <Insight tone="rose"><b>{cli.gapTitle}</b> {cli.gapText}</Insight>
        </>)}

        {S('s7', 'Voz dos estudantes', <>
          <Head n="07 · VOZ DOS ESTUDANTES" title="O que os estudantes pedem" sub="Prioridades escolhidas pelos próprios estudantes: o que a instituição deveria fazer primeiro, o que ajudaria a se sentir parte, quando e em que formato o apoio funciona melhor." />
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="flex flex-col gap-3"><p className="text-sm font-semibold">A primeira prioridade da instituição deveria ser</p><HBars rows={voz.first} /></div>
            <div className="flex flex-col gap-3"><p className="text-sm font-semibold">O que ajudaria a se sentir parte</p><HBars rows={voz.welcome} /></div>
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="flex flex-col gap-3"><p className="text-sm font-semibold">Melhor momento para oferecer apoio</p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">{voz.timing.map((t) => <div key={t.l} className="rounded-xl p-3" style={{ background: t.top ? C.deep : C.bg, color: t.top ? C.onDeep : C.ink }}><p className="font-mono text-xl font-semibold">{t.v}</p><p className="text-xs" style={{ color: t.top ? C.onDeepRose : C.text }}>{t.l}</p></div>)}</div>
            </div>
            <div className="flex flex-col gap-3"><p className="text-sm font-semibold">Formatos preferidos</p>
              <div className="flex flex-wrap gap-2">{voz.format.map((f) => <span key={f.l} className="rounded-full px-3 py-1.5 text-sm" style={{ background: f.top ? C.brand : C.lil2, color: f.top ? C.onDeep : C.deep }}>{f.l} <b className="font-mono">{f.v}</b></span>)}</div>
            </div>
          </div>
          <div className="flex flex-col gap-3 rounded-2xl p-5" style={{ background: C.soft }}>
            <p className="text-sm"><b className="font-mono text-2xl" style={{ color: C.deep }}>{voz.co}</b> {voz.coText}</p>
            <div className="flex h-3 overflow-hidden rounded-full">{voz.coSegs.map((s) => <Tip key={s.l} tip={`${s.l}: ${s.v}`}><span style={{ width: s.w, background: s.c }} /></Tip>)}</div>
            <div className="flex flex-wrap gap-x-4 text-xs" style={{ color: C.muted }}>{voz.coSegs.map((s) => <span key={s.l} className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-sm border" style={{ background: s.c }} />{s.l} {s.v}</span>)}</div>
          </div>
        </>)}

        {S('s8', 'Ficha técnica', <>
          <Head n="08 · FICHA TÉCNICA" title="De onde vêm estes números" sub="Cobertura por unidade, instrumento e regras de proteção." />
          <div className="flex flex-col gap-2">{fic.cov.map((c) => (
            <div key={c.ini} className="flex items-center gap-3"><Ini ini={c.ini} bg={c.bg} fg={c.fg} /><span className="h-3 flex-1 rounded-full" style={{ background: C.bg }}><span className="block h-full rounded-full" style={{ width: c.w, background: C.mid }} /></span><span className="w-12 text-right font-mono text-sm font-semibold">{c.pct}</span><span className="w-28 text-right text-xs" style={{ color: C.muted }}>{c.n}</span></div>))}</div>
          <div className="grid gap-3 md:grid-cols-2">{fic.notes.map((n) => <div key={n.t} className="rounded-2xl border p-4" style={{ borderColor: C.lil2 }}><p className="text-sm font-semibold">{n.t}</p><p className="mt-1 text-sm" style={{ color: C.text }}>{n.d}</p></div>)}</div>
        </>)}

        <p className="flex items-center gap-2 text-xs" style={{ color: C.muted }}><ShieldCheck className="h-4 w-4" />A instituição vê tendências coletivas, nunca relatos pessoais. Grupos com menos de 10 pessoas ficam ocultos.</p>
      </div>
    </TooltipProvider>
  );
}

function build(m: ReturnType<typeof resolveModel>, recIn: string, prof: string, expTab: string, expSel: number) {
  const e = makeEngine(m, recIn);
  const { UN, NT, EST, CUR, R, fav, unf, risk3, ord, dist, multi, scal, arr, unitStyle } = e;
  const I = m.items;
  const recName = CUR ? CUR.nome : 'toda a instituição';
  const nRec = CUR ? CUR.n : NT;
  const recs = [{ k: 'all', label: 'Toda a instituição' } as { k: string; label: string; ini?: string; bg?: string; fg?: string }]
    .concat(UN.map((u) => { const [bg, fg] = unitStyle(u.k); return { k: u.k, label: u.nome, ini: u.ini, bg, fg }; }));

  const HID = arr(m.hidden, 5);
  const abandAny = unf(I.aband) + ord(I.aband, dist(I.aband)).p[2];
  const pertFirst = m.exp.pert.items[0];
  const hero = {
    kpis: [
      { label: 'Pensaram em abandonar o curso', v: P(abandAny), note: 'ao menos algumas vezes no semestre', rose: true },
      { label: 'Precisaram de apoio e não chegaram', v: P(HID[1] + HID[2]), note: 'não procuraram ou não conseguiram acessar', rose: true },
      { label: 'Preocupação financeira tira a atenção', v: P(unf(I.finAtt)), note: 'frequentemente ou quase sempre', rose: false },
      { label: 'Sentem que fazem parte do curso', v: P(fav(pertFirst)), note: 'bastante ou muito', rose: false },
    ],
    meta: [
      { l: 'RECORTE', v: recName.toUpperCase() },
      { l: 'RESPONDERAM', v: `${nRec.toLocaleString('pt-BR')} de ${(CUR ? CUR.est : EST).toLocaleString('pt-BR')}` },
      { l: 'COBERTURA', v: P((nRec / (CUR ? CUR.est : EST)) * 100) },
      { l: 'INSTRUMENTO', v: m.instrument.toUpperCase() },
      { l: 'PROTEÇÃO', v: 'GRUPOS < 10 OCULTOS' },
    ],
  };

  // 01
  const ctxK = ['w', 'c', 't', 'a', 'night'] as const;
  const Cx = Object.fromEntries(ctxK.map((k) => [k, Math.round(R === 'all' ? sum(UN.map((u) => m.ctx[u.k][k] * u.n)) / NT : m.ctx[R][k])])) as Record<(typeof ctxK)[number], number>;
  const flags = contextFlags(Cx);
  const none = flags.filter((f) => !f.w && !f.c && !f.t).length;
  type F = (typeof flags)[number];
  const PROF: { k: string; label: string; sub: string; n: number; test: (f: F) => boolean }[] = [
    { k: 'work', label: 'Trabalham mais de 20 horas por semana', sub: 'atividade remunerada', n: Cx.w, test: (f) => f.w },
    { k: 'care', label: 'Cuidam de alguém', sub: 'filhos, pessoa idosa ou adoecida, casa', n: Cx.c, test: (f) => f.c },
    { k: 'commute', label: 'Passam mais de 1 hora no trajeto', sub: 'ida e volta, por dia de aula', n: Cx.t, test: (f) => f.t },
    { k: 'all3', label: 'Vivem as três situações ao mesmo tempo', sub: 'trabalho, cuidado e trajeto longo', n: Cx.a, test: (f) => f.w && f.c && f.t },
    { k: 'none', label: 'Nenhuma das três', sub: 'sem esses pesos fora da sala', n: none, test: (f) => !f.w && !f.c && !f.t },
  ];
  const PSEL = PROF.find((p) => p.k === prof) ?? PROF[0];
  const dotOf = (k: string) => (k === 'none' ? C.lav : k === 'all3' ? C.rose : C.brand);
  const shiftB: Record<string, number> = { 'Manhã': m.shift['Manhã'], 'Tarde': m.shift['Tarde'], 'Noite': Cx.night, 'Integral': m.shift['Integral'], 'Varia muito': m.shift['Varia muito'] };
  const shiftT = sum(Object.values(shiftB));
  const SHC = [C.lilac, C.lav, C.deep, C.mid, C.pale], SHF = [C.ink, C.ink, C.onDeep, C.onDeep, C.ink];
  const stageB = m.stage[R] ?? m.stage.all;
  const who = {
    aria: `De cada 100 estudantes, ${PSEL.n}: ${PSEL.label.toLowerCase()}`,
    dots: flags.map((f) => (PSEL.test(f) ? dotOf(PSEL.k) : C.dot)),
    profiles: PROF.map((p) => ({ k: p.k, label: p.label, sub: p.sub, n: String(p.n), on: p.k === PSEL.k, dot: dotOf(p.k) })),
    bars: [
      { title: 'Turno da maior parte das atividades', segs: Object.keys(shiftB).map((l, i) => { const x = (shiftB[l] / shiftT) * 100; return { l, v: P(x), w: `${x}%`, c: SHC[i], fg: SHF[i], txt: x >= 9 ? P(x) : '' }; }) },
      { title: 'Etapa do curso', segs: ['Primeiro ano', 'Etapa intermediária', 'Etapa de conclusão'].map((l, i) => ({ l, v: P(stageB[i]), w: `${stageB[i]}%`, c: [C.lav, C.mid, C.deep][i], fg: i === 0 ? C.ink : C.onDeep, txt: P(stageB[i]) })) },
    ],
    insight: `${Cx.a} em cada 100 estudantes ${CUR ? `de ${CUR.nome} ` : ''}trabalham mais de 20 horas, cuidam de alguém e passam mais de uma hora no trajeto, tudo ao mesmo tempo. ${Cx.night}% estudam à noite. Horários, prazos e formatos pensados para quem só estuda deixam esse grupo de fora.`,
  };

  // 02
  const unitMini = (it: (typeof I)[string], measure: (it: (typeof I)[string], r: string) => number) => {
    const vals = UN.map((u) => measure(it, u.k)); const max = Math.max(...vals, 1);
    return UN.map((u, i) => { const [bg, fg] = unitStyle(u.k); return { ini: u.ini, bg, fg, v: P(vals[i]), w: `${(vals[i] / max) * 100}%`, op: R === 'all' || R === u.k ? 1 : 0.35 }; });
  };
  const CARDS = [
    { it: I.remat, title: 'Rematrícula', what: 'acham improvável se rematricular', m: unf },
    { it: I.tranc, title: 'Trancamento temporário', what: 'pensaram em trancar algumas vezes ou mais', m: risk3 },
    { it: I.aband, title: 'Abandono do curso', what: 'pensaram em abandonar algumas vezes ou mais', m: risk3 },
    { it: I.mudar, title: 'Mudança de curso ou área', what: 'pensaram em mudar algumas vezes ou mais', m: risk3 },
  ];
  const recov = Math.round(scal(m.recov));
  const altO = ord(I.altern, dist(I.altern)), altLow = altO.p[2] + altO.p[3] + altO.p[4];
  const perm = {
    cards: CARDS.map((c) => {
      const o = ord(c.it, dist(c.it)), val = c.m(c.it);
      return { title: c.title, what: c.what, v: P(val), rose: val >= 15, q: c.it.q, segs: o.p.map((x, i) => ({ w: `${x}%`, c: LK[i], tip: `${o.lab[i]}: ${P(x)}` })), units: unitMini(c.it, c.m) };
    }),
    rec: `${recov}%`, recAria: `${recov}% continuariam se as dificuldades fossem resolvidas`,
    recText: `Entre quem pensou em trancar ou abandonar, ${recov}% dizem que teriam grande ou total intenção de continuar se as principais dificuldades fossem resolvidas.`,
    altText: `${P(altLow)} não sabem se existem alternativas dentro da instituição para ajudá-los a ficar, ou acreditam pouco nisso.`,
    threats: bars(multi(m.thr, m.thrm), { skip: ['Nenhum no momento'], hl: 2 }),
    extra: [
      { v: P(unf(I.escolha)), t: 'precisaram escolher entre continuar estudando e outra necessidade importante, com frequência, nas últimas semanas', rose: true },
      { v: P(fav(I.concl)), t: 'têm bastante ou muita confiança em concluir o período atual', rose: false },
    ],
  };

  // 03
  const mat = {
    rows: layout(['food', 'transport', 'housing', 'digital', 'costs', 'finAtt'].map((k) => lkRow(e, I[k].t!, I[k])).sort((a, b) => b.unf - a.unf)),
    needs: bars(multi(m.needs, m.needm), { skip: ['Nenhum no momento'], hl: 1 }),
  };
  const evSupO = ord(I.evSup, dist(I.evSup));
  const ev = {
    any: `${Math.round(scal(m.evAny))}% viveram ao menos um`,
    rows: bars(multi(m.evs, m.evm), { hl: 1 }),
    alertTitle: `${P(evSupO.p[3] + evSupO.p[4])} de quem viveu um desses eventos recebeu pouco ou nenhum apoio.`,
    alertText: 'Perda de renda é o evento mais comum e caminha junto com a preocupação financeira e com a dificuldade financeira como maior ameaça à continuidade. É um sinal para a assistência estudantil, não para o atendimento clínico.',
  };

  // 04
  const need = HID[0] + HID[1] + HID[2], hiddenV = HID[1] + HID[2];
  const HSEG: [string, string, string][] = [['Precisou e conseguiu acessar', C.brand, C.onDeep], ['Tentou, mas não conseguiu', C.rose, C.ink], ['Precisou, mas não procurou', C.rose2, C.ink], ['Não precisou', C.pale, C.ink], ['Preferiu não responder', C.bg, C.muted]];
  const hidByUnit = UN.map((u) => ({ u, v: (m.hidden[u.k]?.[1] ?? 0) + (m.hidden[u.k]?.[2] ?? 0) })).sort((a, b) => b.v - a.v);
  const hid = {
    steps: [
      { l: 'Precisaram de apoio nos últimos 6 meses', v: P(need), n: 'acessaram, tentaram ou deixaram de procurar', bg: C.soft, fg: C.deep, lfg: C.text, nfg: C.muted },
      { l: 'Chegaram ao apoio', v: P(HID[0]), n: `${P(need ? (HID[0] / need) * 100 : 0)} de quem precisou`, bg: C.bg, fg: C.ink, lfg: C.text, nfg: C.muted },
      { l: 'Ficaram de fora', v: P(hiddenV), n: `${Math.round((hiddenV / 100) * nRec).toLocaleString('pt-BR')} estudantes entre os que responderam`, bg: C.deep, fg: C.onDeepRose, lfg: C.onDeep, nfg: C.onDeep },
    ],
    aria: HSEG.map((s, i) => `${s[0]} ${P(HID[i])}`).join(', '),
    segs: HSEG.map((s, i) => ({ l: s[0], v: P(HID[i]), w: `${HID[i]}%`, c: s[1], fg: s[2], txt: HID[i] >= 10 ? P(HID[i]) : '' })),
    trust: layout(['know', 'ease', 'comfort', 'integ', 'clear'].map((k) => lkRow(e, I[k].t!, I[k]))),
    contact: bars(multi(m.contact, m.contm), { skip: ['Não desejo contato'] }),
    insight: `${hiddenV >= HID[0] ? 'Para cada estudante que chegou ao apoio, mais de um ficou de fora. ' : 'Para cada estudante que chegou ao apoio, quase outro ficou de fora. '}A maioria nem chegou a procurar: ${P(HID[2])} precisaram e não procuraram. Só ${P(fav(I.ease))} acham fácil descobrir como acessar os serviços, e ${P(fav(I.know))} conhecem bem o que existe.${hidByUnit[0] ? ` ${hidByUnit[0].u.nome} tem a maior demanda oculta (${Math.round(hidByUnit[0].v)}%).` : ''}`,
  };

  // 05
  const E = m.exp[expTab] ?? m.exp.pert;
  const SELI = E.items[expSel] ?? E.items[0];
  const COLS = [{ k: 'all', l: 'Instituição', nome: 'Instituição' }].concat(UN.map((u) => ({ k: u.k, l: u.ini, nome: u.nome })));
  const weakest = [...E.items].sort((a, b) => fav(a) - fav(b))[0];
  const first = UN[0], last = UN[UN.length - 1];
  const gapU = first && last && first !== last ? E.items.map((it) => ({ it, d: fav(it, last.k) - fav(it, first.k) })).sort((a, b) => Math.abs(b.d) - Math.abs(a.d))[0] : null;
  const exp = {
    tabs: Object.keys(m.exp).map((k) => ({ k, label: m.exp[k].label, on: k === expTab })),
    heads: COLS.map((c) => ({ l: c.l, on: c.k === R })),
    rows: E.items.map((it, i) => ({ label: it.t!, on: it === SELI, cells: COLS.map((c) => { const x = fav(it, c.k), [bg, fg] = heat(x); return { v: P(x), bg, fg, tip: `${c.nome}: ${P(x)} favorável`, ol: c.k === R ? `2px solid ${C.ink}` : 'none' }; }) })),
    d: {
      period: `Período de referência: ${E.period.toLowerCase()}`, q: SELI.q!,
      rows: layout(COLS.map((c) => lkRow(e, c.nome, SELI, c.k, { fw: c.k === R ? 700 : 500 }))),
    },
    insight: `O ponto mais frágil em “${E.label.toLowerCase()}” é: ${weakest.t!.toLowerCase()} (${P(fav(weakest))} favorável${CUR ? ` em ${CUR.nome}` : ''}).${gapU ? ` A maior distância entre unidades está em “${gapU.it.t!.toLowerCase()}”: ${Math.abs(Math.round(gapU.d))} pontos entre ${last.nome} e ${first.nome}.` : ''}`,
  };

  // 06
  const respO = ord(I.respect, dist(I.respect));
  const whomO = ord(I.whom, dist(I.whom));
  const cli = {
    tiles: [
      { v: P(100 - respO.p[0]), l: 'viveram desrespeito ou tratamento desigual ao menos uma vez', q: 'Semestre atual', rose: true },
      { v: P(scal(m.disc)), l: 'perceberam discriminação ligada a uma característica pessoal', q: 'Outros 9% não têm certeza', rose: true },
      { v: P(fav(I.safety)), l: 'sentem-se seguros para circular e participar no campus', q: 'Frequentemente ou sempre', rose: false },
      { v: P(fav(I.whom)), l: 'sabem bem a quem recorrer diante de discriminação, assédio ou violência', q: 'Sei bem ou sei exatamente', rose: false },
    ],
    gapTitle: `${P(whomO.p[3] + whomO.p[4])} não sabem ou sabem pouco a quem recorrer.`,
    gapText: 'Antes de qualquer campanha, o canal de proteção precisa ser conhecido. Vale revisar como ele é apresentado no ingresso e na plataforma.',
  };

  // 07
  const coD = arr(m.cou, 4);
  const tim = multi(m.tim, {}, true); const timMax = Math.max(...Object.values(tim));
  const fmt = multi(m.fmt, m.fmtm);
  const voz = {
    first: bars(multi(m.first, m.firstm, true), { hl: 1 }),
    welcome: bars(multi(m.wel, m.welm), { hl: 2 }),
    timing: Object.keys(tim).map((k) => ({ l: k, v: P(tim[k]), top: tim[k] >= timMax - 0.5 })),
    format: Object.keys(fmt).sort((a, b) => fmt[b] - fmt[a]).map((k, i) => ({ l: k, v: P(fmt[k]), top: i < 2 })),
    co: P(coD[0] + coD[1]),
    coText: `aceitariam ser convidados para conversas ou atividades de cocriação. São cerca de ${Math.round(((coD[0] + coD[1]) / 100) * nRec).toLocaleString('pt-BR')} estudantes dispostos a construir as ações junto com a instituição.`,
    coSegs: ['Sim', 'Talvez, dependendo do formato', 'Não', 'Prefiro não responder'].map((l, i) => ({ l, v: P(coD[i]), w: `${coD[i]}%`, c: [C.deep, C.lav, C.pale, C.bg][i] })),
  };

  // 08
  const fic = {
    cov: UN.map((u) => { const [bg, fg] = unitStyle(u.k); const p = (u.n / u.est) * 100; return { ini: u.ini, bg, fg, w: `${p}%`, pct: P(p), n: `${u.n} de ${u.est.toLocaleString('pt-BR')}` }; }),
    notes: [
      { t: 'Instrumento', d: `Radar Integrado de Permanência, ${m.instrument}.` },
      { t: 'O que fica fora desta aba', d: 'As escalas de saúde (WHO-5, PHQ-9 e outras) estão na Visão geral. Temas de conteúdo, acessibilidade e atendimentos estão nas abas próprias. Textos livres nunca entram no painel.' },
      { t: 'Proteção', d: 'Só dados agregados. Recortes com menos de 10 respostas aparecem como “dados insuficientes”, inclusive em combinações de filtros.' },
      { t: 'Como ler', d: 'Autorrelato do estudante, leitura exploratória. Não é diagnóstico nem previsão individual de evasão, e correlação não indica causa.' },
    ],
  };
  return { recs, hero, who, perm, mat, ev, hid, exp, cli, voz, fic };
}
