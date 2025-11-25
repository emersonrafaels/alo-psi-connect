import { GroupSession } from '@/hooks/useGroupSessions';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Calendar, Clock, Users, Video } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { getSessionTypeLabel } from './SessionTypeIcon';
import { SessionTypeIcon } from './SessionTypeIcon';
import { SessionCountdown } from './SessionCountdown';

interface GroupSessionCardProps {
  session: GroupSession;
  onRegister: (sessionId: string) => void;
  isRegistered?: boolean;
  isRegistering?: boolean;
}

export const GroupSessionCard = ({ 
  session, 
  onRegister,
  isRegistered = false,
  isRegistering = false 
}: GroupSessionCardProps) => {
  const spotsLeft = (session.max_participants || 0) - (session.current_registrations || 0);
  const isFull = spotsLeft <= 0;
  
  const sessionDate = parseISO(session.session_date);
  const formattedDate = format(sessionDate, "dd 'de' MMMM", { locale: ptBR });
  const formattedTime = session.start_time.slice(0, 5);

  const professionalName = session.professional?.display_name || 'Profissional';
  const professionalCRP = session.professional?.crp_crm || '';
  const professionalPhoto = session.professional?.foto_perfil_url;
  const professionalInitials = professionalName.split(' ').map(n => n[0]).join('').slice(0, 2);

  return (
    <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-primary/20 hover:scale-[1.02] group">
      <CardContent className="p-0">
        <div className="flex flex-col md:flex-row gap-6 p-6">
          {/* Terapeuta - Esquerda */}
          <div className="flex flex-col items-center md:items-start space-y-3 md:w-48 flex-shrink-0">
            <Avatar className="w-24 h-24 border-4 border-primary/30 shadow-md transition-all duration-300 group-hover:scale-110 group-hover:border-primary/50">
              <AvatarImage src={professionalPhoto} alt={professionalName} />
              <AvatarFallback className="bg-primary/10 text-primary font-bold text-2xl">
                {professionalInitials}
              </AvatarFallback>
            </Avatar>

            <div className="text-center md:text-left">
              <p className="font-semibold text-foreground">{professionalName}</p>
              {professionalCRP && (
                <p className="text-sm text-muted-foreground">{professionalCRP}</p>
              )}
            </div>
          </div>

          {/* Informações do Encontro - Direita */}
          <div className="flex-1 space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="secondary" className="gap-1 transition-all duration-300 hover:scale-105">
                  <SessionTypeIcon type={session.session_type} className="w-3 h-3" />
                  {getSessionTypeLabel(session.session_type)}
                </Badge>
                {session.has_libras && (
                  <Badge variant="outline" className="gap-1 transition-all duration-300 hover:scale-105">
                    ♿ LIBRAS
                  </Badge>
                )}
                <SessionCountdown 
                  sessionDate={session.session_date}
                  startTime={session.start_time}
                />
              </div>
              
              <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">
                {session.title}
              </h3>
              
              <p className="text-muted-foreground line-clamp-2">
                {session.description}
              </p>
            </div>

            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1 transition-colors hover:text-primary">
                <Calendar className="w-4 h-4 text-primary" />
                <span>{formattedDate}</span>
              </div>
              <div className="flex items-center gap-1 transition-colors hover:text-primary">
                <Clock className="w-4 h-4 text-primary" />
                <span>{formattedTime}</span>
                {session.duration_minutes && (
                  <span>· {session.duration_minutes}min</span>
                )}
              </div>
              <div className="flex items-center gap-1 transition-colors hover:text-primary">
                <Users className="w-4 h-4 text-primary" />
                <span>{session.current_registrations}/{session.max_participants}</span>
              </div>
              {session.meeting_link && (
                <div className="flex items-center gap-1 transition-colors hover:text-primary">
                  <Video className="w-4 h-4 text-primary" />
                  <span>Online</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              <Button
                onClick={() => onRegister(session.id)}
                disabled={isFull || isRegistered || isRegistering}
                className="bg-accent hover:bg-accent/90 text-accent-foreground transition-all duration-300 hover:scale-105 hover:shadow-lg"
              >
                {isRegistered ? 'Já Inscrito' : isFull ? 'Esgotado' : 'Inscrever-me'}
              </Button>
              
              {spotsLeft <= 3 && spotsLeft > 0 && (
                <p className="text-sm text-destructive font-semibold animate-pulse">
                  🔥 Últimas {spotsLeft} vagas!
                </p>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
