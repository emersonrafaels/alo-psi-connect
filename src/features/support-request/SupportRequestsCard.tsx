import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { LifeBuoy, MessageSquare, Check } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export interface PendingSupportRequest { id: string; message: string | null; identified: boolean; requested_at: string; thread_id: string | null }

export const supportRequestsKey = (inst: string) => ['support-requests-pending', inst];

export function usePendingSupportRequests(institutionId: string) {
  return useQuery({
    queryKey: supportRequestsKey(institutionId),
    enabled: !!institutionId,
    queryFn: async () => {
      const { data, error } = await (supabase as any).from('care_requests')
        .select('id, message, identified, requested_at, thread_id')
        .eq('institution_id', institutionId).eq('origin', 'apoio').eq('is_synthetic', false)
        .is('contacted_at', null).eq('outcome', 'em_andamento')
        .order('requested_at', { ascending: false }).limit(20);
      if (error) throw error;
      return (data ?? []) as PendingSupportRequest[];
    },
  });
}

export function SupportRequestsCard({ institutionId, messagesPath }: { institutionId: string; messagesPath: string }) {
  const { data = [] } = usePendingSupportRequests(institutionId);
  const qc = useQueryClient();
  const markWelcomed = async (id: string) => {
    const { error } = await (supabase as any).from('care_requests').update({ contacted_at: new Date().toISOString() }).eq('id', id);
    if (error) toast.error('Não foi possível atualizar.');
    else { toast.success('Pedido marcado como acolhido.'); qc.invalidateQueries({ queryKey: supportRequestsKey(institutionId) }); }
  };

  return (
    <Card id="support-requests">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <LifeBuoy className="h-4 w-4 text-primary" />Pedidos de apoio
          {data.length > 0 && <Badge>{data.length}</Badge>}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {data.length === 0 && <p className="text-sm text-muted-foreground">Nenhum pedido de apoio aguardando acolhimento.</p>}
        {data.map((r) => (
          <div key={r.id} className="rounded-lg border p-3 space-y-2">
            <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
              <span>{r.identified ? 'Aluno identificado (veja em Mensagens)' : 'Aluno anônimo'}</span>
              <span>{formatDistanceToNow(new Date(r.requested_at), { addSuffix: true, locale: ptBR })}</span>
            </div>
            <p className="text-sm whitespace-pre-line">{r.message || <span className="italic text-muted-foreground">Sem mensagem — prefere conversar diretamente.</span>}</p>
            <div className="flex gap-2">
              {r.thread_id && <Button size="sm" variant="outline" asChild><Link to={messagesPath}><MessageSquare className="h-3.5 w-3.5 mr-1" />Responder</Link></Button>}
              <Button size="sm" variant="ghost" onClick={() => markWelcomed(r.id)}><Check className="h-3.5 w-3.5 mr-1" />Marcar como acolhido</Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
