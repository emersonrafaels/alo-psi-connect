import { useState } from 'react';
import { Lock, LifeBuoy } from 'lucide-react';
import { toast } from 'sonner';
import { FunctionsHttpError } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { VoiceInputButton } from '@/features/jornada/v5/components/VoiceInputButton';
import { SUPPORT_TEMPLATES, SUPPORT_MESSAGE_MAX, applyTemplate } from './templates';

interface Props { open: boolean; onOpenChange: (o: boolean) => void; origin?: string }

export function SupportRequestDialog({ open, onOpenChange, origin = 'apoio' }: Props) {
  const [message, setMessage] = useState('');
  const [identified, setIdentified] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    const { data, error } = await supabase.functions.invoke('request-support', { body: { origin, message: message.trim(), identified } });
    setBusy(false);
    if (error) {
      console.error('request-support failed:', error instanceof FunctionsHttpError ? await error.context.text() : error.message);
      toast.error('Não foi possível enviar seu pedido agora.');
      return;
    }
    if (!data?.linked) toast.info('Seu perfil não está vinculado a uma instituição. Veja os apoios disponíveis.');
    else toast.success('Pedido enviado. A equipe de cuidado da sua instituição vai entrar em contato.');
    setMessage(''); setIdentified(false); onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !busy && onOpenChange(o)}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><LifeBuoy className="h-5 w-5 text-primary" />Pedir apoio</DialogTitle>
          <DialogDescription>A equipe de cuidado da sua instituição vai receber seu pedido. Se quiser, conte um pouco do que está acontecendo.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {SUPPORT_TEMPLATES.map((t) => (
              <Button key={t.label} type="button" size="sm" variant="outline" className="h-7 rounded-full text-xs"
                onClick={() => setMessage((m) => applyTemplate(m, t.text))}>{t.label}</Button>
            ))}
          </div>
          <div className="relative">
            <Textarea value={message} maxLength={SUPPORT_MESSAGE_MAX} rows={5} placeholder="Mensagem opcional…"
              onChange={(e) => setMessage(e.target.value)} className="pr-12" />
            <div className="absolute right-2 top-2">
              <VoiceInputButton currentValue={message} onChange={(v) => setMessage(v.slice(0, SUPPORT_MESSAGE_MAX))} />
            </div>
          </div>
          <p className="text-right text-xs text-muted-foreground">{message.length}/{SUPPORT_MESSAGE_MAX}</p>
          <label className="flex items-start gap-2 text-sm cursor-pointer">
            <Checkbox checked={identified} onCheckedChange={(v) => setIdentified(v === true)} className="mt-0.5" />
            Quero que a instituição saiba meu nome
          </label>
          <div className="flex gap-2 rounded-lg border-l-4 border-primary bg-primary/5 p-3 text-xs text-muted-foreground">
            <Lock className="h-4 w-4 shrink-0 text-primary" />
            <span>Mesmo identificado(a), a instituição não acessa seu diário, escalas ou práticas. A equipe da Rede Bem-Estar também recebe uma cópia para garantir o acolhimento.</span>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={busy}>Cancelar</Button>
          <Button onClick={submit} disabled={busy}>{busy ? 'Enviando…' : 'Enviar pedido'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
