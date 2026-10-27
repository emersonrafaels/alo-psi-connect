import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2, Send, X } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useAcademicStructure } from '@/hooks/useAcademicStructure';
import { LEVEL_LABELS, buildPath } from '@/features/academic/hierarchy';
import { anonymizeStudentName, buildAnonymizedStudentIndex } from '@/hooks/useAnonymizationConfig';
import { previewAudience, sendMessage, type AudienceInput } from './useMessages';

const db = supabase as any;

type Props = { open: boolean; onOpenChange: (o: boolean) => void; title?: string; initial?: { subject: string; body: string; sendEmail?: boolean } } & (
  | { mode: 'admin' }
  | { mode: 'institution'; institutionId: string }
);

function MultiPick({ items, selected, onToggle, placeholder }: {
  items: { id: string; label: string; hint?: string }[]; selected: string[]; onToggle: (id: string) => void; placeholder: string;
}) {
  const [q, setQ] = useState('');
  const shown = items.filter((i) => i.label.toLowerCase().includes(q.toLowerCase()) || i.hint?.toLowerCase().includes(q.toLowerCase())).slice(0, 100);
  const byId = new Map(items.map((i) => [i.id, i]));
  return (
    <div className="space-y-2">
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {selected.map((id) => (
            <Badge key={id} variant="secondary" className="gap-1">{byId.get(id)?.label ?? '…'}
              <button onClick={() => onToggle(id)} aria-label="Remover"><X className="h-3 w-3" /></button></Badge>
          ))}
        </div>
      )}
      <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={placeholder} />
      <div className="max-h-48 space-y-1 overflow-y-auto rounded-md border p-2">
        {shown.length === 0 ? <p className="p-2 text-xs text-muted-foreground">Nada encontrado.</p> : shown.map((i) => (
          <label key={i.id} className="flex cursor-pointer items-center gap-2 rounded p-1 text-sm hover:bg-muted">
            <Checkbox checked={selected.includes(i.id)} onCheckedChange={() => onToggle(i.id)} />
            <span className="flex-1 truncate">{i.label}</span>
            {i.hint && <span className="truncate text-xs text-muted-foreground">{i.hint}</span>}
          </label>
        ))}
      </div>
    </div>
  );
}

export function Composer(props: Props) {
  const { open, onOpenChange, mode } = props;
  const institutionId = mode === 'institution' ? props.institutionId : undefined;
  const [kind, setKind] = useState<string>(mode === 'admin' ? 'all' : 'students');
  const [ids, setIds] = useState<string[]>([]);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sendEmail, setSendEmail] = useState(false);
  const [count, setCount] = useState<number | null>(null);
  const [counting, setCounting] = useState(false);
  const [sending, setSending] = useState(false);
  const [userSearch, setUserSearch] = useState('');

  useEffect(() => { setIds([]); }, [kind]);
  useEffect(() => {
    if (open && props.initial) { setSubject(props.initial.subject); setBody(props.initial.body); setSendEmail(props.initial.sendEmail ?? true); }
  }, [open, props.initial]);

  const institutions = useQuery({
    queryKey: ['msg-institutions'], enabled: open && mode === 'admin',
    queryFn: async () => (await db.from('educational_institutions').select('id, name').eq('is_active', true).order('name')).data ?? [],
  });
  const users = useQuery({
    queryKey: ['msg-users', userSearch], enabled: open && mode === 'admin' && kind === 'users' && userSearch.trim().length >= 2,
    queryFn: async () => {
      const s = userSearch.trim().replace(/[%,]/g, '');
      return (await db.from('profiles').select('user_id, nome, email').not('user_id', 'is', null)
        .or(`nome.ilike.%${s}%,email.ilike.%${s}%`).limit(50)).data ?? [];
    },
  });
  const [userLabels, setUserLabels] = useState<Record<string, string>>({});
  const academic = useAcademicStructure(open ? institutionId : undefined);
  const students = useQuery({
    queryKey: ['msg-students', institutionId], enabled: open && !!institutionId && kind === 'student_ids',
    queryFn: async () => {
      const out: string[] = [];
      for (let f = 0; ; f += 1000) {
        const { data, error } = await db.from('patient_institutions').select('patient_id').eq('institution_id', institutionId).range(f, f + 999);
        if (error) throw error;
        out.push(...(data ?? []).map((r: any) => r.patient_id as string));
        if (!data || data.length < 1000) return out;
      }
    },
  });

  const audience: AudienceInput | null = useMemo(() => {
    if (mode === 'admin') {
      if (kind === 'all') return { kind: 'all' };
      if (kind === 'institutions') return { kind: 'institutions', institutionIds: ids.length ? ids : undefined };
      return ids.length ? { kind: 'users', userIds: ids } : null;
    }
    if (kind === 'students') return { kind: 'students', institutionId: institutionId! };
    if (kind === 'units') return ids.length ? { kind: 'units', institutionId: institutionId!, unitIds: ids } : null;
    return ids.length ? { kind: 'student_ids', institutionId: institutionId!, patientIds: ids } : null;
  }, [mode, kind, ids, institutionId]);

  useEffect(() => {
    if (!open || !audience) { setCount(null); return; }
    let alive = true;
    setCounting(true);
    const t = setTimeout(() => {
      previewAudience(audience).then((r) => alive && setCount(r.count)).catch(() => alive && setCount(null)).finally(() => alive && setCounting(false));
    }, 400);
    return () => { alive = false; clearTimeout(t); };
  }, [open, JSON.stringify(audience)]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggle = (id: string) => setIds((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const unitItems = useMemo(() => {
    const units = academic.units;
    const levels = academic.levels;
    return units.map((u: any) => ({
      id: u.id,
      label: buildPath(u.id, units, levels).map((p) => p.name).join(' › ') || u.name,
      hint: LEVEL_LABELS[u.level as keyof typeof LEVEL_LABELS],
    })).sort((a, b) => a.label.localeCompare(b.label));
  }, [academic.units, academic.levels]);

  const studentItems = useMemo(() => {
    const list = students.data ?? [];
    const idx = buildAnonymizedStudentIndex(list);
    return list.map((id) => ({ id, label: anonymizeStudentName(idx.get(id)!) }))
      .sort((a, b) => Number(a.label.slice(7)) - Number(b.label.slice(7)));
  }, [students.data]);

  const submit = async () => {
    if (!audience || !subject.trim() || !body.trim()) return;
    setSending(true);
    try {
      const r = await sendMessage({ audience, subject: subject.trim(), body: body.trim(), sendEmail });
      toast.success(`Mensagem enviada para ${r.count} pessoa(s)${sendEmail ? ` · ${r.emailed} e-mail(s)` : ''}.`);
      setSubject(''); setBody(''); setIds([]); setSendEmail(false);
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e.message || 'Não foi possível enviar.');
    } finally { setSending(false); }
  };

  const options = mode === 'admin'
    ? [['all', 'Todos os usuários'], ['institutions', 'Instituições'], ['users', 'Usuários específicos']]
    : [['students', 'Todos os alunos'], ['units', 'Por unidade, curso, turno ou turma'], ['student_ids', 'Alunos específicos']];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader><DialogTitle>Nova mensagem</DialogTitle></DialogHeader>
        <div className="space-y-5">
          <div className="space-y-2">
            <Label>Para quem</Label>
            <RadioGroup value={kind} onValueChange={setKind} className="grid gap-2 sm:grid-cols-3">
              {options.map(([v, l]) => (
                <label key={v} className="flex cursor-pointer items-center gap-2 rounded-lg border p-3 text-sm has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                  <RadioGroupItem value={v} />{l}
                </label>
              ))}
            </RadioGroup>
          </div>

          {kind === 'institutions' && (
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Sem escolha, vai para os administradores de todas as instituições.</p>
              <MultiPick items={(institutions.data ?? []).map((i: any) => ({ id: i.id, label: i.name }))} selected={ids} onToggle={toggle} placeholder="Buscar instituição..." />
            </div>
          )}
          {kind === 'users' && (
            <div className="space-y-2">
              <Input value={userSearch} onChange={(e) => setUserSearch(e.target.value)} placeholder="Buscar por nome ou e-mail (mín. 2 letras)" />
              <MultiPick
                items={[
                  ...ids.filter((id) => !(users.data ?? []).some((u: any) => u.user_id === id)).map((id) => ({ id, label: userLabels[id] ?? 'Usuário' })),
                  ...(users.data ?? []).map((u: any) => ({ id: u.user_id, label: u.nome || u.email, hint: u.email })),
                ]}
                selected={ids}
                onToggle={(id) => {
                  const u = (users.data ?? []).find((x: any) => x.user_id === id);
                  if (u) setUserLabels((m) => ({ ...m, [id]: u.nome || u.email }));
                  toggle(id);
                }}
                placeholder="Filtrar resultados..." />
            </div>
          )}
          {kind === 'units' && (
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Escolher um nível inclui todas as turmas abaixo dele.</p>
              <MultiPick items={unitItems} selected={ids} onToggle={toggle} placeholder="Buscar unidade, curso, turno ou turma..." />
            </div>
          )}
          {kind === 'student_ids' && (
            students.isLoading ? <p className="text-sm text-muted-foreground">Carregando alunos...</p> :
              <MultiPick items={studentItems} selected={ids} onToggle={toggle} placeholder="Buscar Aluno #..." />
          )}

          <div className="rounded-lg bg-muted px-3 py-2 text-sm">
            {counting ? <span className="flex items-center gap-2"><Loader2 className="h-3 w-3 animate-spin" />Calculando destinatários...</span>
              : count === null ? 'Escolha o público para ver quantas pessoas vão receber.'
              : <>Esta mensagem chegará a <strong>{count.toLocaleString('pt-BR')}</strong> pessoa(s) com conta ativa.</>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="msg-subject">Assunto</Label>
            <Input id="msg-subject" value={subject} onChange={(e) => setSubject(e.target.value)} maxLength={200} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="msg-body">Mensagem</Label>
            <Textarea id="msg-body" value={body} onChange={(e) => setBody(e.target.value)} rows={6} maxLength={5000} />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={sendEmail} onCheckedChange={(v) => setSendEmail(!!v)} />
            Também enviar por e-mail
          </label>
          <p className="text-xs text-muted-foreground">Cada pessoa recebe a mensagem individualmente e pode responder só para você.</p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={submit} disabled={!audience || !subject.trim() || !body.trim() || sending || count === 0}>
            {sending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}Enviar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
