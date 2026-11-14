import { Link } from 'react-router-dom';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { breakdownRows, INDICATOR_DETAILS, type ClinicalInstitution } from './clinicalHomeLogic';

export function IndicatorDetailDialog({ id, value, institutions, onClose }: { id: string | null; value?: string; institutions: ClinicalInstitution[]; onClose: () => void }) {
  const d = id ? INDICATOR_DETAILS[id] : null;
  const rows = d ? breakdownRows(institutions, d) : [];
  const max = Math.max(1, ...rows.map((r) => r.value ?? 0));
  return (
    <Dialog open={!!d} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
        {d && <>
          <DialogHeader>
            <DialogTitle className="flex items-baseline justify-between gap-3 pr-6"><span>{d.title}</span>{value && <span className="text-2xl tabular-nums">{value}</span>}</DialogTitle>
            <DialogDescription>{d.help}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 text-sm">
            <section><h3 className="mb-1 font-semibold">Como é calculado</h3><p className="text-muted-foreground">{d.calc}</p></section>
            <section><h3 className="mb-1 font-semibold">Como interpretar</h3><p className="text-muted-foreground">{d.interpret}</p></section>
            {rows.length > 0 && <section>
              <h3 className="mb-2 font-semibold">Por instituição</h3>
              <div className="space-y-1.5">
                {rows.map((r) => (
                  <Link key={r.id} to={`/portal-institucional${d.to?.startsWith('/portal-institucional/') ? d.to.slice(21) : ''}?inst=${r.id}`} className="block rounded-xl px-2 py-1.5 hover:bg-muted/60">
                    <div className="flex justify-between gap-2"><span className="truncate">{r.name}</span><span className="font-semibold tabular-nums">{r.label}</span></div>
                    <div className="mt-1 h-1 rounded-full bg-muted"><div className="h-1 rounded-full bg-primary/70" style={{ width: `${((r.value ?? 0) / max) * 100}%` }} /></div>
                  </Link>
                ))}
              </div>
            </section>}
            <p className="flex items-start gap-2 rounded-xl bg-primary/5 p-3 text-xs"><ShieldCheck className="h-4 w-4 shrink-0 text-primary" />Números agregados; nenhum aluno é identificado. Classificação de apoio à triagem, nunca diagnóstico.</p>
            {d.to && <Button asChild className="w-full rounded-xl"><Link to={d.to}>Abrir no portal <ArrowRight className="ml-1 h-4 w-4" /></Link></Button>}
          </div>
        </>}
      </DialogContent>
    </Dialog>
  );
}
