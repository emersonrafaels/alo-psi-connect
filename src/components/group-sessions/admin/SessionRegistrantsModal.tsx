import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSessionRegistrants } from '@/hooks/useSessionRegistrants';
import { GroupSession } from '@/hooks/useGroupSessions';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CheckCircle2, XCircle, Users, Calendar } from 'lucide-react';

interface SessionRegistrantsModalProps {
  session: GroupSession | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const SessionRegistrantsModal = ({ session, open, onOpenChange }: SessionRegistrantsModalProps) => {
  if (!session) return null;

  const { registrants, isLoading, markAttendance, isMarkingAttendance, stats } = useSessionRegistrants(session.id);

  const confirmedRegistrants = registrants.filter(r => r.status === 'confirmed');
  const attendedRegistrants = registrants.filter(r => r.status === 'attended');
  const cancelledRegistrants = registrants.filter(r => r.status === 'cancelled');

  const getStatusBadge = (status: string) => {
    const variants = {
      confirmed: { label: 'Confirmado', variant: 'default' as const },
      attended: { label: 'Presente', variant: 'default' as const },
      cancelled: { label: 'Cancelado', variant: 'destructive' as const },
    };
    const config = variants[status as keyof typeof variants] || { label: status, variant: 'secondary' as const };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const RegistrantCard = ({ registrant }: { registrant: any }) => (
    <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
      <div className="flex items-center gap-4">
        <Avatar className="h-10 w-10">
          <AvatarImage src={registrant.user_photo} />
          <AvatarFallback>{registrant.user_name.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>

        <div className="space-y-1">
          <p className="font-medium">{registrant.user_name}</p>
          <p className="text-sm text-muted-foreground">{registrant.user_email}</p>
          <p className="text-xs text-muted-foreground">
            Inscrito em {format(new Date(registrant.registered_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {getStatusBadge(registrant.status)}
        
        {registrant.status !== 'cancelled' && (
          <div className="flex items-center gap-2">
            <Label 
              htmlFor={`attendance-${registrant.id}`}
              className="text-sm font-medium cursor-pointer"
            >
              Presente
            </Label>
            <Switch
              id={`attendance-${registrant.id}`}
              checked={registrant.status === 'attended'}
              disabled={isMarkingAttendance}
              onCheckedChange={(checked) => {
                markAttendance({
                  registrationId: registrant.id,
                  attended: checked,
                });
              }}
              className="data-[state=checked]:bg-green-600"
            />
          </div>
        )}
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Inscritos - {session.title}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            {format(new Date(session.session_date), "dd 'de' MMMM", { locale: ptBR })} às {session.start_time.substring(0, 5)}
          </p>
        </DialogHeader>

        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-4">
          <div className="p-4 border rounded-lg bg-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
          </div>

          <div className="p-4 border rounded-lg bg-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{stats.confirmed}</p>
                <p className="text-xs text-muted-foreground">Confirmados</p>
              </div>
              <Calendar className="h-8 w-8 text-primary" />
            </div>
          </div>

          <div className="p-4 border rounded-lg bg-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{stats.attended}</p>
                <p className="text-xs text-muted-foreground">Presentes</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
          </div>

          <div className="p-4 border rounded-lg bg-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{stats.cancelled}</p>
                <p className="text-xs text-muted-foreground">Cancelados</p>
              </div>
              <XCircle className="h-8 w-8 text-destructive" />
            </div>
          </div>
        </div>

        {/* Tabs with Registrants List */}
        <Tabs defaultValue="confirmed" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="confirmed">
              Confirmados ({stats.confirmed})
            </TabsTrigger>
            <TabsTrigger value="attended">
              Presentes ({stats.attended})
            </TabsTrigger>
            <TabsTrigger value="cancelled">
              Cancelados ({stats.cancelled})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="confirmed">
            <ScrollArea className="h-[400px] pr-4">
              {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">Carregando...</div>
              ) : confirmedRegistrants.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhuma inscrição confirmada
                </div>
              ) : (
                <div className="space-y-3">
                  {confirmedRegistrants.map(registrant => (
                    <RegistrantCard key={registrant.id} registrant={registrant} />
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="attended">
            <ScrollArea className="h-[400px] pr-4">
              {attendedRegistrants.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhuma presença registrada
                </div>
              ) : (
                <div className="space-y-3">
                  {attendedRegistrants.map(registrant => (
                    <RegistrantCard key={registrant.id} registrant={registrant} />
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="cancelled">
            <ScrollArea className="h-[400px] pr-4">
              {cancelledRegistrants.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhuma inscrição cancelada
                </div>
              ) : (
                <div className="space-y-3">
                  {cancelledRegistrants.map(registrant => (
                    <RegistrantCard key={registrant.id} registrant={registrant} />
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
