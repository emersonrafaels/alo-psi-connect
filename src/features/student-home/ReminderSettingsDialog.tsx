import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type ReminderType = 'diary' | 'radar' | 'session';
export interface ReminderPrefs { types: ReminderType[]; frequency: 'daily' | '3x_week' | 'weekly'; weekday: number; hour: 9 | 14 | 19; diary_gap_days: number }
export const DEFAULT_PREFS: ReminderPrefs = { types: ['diary', 'radar', 'session'], frequency: 'daily', weekday: 1, hour: 9, diary_gap_days: 2 };
export const normalizePrefs = (p: unknown): ReminderPrefs => ({ ...DEFAULT_PREFS, ...(p && typeof p === 'object' ? p as Partial<ReminderPrefs> : {}) });

const WEEKDAYS = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
const TYPES: { id: ReminderType; label: string }[] = [
  { id: 'diary', label: 'Diário emocional parado' },
  { id: 'radar', label: 'Radar de Permanência pendente no semestre' },
  { id: 'session', label: 'Encontros do dia' },
];

export function summarizePrefs(p: ReminderPrefs) {
  const f = p.frequency === 'daily' ? 'Diário' : p.frequency === '3x_week' ? 'Seg, qua e sex' : `Semanal · ${WEEKDAYS[p.weekday].slice(0, 3)}`;
  return `${f} · ${p.hour}h`;
}
function preview(p: ReminderPrefs) {
  const when = p.frequency === 'daily' ? 'todos os dias' : p.frequency === '3x_week' ? 'às segundas, quartas e sextas' : `toda ${WEEKDAYS[p.weekday]}${p.weekday === 0 || p.weekday === 6 ? '' : '-feira'}`;
  return `Você receberá um e-mail ${when}, às ${p.hour}h (Brasília), somente se houver algo pendente.`;
}

interface Props { open: boolean; onOpenChange: (o: boolean) => void; userId: string; enabled: boolean; prefs: ReminderPrefs; onSaved: () => void }

export function ReminderSettingsDialog({ open, onOpenChange, userId, enabled, prefs, onSaved }: Props) {
  const [on, setOn] = useState(enabled);
  const [p, setP] = useState<ReminderPrefs>(prefs);
  const [saving, setSaving] = useState(false);
  useEffect(() => { if (open) { setOn(enabled); setP(prefs); } }, [open]); // eslint-disable-line

  const toggleType = (t: ReminderType, c: boolean) => setP((x) => ({ ...x, types: c ? [...new Set([...x.types, t])] : x.types.filter((y) => y !== t) }));
  const save = async () => {
    if (on && p.types.length === 0) { toast.error('Escolha ao menos um tipo de lembrete.'); return; }
    setSaving(true);
    const { error } = await (supabase as any).from('profiles').update({ email_reminders: on, reminder_prefs: p }).eq('user_id', userId);
    setSaving(false);
    if (error) { toast.error('Não foi possível salvar.'); return; }
    toast.success(on ? 'Lembretes salvos.' : 'Lembretes desativados.');
    onSaved(); onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Configurar lembretes</DialogTitle>
          <DialogDescription>Escolha sobre o que lembrar e com que frequência.</DialogDescription>
        </DialogHeader>
        <div className="space-y-5">
          <div className="flex items-center justify-between rounded-lg border p-3">
            <Label htmlFor="rem-on">Ativar lembretes por e-mail</Label>
            <Switch id="rem-on" checked={on} onCheckedChange={setOn} />
          </div>
          <fieldset disabled={!on} className={`space-y-5 ${on ? '' : 'opacity-50'}`}>
            <div className="space-y-2">
              <p className="text-sm font-medium">Sobre o que lembrar</p>
              {TYPES.map((t) => (
                <label key={t.id} className="flex items-center gap-2 text-sm">
                  <Checkbox checked={p.types.includes(t.id)} onCheckedChange={(c) => toggleType(t.id, !!c)} />{t.label}
                </label>
              ))}
            </div>
            {p.types.includes('diary') && (
              <div className="space-y-1.5">
                <Label>Avisar quando o diário estiver parado há</Label>
                <Select value={String(p.diary_gap_days)} onValueChange={(v) => setP({ ...p, diary_gap_days: Number(v) })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{[1, 2, 3, 5, 7].map((n) => <SelectItem key={n} value={String(n)}>{n} {n === 1 ? 'dia' : 'dias'}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Recorrência</Label>
                <Select value={p.frequency} onValueChange={(v) => setP({ ...p, frequency: v as ReminderPrefs['frequency'] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Diário</SelectItem>
                    <SelectItem value="3x_week">3x por semana</SelectItem>
                    <SelectItem value="weekly">Semanal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Horário</Label>
                <Select value={String(p.hour)} onValueChange={(v) => setP({ ...p, hour: Number(v) as ReminderPrefs['hour'] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="9">Manhã (9h)</SelectItem>
                    <SelectItem value="14">Tarde (14h)</SelectItem>
                    <SelectItem value="19">Noite (19h)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {p.frequency === 'weekly' && (
              <div className="space-y-1.5">
                <Label>Dia da semana</Label>
                <Select value={String(p.weekday)} onValueChange={(v) => setP({ ...p, weekday: Number(v) })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{WEEKDAYS.map((w, i) => <SelectItem key={i} value={String(i)} className="capitalize">{w}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            )}
            <p className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">{preview(p)}</p>
          </fieldset>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={save} disabled={saving}>{saving ? 'Salvando…' : 'Salvar'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
