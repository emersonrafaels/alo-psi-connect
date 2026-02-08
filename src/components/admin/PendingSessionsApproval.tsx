import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Calendar, Clock, Users, Check, X } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useState } from 'react';

interface PendingSession {
  id: string;
  title: string;
  description: string;
  session_type: string;
  session_date: string;
  start_time: string;
  duration_minutes: number;
  max_participants: number;
  status: string;
  submitted_at: string;
  submitted_by: string;
  review_notes: string | null;
  tenant_id: string;
}

export const PendingSessionsApproval = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});

  const { data: pendingSessions, isLoading } = useQuery({
    queryKey: ['pending-sessions-approval'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('group_sessions')
        .select('*')
        .eq('status', 'pending_approval')
        .order('submitted_at', { ascending: true });

      if (error) throw error;
      return data as PendingSession[];
    },
  });

  const approveMutation = useMutation({
    mutationFn: async ({ sessionId, notes }: { sessionId: string; notes?: string }) => {
      const { error } = await supabase
        .from('group_sessions')
        .update({
          status: 'scheduled',
          reviewed_by: user!.id,
          reviewed_at: new Date().toISOString(),
          review_notes: notes || null,
        })
        .eq('id', sessionId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-sessions-approval'] });
      toast({ title: 'Encontro aprovado e publicado!' });
    },
    onError: (error) => {
      toast({ title: 'Erro ao aprovar', description: error.message, variant: 'destructive' });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ sessionId, notes }: { sessionId: string; notes?: string }) => {
      const { error } = await supabase
        .from('group_sessions')
        .update({
          status: 'cancelled',
          reviewed_by: user!.id,
          reviewed_at: new Date().toISOString(),
          review_notes: notes || 'Encontro não aprovado.',
        })
        .eq('id', sessionId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-sessions-approval'] });
      toast({ title: 'Encontro rejeitado.' });
    },
    onError: (error) => {
      toast({ title: 'Erro ao rejeitar', description: error.message, variant: 'destructive' });
    },
  });

  const sessionTypeLabels: Record<string, string> = {
    palestra: 'Palestra',
    workshop: 'Workshop',
    roda_conversa: 'Roda de Conversa',
  };

  if (isLoading) return <div className="text-muted-foreground">Carregando...</div>;

  if (!pendingSessions || pendingSessions.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Nenhum encontro pendente de aprovação.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {pendingSessions.map((session) => (
        <Card key={session.id} className="border-l-4 border-l-yellow-500">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-lg">{session.title}</CardTitle>
                <CardDescription>{session.description}</CardDescription>
              </div>
              <Badge variant="secondary">{sessionTypeLabels[session.session_type] || session.session_type}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {format(new Date(session.session_date + 'T00:00:00'), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {session.start_time?.slice(0, 5)} • {session.duration_minutes}min
              </span>
              <span className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                {session.max_participants} vagas
              </span>
            </div>

            <div>
              <Textarea
                placeholder="Observações (opcional)..."
                value={reviewNotes[session.id] || ''}
                onChange={(e) => setReviewNotes(prev => ({ ...prev, [session.id]: e.target.value }))}
                rows={2}
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button
                variant="destructive"
                size="sm"
                onClick={() => rejectMutation.mutate({ sessionId: session.id, notes: reviewNotes[session.id] })}
                disabled={rejectMutation.isPending}
              >
                <X className="h-4 w-4 mr-1" /> Rejeitar
              </Button>
              <Button
                size="sm"
                onClick={() => approveMutation.mutate({ sessionId: session.id, notes: reviewNotes[session.id] })}
                disabled={approveMutation.isPending}
              >
                <Check className="h-4 w-4 mr-1" /> Aprovar e Publicar
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
