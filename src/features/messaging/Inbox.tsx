import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ArrowLeft, Inbox as InboxIcon, Info, Send } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { LoadingBar } from '@/components/ui/loading-bar';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useMarkRead, useSendReply, useThread, useThreads, type ThreadSummary } from './useMessages';

const when = (d: string) => format(new Date(d), "dd/MM 'às' HH:mm", { locale: ptBR });

function ThreadView({ summary, onBack }: { summary: ThreadSummary; onBack: () => void }) {
  const { user } = useAuth();
  const { data, isLoading } = useThread(summary.thread_id);
  const reply = useSendReply(summary.thread_id);
  const [text, setText] = useState('');
  const [anonymous, setAnonymous] = useState(true);
  const askAnon = !summary.is_sender && !!summary.institution_name;
  const msg = data?.thread?.messages;

  const submit = async () => {
    const body = text.trim();
    if (!body) return;
    try { await reply.mutateAsync({ body, anonymous: askAnon ? anonymous : false }); setText(''); }
    catch { toast.error('Não foi possível enviar a resposta.'); }
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b p-4">
        <Button variant="ghost" size="icon" className="md:hidden" onClick={onBack} aria-label="Voltar"><ArrowLeft className="h-4 w-4" /></Button>
        <div className="min-w-0">
          <h2 className="truncate font-semibold">{summary.subject}</h2>
          <p className="text-xs text-muted-foreground">
            {summary.is_sender ? `Para ${summary.counterpart_name}` : `De ${summary.counterpart_name}`}
            {summary.is_sender && summary.recipient_count > 1 && ` · comunicado enviado a ${summary.recipient_count} pessoas`}
          </p>
        </div>
      </div>
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {isLoading || !msg ? <LoadingBar label="Carregando conversa..." /> : (
          <>
            <Bubble mine={msg.sender_id === user?.id} body={msg.body} at={msg.created_at} />
            {data!.replies.map((r: any) => <Bubble key={r.id} mine={r.author_id === user?.id} body={r.body} at={r.created_at} />)}
          </>
        )}
      </div>
      {askAnon && (
        <div className="space-y-2 border-t px-3 pt-3">
          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={anonymous} onCheckedChange={(v) => setAnonymous(v === true)} />
            Responder anonimamente
          </label>
          <div className="flex gap-2 rounded-md bg-muted p-2 text-xs text-muted-foreground">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <p>Mesmo que você mostre seu nome, a instituição não saberá quais dados do diário, escalas ou práticas são seus. Esses dados continuam aparecendo apenas de forma anônima. Ao se identificar uma vez, seu nome fica visível nesta conversa.</p>
          </div>
        </div>
      )}
      <div className="flex gap-2 border-t p-3">
        <Textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Escreva sua resposta..." rows={2} maxLength={5000}
          onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submit(); }} />
        <Button onClick={submit} disabled={!text.trim() || reply.isPending} aria-label="Enviar resposta"><Send className="h-4 w-4" /></Button>
      </div>
    </div>
  );
}

function Bubble({ mine, body, at }: { mine: boolean; body: string; at: string }) {
  return (
    <div className={cn('flex', mine ? 'justify-end' : 'justify-start')}>
      <div className={cn('max-w-[80%] rounded-2xl px-4 py-2 text-sm', mine ? 'bg-primary text-primary-foreground' : 'bg-muted')}>
        <p className="whitespace-pre-wrap">{body}</p>
        <p className="mt-1 text-[10px] opacity-70">{when(at)}</p>
      </div>
    </div>
  );
}

export function Inbox({ filter }: { filter?: (t: ThreadSummary) => boolean }) {
  const { data, isLoading } = useThreads();
  const markRead = useMarkRead();
  const [openId, setOpenId] = useState<string | null>(null);
  const threads = (data ?? []).filter(filter ?? (() => true));
  const open = threads.find((t) => t.thread_id === openId) ?? null;

  useEffect(() => { if (open?.unread) markRead(open); }, [open?.thread_id, open?.unread]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Card className="grid h-[640px] overflow-hidden md:grid-cols-[320px_1fr]">
      <div className={cn('overflow-y-auto border-r', open && 'hidden md:block')}>
        {isLoading ? <div className="p-4"><LoadingBar label="Carregando mensagens..." /></div> : threads.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center text-muted-foreground">
            <InboxIcon className="h-8 w-8" /><p className="text-sm">Nenhuma mensagem por aqui ainda.</p>
          </div>
        ) : threads.map((t) => (
          <button key={t.thread_id} onClick={() => setOpenId(t.thread_id)}
            className={cn('block w-full border-b p-4 text-left transition-colors hover:bg-muted/60', openId === t.thread_id && 'bg-muted')}>
            <div className="flex items-center gap-2">
              {t.unread && <span className="h-2 w-2 shrink-0 rounded-full bg-primary" aria-label="Não lida" />}
              <span className={cn('flex-1 truncate text-sm', t.unread && 'font-semibold')}>{t.counterpart_name}</span>
              <span className="text-[11px] text-muted-foreground">{when(t.last_activity_at)}</span>
            </div>
            <p className={cn('truncate text-sm', t.unread ? 'font-medium' : 'text-muted-foreground')}>{t.subject}</p>
            <div className="flex items-center gap-2">
              {t.is_sender && <Badge variant="outline" className="text-[10px]">Enviada</Badge>}
              <p className="truncate text-xs text-muted-foreground">{t.preview}</p>
            </div>
          </button>
        ))}
      </div>
      <div className={cn('min-h-0', !open && 'hidden md:block')}>
        {open ? <ThreadView summary={open} onBack={() => setOpenId(null)} /> : (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Escolha uma conversa para ler e responder.</div>
        )}
      </div>
    </Card>
  );
}
