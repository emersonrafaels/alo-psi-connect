import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, Users, Trash2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const statusLabels: Record<string, string> = {
  pending_approval: 'Aguardando Aprovação',
  scheduled: 'Aprovado',
  draft: 'Rascunho',
  cancelled: 'Cancelado',
  completed: 'Realizado',
};

const statusVariants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  pending_approval: 'secondary',
  scheduled: 'default',
  draft: 'outline',
  cancelled: 'destructive',
  completed: 'outline',
};

export const MyCreatedSessionsTab = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: sessions, isLoading } = useQuery({
    queryKey: ['facilitator-sessions', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('group_sessions')
        .select('*')
        .eq('created_by', user!.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('group_sessions').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['facilitator-sessions'] });
      toast({ title: 'Encontro excluído com sucesso.' });
    },
    onError: (error) => {
      toast({ title: 'Erro ao excluir', description: error.message, variant: 'destructive' });
    },
  });

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este encontro?')) {
      deleteMutation.mutate(id);
    }
  };

  if (isLoading) {
    return <div className="text-center py-12 text-muted-foreground">Carregando...</div>;
  }

  if (!sessions || sessions.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Nenhum encontro criado</h3>
          <p className="text-muted-foreground text-center">
            Seus encontros criados aparecerão aqui após serem enviados para aprovação.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {sessions.map((session) => (
        <Card key={session.id} className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-lg">{session.title}</CardTitle>
                <CardDescription className="mt-1">{session.description?.slice(0, 120)}...</CardDescription>
              </div>
              <Badge variant={statusVariants[session.status ?? ''] || 'outline'}>
                {statusLabels[session.status ?? ''] || session.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {session.session_date ? format(new Date(session.session_date + 'T00:00:00'), "dd 'de' MMMM", { locale: ptBR }) : '-'}
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
            {session.review_notes && (
              <div className="mt-3 p-3 bg-muted rounded-md text-sm">
                <strong>Observação do admin:</strong> {session.review_notes}
              </div>
            )}
            {session.status === 'pending_approval' && (
              <div className="flex gap-2 mt-4">
                <Button variant="destructive" size="sm" onClick={() => handleDelete(session.id)}>
                  <Trash2 className="h-4 w-4 mr-1" /> Excluir
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
