import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Calendar, Clock, Users, Trash2, ChevronDown, ChevronUp, UserCheck } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

const statusLabels: Record<string, string> = {
  pending_approval: 'Aguardando Aprovação',
  scheduled: 'Aprovado',
  draft: 'Rascunho',
  cancelled: 'Cancelado',
  completed: 'Realizado',
};

const statusColors: Record<string, string> = {
  pending_approval: 'bg-amber-100 text-amber-800 border-amber-200',
  scheduled: 'bg-green-100 text-green-800 border-green-200',
  draft: 'bg-muted text-muted-foreground',
  cancelled: 'bg-red-100 text-red-800 border-red-200',
  completed: 'bg-blue-100 text-blue-800 border-blue-200',
};

export const MyCreatedSessionsTab = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [openSessions, setOpenSessions] = useState<Record<string, boolean>>({});

  const { data: sessions, isLoading } = useQuery({
    queryKey: ['facilitator-sessions', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('group_sessions')
        .select('*, group_session_registrations(id, user_id, status, registered_at, profiles:user_id(nome, foto_perfil_url))')
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

  const toggleSession = (id: string) => {
    setOpenSessions(prev => ({ ...prev, [id]: !prev[id] }));
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
      {sessions.map((session) => {
        const registrations = (session.group_session_registrations || []).filter(
          (r: any) => r.status === 'confirmed'
        );
        const totalSlots = session.max_participants || 100;
        const filledSlots = registrations.length;
        const occupancyPercent = Math.round((filledSlots / totalSlots) * 100);
        const isOpen = openSessions[session.id] || false;

        return (
          <Card key={session.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{session.title}</CardTitle>
                  {session.description && (
                    <CardDescription className="mt-1">{session.description.slice(0, 120)}...</CardDescription>
                  )}
                </div>
                <Badge className={`border ${statusColors[session.status ?? ''] || 'bg-muted text-muted-foreground'}`} variant="outline">
                  {statusLabels[session.status ?? ''] || session.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-6 text-sm text-muted-foreground flex-wrap">
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {session.session_date ? format(new Date(session.session_date + 'T00:00:00'), "dd 'de' MMMM", { locale: ptBR }) : '-'}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {session.start_time?.slice(0, 5)} • {session.duration_minutes}min
                </span>
              </div>

              {/* Occupancy indicator */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1.5 font-medium">
                    <UserCheck className="h-4 w-4 text-primary" />
                    {filledSlots} / {totalSlots} inscritos
                  </span>
                  <span className="text-muted-foreground">{occupancyPercent}%</span>
                </div>
                <Progress value={occupancyPercent} className="h-2" />
              </div>

              {/* Registrants collapsible */}
              {registrations.length > 0 && (
                <>
                  <Separator />
                  <Collapsible open={isOpen} onOpenChange={() => toggleSession(session.id)}>
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="sm" className="w-full flex items-center justify-between px-2">
                        <span className="flex items-center gap-2 text-sm">
                          <Users className="h-4 w-4" />
                          Ver inscritos ({filledSlots})
                        </span>
                        {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-2">
                      <div className="rounded-md border divide-y">
                        {registrations.map((reg: any) => {
                          const profile = reg.profiles;
                          const name = profile?.nome || 'Participante';
                          const initials = name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();

                          return (
                            <div key={reg.id} className="flex items-center justify-between px-3 py-2.5 text-sm">
                              <div className="flex items-center gap-2.5">
                                <Avatar className="h-7 w-7">
                                  <AvatarFallback className="text-xs bg-primary/10 text-primary">{initials}</AvatarFallback>
                                </Avatar>
                                <span className="font-medium">{name}</span>
                              </div>
                              <span className="text-muted-foreground text-xs">
                                {reg.registered_at
                                  ? format(new Date(reg.registered_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
                                  : '-'}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                </>
              )}

              {session.review_notes && (
                <div className="p-3 bg-muted rounded-md text-sm">
                  <strong>Observação do admin:</strong> {session.review_notes}
                </div>
              )}

              {session.status === 'pending_approval' && (
                <div className="flex gap-2 mt-2">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm">
                        <Trash2 className="h-4 w-4 mr-1" /> Excluir
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Excluir encontro?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Tem certeza que deseja excluir este encontro? Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deleteMutation.mutate(session.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Sim, Excluir
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
