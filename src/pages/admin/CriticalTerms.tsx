import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Plus } from 'lucide-react';
import { toast } from 'sonner';

type Term = { id: string; term: string; severity: 'grave' | 'moderate'; is_active: boolean };

export default function CriticalTerms() {
  const qc = useQueryClient();
  const [term, setTerm] = useState('');
  const [severity, setSeverity] = useState<'grave' | 'moderate'>('moderate');
  const db = supabase.from('triage_critical_terms' as any) as any;

  const { data = [], isLoading } = useQuery({
    queryKey: ['triage-critical-terms'],
    queryFn: async (): Promise<Term[]> => {
      const { data, error } = await (supabase.from('triage_critical_terms' as any) as any).select('id, term, severity, is_active').order('severity').order('term');
      if (error) throw error;
      return data || [];
    },
  });
  const refresh = () => qc.invalidateQueries({ queryKey: ['triage-critical-terms'] });
  const onErr = (e: any) => toast.error(e?.message?.includes('duplicate') ? 'Esse termo já existe.' : 'Não foi possível salvar.');

  const add = useMutation({
    mutationFn: async () => {
      const t = term.trim();
      if (!t) return;
      const { error } = await db.insert({ term: t, severity });
      if (error) throw error;
    },
    onSuccess: () => { setTerm(''); refresh(); toast.success('Termo adicionado'); },
    onError: onErr,
  });
  const update = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<Term> }) => {
      const { error } = await (supabase.from('triage_critical_terms' as any) as any).update(patch).eq('id', id);
      if (error) throw error;
    },
    onSuccess: refresh, onError: onErr,
  });
  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase.from('triage_critical_terms' as any) as any).delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: refresh, onError: onErr,
  });

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">Palavras críticas</h1>
        <p className="text-muted-foreground">Termos que, quando aparecem no Diário Emocional, aumentam a criticidade do aluno na Triagem. A instituição nunca vê o texto nem a palavra encontrada.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Adicionar termo</CardTitle>
          <CardDescription>Grave: o aluno vai direto para Crítico. Moderada: sobe um nível.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row">
          <Input value={term} onChange={(e) => setTerm(e.target.value)} placeholder="Ex.: quero morrer" onKeyDown={(e) => e.key === 'Enter' && add.mutate()} />
          <Select value={severity} onValueChange={(v) => setSeverity(v as any)}>
            <SelectTrigger className="sm:w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="grave">Grave</SelectItem>
              <SelectItem value="moderate">Moderada</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => add.mutate()} disabled={!term.trim() || add.isPending}><Plus className="mr-1 h-4 w-4" />Adicionar</Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Termos ({data.length})</CardTitle></CardHeader>
        <CardContent className="divide-y">
          {isLoading && <p className="py-4 text-muted-foreground">Carregando…</p>}
          {data.map((t) => (
            <div key={t.id} className="flex flex-wrap items-center gap-3 py-3">
              <span className="flex-1 font-medium">{t.term}</span>
              <Badge variant={t.severity === 'grave' ? 'destructive' : 'secondary'}>{t.severity === 'grave' ? 'Grave' : 'Moderada'}</Badge>
              <Select value={t.severity} onValueChange={(v) => update.mutate({ id: t.id, patch: { severity: v as any } })}>
                <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="grave">Grave</SelectItem>
                  <SelectItem value="moderate">Moderada</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Switch checked={t.is_active} onCheckedChange={(v) => update.mutate({ id: t.id, patch: { is_active: v } })} aria-label="Ativo" />
                {t.is_active ? 'Ativo' : 'Inativo'}
              </div>
              <Button variant="ghost" size="icon" aria-label="Remover" onClick={() => remove.mutate(t.id)}><Trash2 className="h-4 w-4" /></Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
