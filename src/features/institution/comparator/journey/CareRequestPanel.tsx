import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { STAGES, ORIGINS, DESTS, OUTCOMES } from './journeyLogic';

const COLS = ['requested_at', 'triaged_at', 'referred_at', 'contacted_at', 'first_consult_at', 'followup_at'] as const;
type Req = Record<(typeof COLS)[number], string | null> & { id: string; origin: string; destination: string | null; outcome: string };

/** Team view to advance one student's support request through the AME stages. */
export function CareRequestPanel({ patientId, institutionId }: { patientId: string; institutionId: string }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const key = ['care-requests', institutionId, patientId];
  const { data = [], isLoading } = useQuery({
    queryKey: key,
    queryFn: async () => {
      const { data, error } = await (supabase as any).from('care_requests').select('*').eq('patient_id', patientId).eq('institution_id', institutionId).order('requested_at', { ascending: false });
      if (error) throw error;
      return data as Req[];
    },
  });
  const save = async (id: string | null, patch: Record<string, unknown>) => {
    const q = id
      ? (supabase as any).from('care_requests').update(patch).eq('id', id)
      : (supabase as any).from('care_requests').insert({ patient_id: patientId, institution_id: institutionId, origin: 'nucleo', ...patch });
    const { error } = await q;
    if (error) toast({ title: 'Não foi possível salvar', description: error.message, variant: 'destructive' });
    qc.invalidateQueries({ queryKey: key });
    qc.invalidateQueries({ queryKey: ['care-journey', institutionId] });
  };

  if (isLoading) return <p className="py-6 text-sm text-muted-foreground">Carregando…</p>;
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Marque cada etapa conforme o pedido avança. Os números entram só de forma agregada na Jornada de cuidado.</p>
        <Button size="sm" variant="outline" onClick={() => save(null, {})}>Registrar pedido</Button>
      </div>
      {!data.length && <p className="py-4 text-sm text-muted-foreground">Nenhum pedido de apoio registrado.</p>}
      {data.map((r) => (
        <div key={r.id} className="space-y-3 rounded-xl border p-4">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="font-semibold">{new Date(r.requested_at!).toLocaleDateString('pt-BR')}</span>
            <span className="text-muted-foreground">· {ORIGINS[r.origin] ?? r.origin}</span>
          </div>
          <div className="grid gap-1.5 sm:grid-cols-2">
            {STAGES.map((s, i) => {
              const v = r[COLS[i]];
              return (
                <label key={s} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={!!v} disabled={i === 0} onChange={(e) => save(r.id, { [COLS[i]]: e.target.checked ? new Date().toISOString() : null })} />
                  <span className={v ? '' : 'text-muted-foreground'}>{s}</span>
                  {v && <span className="text-xs text-muted-foreground">{new Date(v).toLocaleDateString('pt-BR')}</span>}
                </label>
              );
            })}
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <Select value={r.destination ?? 'none'} onValueChange={(v) => save(r.id, { destination: v === 'none' ? null : v })}>
              <SelectTrigger><SelectValue placeholder="Encaminhamento" /></SelectTrigger>
              <SelectContent>{Object.entries(DESTS).map(([k, l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={r.outcome} onValueChange={(v) => save(r.id, { outcome: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{Object.entries(OUTCOMES).map(([k, l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>
      ))}
    </div>
  );
}
