import { useState } from 'react';
import { useUserRegistrations } from '@/hooks/useUserRegistrations';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Clock, Users, MapPin, ExternalLink, XCircle, CheckCircle, AlertCircle, MessageCircle, Plus } from 'lucide-react';
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
import { format, parseISO, isPast, isFuture, differenceInMinutes } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Header from '@/components/ui/header';
import Footer from '@/components/ui/footer';
import { useNavigate, Link } from 'react-router-dom';
import { useTenant } from '@/hooks/useTenant';
import { buildTenantPath } from '@/utils/tenantHelpers';
import { SessionCountdown } from '@/components/group-sessions/SessionCountdown';
import { SessionTypeIcon } from '@/components/group-sessions/SessionTypeIcon';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { useCanCreateSessions } from '@/hooks/useCanCreateSessions';
import { CreateSessionTab } from '@/components/group-sessions/CreateSessionTab';

const MyGroupSessions = () => {
  const { registrations, isLoading } = useUserRegistrations();
  const { canCreateSessions } = useCanCreateSessions();
  const navigate = useNavigate();
  const { tenant } = useTenant();
  const tenantSlug = tenant?.slug || 'alopsi';
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const handleCancelRegistration = async (registrationId: string) => {
    setCancellingId(registrationId);
    try {
      const { error } = await supabase
        .from('group_session_registrations')
        .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
        .eq('id', registrationId);

      if (error) throw error;
      
      // Invalidar caches para atualizar a UI
      queryClient.invalidateQueries({ queryKey: ['user-registrations'] });
      queryClient.invalidateQueries({ queryKey: ['group-sessions'] });
      queryClient.invalidateQueries({ queryKey: ['group-session-registration'] });
      
      toast.success('Inscrição cancelada com sucesso');
    } catch (error) {
      console.error('Error cancelling registration:', error);
      toast.error('Erro ao cancelar inscrição');
    } finally {
      setCancellingId(null);
    }
  };

  const upcomingSessions = registrations.filter(r => {
    if (!r.group_sessions || r.status !== 'confirmed') return false;
    const sessionDateTime = parseISO(`${r.group_sessions.session_date}T${r.group_sessions.start_time}`);
    return isFuture(sessionDateTime);
  });

  const pastSessions = registrations.filter(r => {
    if (!r.group_sessions) return false;
    const sessionDateTime = parseISO(`${r.group_sessions.session_date}T${r.group_sessions.start_time}`);
    return isPast(sessionDateTime);
  });

  const canAccessMeeting = (sessionDate: string, startTime: string) => {
    const sessionDateTime = parseISO(`${sessionDate}T${startTime}`);
    const now = new Date();
    const minutesUntilStart = differenceInMinutes(sessionDateTime, now);
    return minutesUntilStart <= 15 && minutesUntilStart >= -60; // 15min antes até 1h depois
  };

  if (isLoading) {
    return (
      <>
        <Header />
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-5xl mx-auto">
            <div className="mb-8">
              <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
                <Users className="h-10 w-10 text-primary" />
                {canCreateSessions ? 'Encontros' : 'Meus Encontros'}
              </h1>
              <p className="text-muted-foreground">
                {canCreateSessions 
                  ? 'Acompanhe suas inscrições e crie novos encontros'
                  : 'Acompanhe suas inscrições em encontros e grupos terapêuticos'}
              </p>
            </div>

            {canCreateSessions ? (
              <Tabs defaultValue="my-sessions" className="space-y-6">
                <TabsList className="grid w-full max-w-md grid-cols-2">
                  <TabsTrigger value="my-sessions" className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Meus Encontros
                  </TabsTrigger>
                  <TabsTrigger value="create-session" className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Criar Encontro
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="my-sessions" className="space-y-6">
                  <MySessionsContent
                    registrations={registrations}
                    upcomingSessions={upcomingSessions}
                    pastSessions={pastSessions}
                    canAccessMeeting={canAccessMeeting}
                    handleCancelRegistration={handleCancelRegistration}
                    cancellingId={cancellingId}
                    navigate={navigate}
                    tenantSlug={tenantSlug}
                  />
                </TabsContent>

                <TabsContent value="create-session">
                  <CreateSessionTab />
                </TabsContent>
              </Tabs>
            ) : (
              <MySessionsContent
                registrations={registrations}
                upcomingSessions={upcomingSessions}
                pastSessions={pastSessions}
                canAccessMeeting={canAccessMeeting}
                handleCancelRegistration={handleCancelRegistration}
                cancellingId={cancellingId}
                navigate={navigate}
                tenantSlug={tenantSlug}
              />
            )}
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

interface MySessionsContentProps {
  registrations: any[];
  upcomingSessions: any[];
  pastSessions: any[];
  canAccessMeeting: (sessionDate: string, startTime: string) => boolean;
  handleCancelRegistration: (id: string) => void;
  cancellingId: string | null;
  navigate: (path: string) => void;
  tenantSlug: string;
}

const MySessionsContent = ({
  registrations,
  upcomingSessions,
  pastSessions,
  canAccessMeeting,
  handleCancelRegistration,
  cancellingId,
  navigate,
  tenantSlug,
}: MySessionsContentProps) => {
  if (registrations.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Users className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-xl font-semibold mb-2">Nenhuma inscrição ainda</h3>
          <p className="text-muted-foreground mb-6">
            Você ainda não se inscreveu em nenhum encontro em grupo
          </p>
          <Button 
            onClick={() => navigate(buildTenantPath(tenantSlug, '/encontros'))}
            variant="default"
          >
            Explorar Encontros
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Tabs defaultValue="upcoming" className="space-y-6">
      <TabsList className="grid w-full max-w-md grid-cols-2">
        <TabsTrigger value="upcoming" className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          Próximos ({upcomingSessions.length})
        </TabsTrigger>
        <TabsTrigger value="past" className="flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Passados ({pastSessions.length})
        </TabsTrigger>
      </TabsList>

      <TabsContent value="upcoming" className="space-y-4">
        {upcomingSessions.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <Calendar className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">Nenhum encontro agendado</p>
            </CardContent>
          </Card>
        ) : (
          upcomingSessions.map((registration) => {
            const session = registration.group_sessions;
            if (!session) return null;
            const canAccess = canAccessMeeting(session.session_date, session.start_time);

            return (
              <Card key={registration.id} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <SessionTypeIcon type={session.session_type as 'palestra' | 'workshop' | 'roda_conversa'} />
                        <SessionCountdown sessionDate={session.session_date} startTime={session.start_time} />
                        {registration.status === 'confirmed' && (
                          <Badge variant="outline" className="text-green-600">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Confirmado
                          </Badge>
                        )}
                      </div>
                      <Link to={buildTenantPath(tenantSlug, `/encontros/${session.id}`)} className="hover:underline hover:text-primary cursor-pointer transition-colors">
                        <CardTitle className="text-2xl">{session.title}</CardTitle>
                      </Link>
                      {session.description && (
                        <CardDescription className="mt-2">{session.description}</CardDescription>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>{format(parseISO(session.session_date), "dd 'de' MMMM", { locale: ptBR })}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>{session.start_time} • {session.duration_minutes || 60} min</span>
                    </div>
                    {session.profissionais && (
                      <div className="flex items-center gap-2 text-sm">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span>{session.profissionais.display_name}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>Online</span>
                    </div>
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    {session.meeting_link ? (
                      <Button
                        size="sm"
                        disabled={!canAccess}
                        onClick={() => window.open(session.meeting_link, '_blank')}
                        className="flex-1"
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        {canAccess ? 'Acessar Encontro' : 'Disponível 15min antes'}
                      </Button>
                    ) : (
                      <Button size="sm" disabled className="flex-1">
                        <AlertCircle className="h-4 w-4 mr-2" />
                        Link em breve
                      </Button>
                    )}
                    {session.whatsapp_group_link && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-green-600 border-green-600 hover:bg-green-50"
                        onClick={() => window.open(session.whatsapp_group_link, '_blank')}
                      >
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Grupo WhatsApp
                      </Button>
                    )}
                    {registration.status === 'confirmed' && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="destructive" disabled={cancellingId === registration.id}>
                            <XCircle className="h-4 w-4 mr-2" />
                            Cancelar
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Cancelar inscrição?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Você tem certeza que deseja cancelar sua inscrição neste encontro? Sua vaga será liberada para outros participantes.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Manter Inscrição</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleCancelRegistration(registration.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Sim, Cancelar
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </TabsContent>

      <TabsContent value="past" className="space-y-4">
        {pastSessions.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <Clock className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">Nenhum encontro anterior</p>
            </CardContent>
          </Card>
        ) : (
          pastSessions.map((registration) => {
            const session = registration.group_sessions;
            if (!session) return null;

            return (
              <Card key={registration.id} className="opacity-75">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <SessionTypeIcon type={session.session_type as 'palestra' | 'workshop' | 'roda_conversa'} />
                        {registration.attended_at ? (
                          <Badge variant="outline" className="text-green-600">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Participou
                          </Badge>
                        ) : registration.status === 'cancelled' ? (
                          <Badge variant="outline" className="text-red-600">
                            <XCircle className="h-3 w-3 mr-1" />
                            Cancelado
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-amber-600">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Não compareceu
                          </Badge>
                        )}
                      </div>
                      <Link to={buildTenantPath(tenantSlug, `/encontros/${session.id}`)} className="hover:underline hover:text-primary cursor-pointer transition-colors">
                        <CardTitle className="text-xl">{session.title}</CardTitle>
                      </Link>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>{format(parseISO(session.session_date), "dd 'de' MMMM", { locale: ptBR })}</span>
                    </div>
                    {session.profissionais && (
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        <span>{session.profissionais.display_name}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </TabsContent>
    </Tabs>
  );
};

export default MyGroupSessions;
