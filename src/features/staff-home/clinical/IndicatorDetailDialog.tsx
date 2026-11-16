import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Calculator, Lightbulb, Lock, Search, ShieldCheck } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { breakdownRows, distributionRows, INDICATOR_DETAILS, type ClinicalInstitution } from './clinicalHomeLogic';

const fmt = (n: number, d = 0) => n.toLocaleString('pt-BR', { maximumFractionDigits: d });

export function IndicatorDetailDialog({ id, value, institutions, onClose }: { id: string | null; value?: string; institutions: ClinicalInstitution[]; onClose: () => void }) {
  const d = id ? INDICATOR_DETAILS[id] : null;
  const [q, setQ] = useState('');
  const [showZero, setShowZero] = useState(false);
  const dist = d ? distributionRows(institutions, d) : null;
  const rows = d && !dist ? breakdownRows(institutions, d) : [];
  const link = (instId: string) => `/portal-institucional${d?.to?.startsWith('/portal-institucional/') ? d.to.slice(21) : ''}?inst=${instId}`;
  const match = (name: string) => name.toLowerCase().includes(q.trim().toLowerCase());
  const totalStudents = institutions.reduce((s, i) => s + i.students, 0);
  const many = institutions.length > 6;
  const max = Math.max(1, ...rows.map((r) => r.value ?? 0));

  return (
    <Dialog open={!!d} onOpenChange={(o) => { if (!o) { onClose(); setQ(''); setShowZero(false); } }}>
      <DialogContent className="flex max-h-[85vh] flex-col gap-0 p-0 sm:max-w-xl">
        {d && <>
          <DialogHeader className="space-y-2 border-b p-6 pb-4">
            <DialogTitle className="flex items-baseline justify-between gap-3 pr-6"><span>{d.title}</span>{value && <span className="text-3xl tabular-nums text-primary">{value}</span>}</DialogTitle>
            <DialogDescription>{d.help}</DialogDescription>
            {dist && <p className="text-xs text-muted-foreground"><b className="text-foreground">{fmt(dist.total)}</b> alunos neste indicador, de {fmt(totalStudents)} vinculados na rede</p>}
          </DialogHeader>

          <div className="flex-1 space-y-5 overflow-y-auto p-6 text-sm">
            <div className="grid gap-2 sm:grid-cols-2">
              <section className="rounded-xl bg-muted/50 p-3"><h3 className="mb-1 flex items-center gap-1.5 text-xs font-semibold"><Calculator className="h-3.5 w-3.5 text-primary" />Como é calculado</h3><p className="text-xs text-muted-foreground">{d.calc}</p></section>
              <section className="rounded-xl bg-muted/50 p-3"><h3 className="mb-1 flex items-center gap-1.5 text-xs font-semibold"><Lightbulb className="h-3.5 w-3.5 text-primary" />Como interpretar</h3><p className="text-xs text-muted-foreground">{d.interpret}</p></section>
            </div>

            {(dist || rows.length > 0) && <section>
              <div className="mb-2 flex items-end justify-between gap-3">
                <div>
                  <h3 className="font-semibold">{dist ? 'De onde vêm esses alunos' : 'Por instituição'}</h3>
                  <p className="text-xs text-muted-foreground">{dist ? 'Divisão dos alunos deste indicador entre as instituições (soma 100%).' : d.kind === 'avg' ? 'Médias só aparecem com 10 ou mais alunos registrando em 30 dias.' : 'Tempos só aparecem com 10 ou mais pedidos no período.'}</p>
                </div>
              </div>
              {many && <div className="relative mb-3"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" /><Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar instituição" className="h-9 pl-8" /></div>}

              {dist && <>
                {dist.rows.length === 0 && <p className="rounded-xl border border-dashed p-3 text-center text-xs text-muted-foreground">Nenhum aluno neste indicador ainda.</p>}
                <div className="space-y-1">
                  {dist.rows.filter((r) => match(r.name)).map((r) => (
                    <Link key={r.id} to={link(r.id)} title={r.rate != null ? `${r.rate}% dos alunos da instituição` : undefined} className="block rounded-xl px-2 py-2 hover:bg-muted/60">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="truncate font-medium">{r.name}</span>
                        <span className="shrink-0 tabular-nums"><span className="text-muted-foreground">{fmt(r.count)} alunos · </span><b>{fmt(r.share, r.share < 10 ? 1 : 0)}%</b></span>
                      </div>
                      <div className="mt-1.5 h-1.5 rounded-full bg-muted"><div className="h-1.5 rounded-full bg-primary" style={{ width: `${r.share}%` }} /></div>
                    </Link>
                  ))}
                </div>
                {dist.zero.length > 0 && <div className="mt-3">
                  <button type="button" onClick={() => setShowZero((v) => !v)} className="text-xs font-medium text-primary hover:underline">{showZero ? 'Ocultar' : 'Ver'} {dist.zero.length} instituições sem alunos neste indicador</button>
                  {showZero && <div className="mt-2 flex flex-wrap gap-1.5">{dist.zero.filter((z) => match(z.name)).map((z) => <Link key={z.id} to={link(z.id)} className="rounded-full bg-muted px-2.5 py-1 text-xs hover:bg-muted/70">{z.name}</Link>)}</div>}
                </div>}
                {dist.protectedList.length > 0 && <p className="mt-3 flex items-start gap-1.5 text-xs text-muted-foreground"><Lock className="mt-0.5 h-3 w-3 shrink-0" />{dist.protectedList.length} instituições com menos de 10 alunos ficam fora da divisão para proteger a privacidade.</p>}
              </>}

              {!dist && <div className="space-y-1.5">
                {rows.filter((r) => match(r.name)).map((r) => (
                  <Link key={r.id} to={link(r.id)} className="block rounded-xl px-2 py-1.5 hover:bg-muted/60">
                    <div className="flex justify-between gap-2"><span className="truncate">{r.name}</span><span className={r.value == null ? 'text-xs text-muted-foreground' : 'font-semibold tabular-nums'}>{r.label}</span></div>
                    {r.value != null && <div className="mt-1 h-1 rounded-full bg-muted"><div className="h-1 rounded-full bg-primary/70" style={{ width: `${(r.value / max) * 100}%` }} /></div>}
                  </Link>
                ))}
              </div>}
            </section>}
            <p className="flex items-start gap-2 rounded-xl bg-primary/5 p-3 text-xs"><ShieldCheck className="h-4 w-4 shrink-0 text-primary" />Números agregados; nenhum aluno é identificado. Classificação de apoio à triagem, nunca diagnóstico.</p>
          </div>

          {d.to && <div className="flex gap-2 border-t p-4">
            <Button variant="outline" className="flex-1 rounded-xl" onClick={onClose}>Fechar</Button>
            <Button asChild className="flex-1 rounded-xl"><Link to={d.to}>Abrir no portal <ArrowRight className="ml-1 h-4 w-4" /></Link></Button>
          </div>}
        </>}
      </DialogContent>
    </Dialog>
  );
}
