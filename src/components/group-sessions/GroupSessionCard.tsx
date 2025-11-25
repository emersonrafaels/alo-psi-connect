import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Calendar, Clock, Users, Accessibility } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { GroupSession } from '@/hooks/useGroupSessions';
import { SessionTypeIcon, getSessionTypeLabel } from './SessionTypeIcon';
import { OrganizerBadge } from './OrganizerBadge';
import { useTenant } from '@/hooks/useTenant';

interface GroupSessionCardProps {
  session: GroupSession;
  onRegister: (sessionId: string) => void;
  isRegistered?: boolean;
  isRegistering?: boolean;
}

export const GroupSessionCard = ({ 
  session, 
  onRegister, 
  isRegistered,
  isRegistering 
}: GroupSessionCardProps) => {
  const { tenant } = useTenant();
  const isFull = session.current_registrations >= session.max_participants;
  const progress = (session.current_registrations / session.max_participants) * 100;

  const sessionDate = format(new Date(session.session_date), "dd 'de' MMMM", { locale: ptBR });
  const sessionTime = session.start_time.substring(0, 5);

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow h-full flex flex-col">
      {/* Header com badges */}
      <div className="flex flex-wrap gap-2 p-4 bg-muted/50">
        <Badge variant="default" className="gap-1">
          <SessionTypeIcon type={session.session_type} className="h-3 w-3" />
          {getSessionTypeLabel(session.session_type).toUpperCase()}
        </Badge>
        
        {session.has_libras && (
          <Badge variant="outline" className="gap-1">
            <Accessibility className="h-3 w-3" />
            LIBRAS
          </Badge>
        )}

        {session.audience_type === 'institutions' && (
          <Badge variant="secondary">
            Exclusivo
          </Badge>
        )}
      </div>

      {/* Imagem (se houver) */}
      {session.featured_image_url && (
        <div className="w-full h-40 overflow-hidden">
          <img 
            src={session.featured_image_url} 
            alt={session.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <CardContent className="p-4 flex-1 flex flex-col">
        <h3 className="font-semibold text-lg mb-2 line-clamp-2">
          {session.title}
        </h3>
        
        <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
          {session.description}
        </p>

        {/* Organizador */}
        <OrganizerBadge
          organizerType={session.organizer_type}
          professional={session.professional}
          institution={session.institution}
          tenantName={tenant?.name}
        />

        {/* Data/Hora */}
        <div className="flex flex-wrap items-center gap-3 text-sm mt-4 text-muted-foreground">
          <span className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            {sessionDate}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            {sessionTime}
          </span>
          <span className="flex items-center gap-1">
            ⏱️ {session.duration_minutes}min
          </span>
        </div>

        {/* Vagas */}
        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              Vagas
            </span>
            <span className="font-medium">
              {session.current_registrations}/{session.max_participants}
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0">
        <Button
          onClick={() => onRegister(session.id)}
          disabled={isFull || isRegistered || isRegistering}
          className="w-full"
        >
          {isRegistering ? 'Inscrevendo...' : 
           isRegistered ? '✓ Inscrito' : 
           isFull ? 'Esgotado' : 
           'Garantir Lugar'}
        </Button>
      </CardFooter>
    </Card>
  );
};
