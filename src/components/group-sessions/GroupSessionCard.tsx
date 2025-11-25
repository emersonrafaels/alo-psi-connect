import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Calendar, Clock, Users, Accessibility } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { GroupSession } from '@/hooks/useGroupSessions';
import { getSessionTypeLabel } from './SessionTypeIcon';

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
  
  const sessionDateTime = new Date(`${session.session_date}T${session.start_time}`);
  const formattedDate = format(sessionDateTime, "dd 'de' MMMM", { locale: ptBR });
  const formattedTime = format(sessionDateTime, "HH'h'mm", { locale: ptBR });

  // Get professional info
  const professionalName = session.professional?.display_name || 'Profissional';
  const professionalCRP = session.professional?.crp_crm || '';
  const professionalPhoto = session.professional?.foto_perfil_url;
  const professionalInitials = professionalName.split(' ').map(n => n[0]).join('').slice(0, 2);

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all border-0 bg-white">
      <CardContent className="p-0">
        <div className="flex flex-col md:flex-row">
          {/* Lado Esquerdo - Card do Terapeuta */}
          <div className="md:w-1/3 bg-gradient-to-br from-wellz-pink-light to-white p-6 flex flex-col items-center justify-center border-r-4 border-wellz-pink-border/30">
            <Avatar className="h-28 w-28 mb-4 border-4 border-wellz-pink-border">
              <AvatarImage src={professionalPhoto || undefined} />
              <AvatarFallback className="bg-wellz-purple text-white text-2xl">
                {professionalInitials}
              </AvatarFallback>
            </Avatar>
            
            <p className="text-sm text-muted-foreground mb-1">Terapeuta:</p>
            <h4 className="font-semibold text-center text-wellz-text-title mb-1">
              {professionalName}
            </h4>
            {professionalCRP && (
              <p className="text-xs text-muted-foreground mb-4">{professionalCRP}</p>
            )}
            
            {/* Linha pontilhada decorativa */}
            <div className="w-full border-t-2 border-dashed border-wellz-pink-border/40 my-4" />
            
            {/* Data e Hora */}
            <div className="space-y-2 w-full">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-wellz-coral" />
                <span className="font-medium">{formattedDate}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-wellz-coral" />
                <span className="font-medium">{formattedTime}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Duração: {session.duration_minutes || 60}min</span>
              </div>
            </div>
          </div>

          {/* Lado Direito - Conteúdo */}
          <div className="md:w-2/3 p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between mb-3">
                <Badge 
                  variant="outline" 
                  className="border-wellz-purple text-wellz-purple font-semibold"
                >
                  {getSessionTypeLabel(session.session_type)}
                </Badge>
                {session.has_libras && (
                  <Badge variant="secondary" className="ml-2">
                    <Accessibility className="h-3 w-3 mr-1" />
                    LIBRAS
                  </Badge>
                )}
              </div>

              <h3 className="text-xl font-bold mb-3 text-wellz-text-title leading-tight">
                {session.title}
              </h3>
              
              <p className="text-muted-foreground text-sm mb-4 line-clamp-3">
                {session.description}
              </p>
            </div>

            <div className="flex items-center justify-between pt-4 border-t">
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{session.current_registrations || 0}/{session.max_participants || 0}</span>
                </div>
                {spotsLeft > 0 && spotsLeft <= 5 && (
                  <span className="text-xs text-wellz-coral font-medium">
                    Últimas {spotsLeft} vagas!
                  </span>
                )}
              </div>

              <Button
                onClick={() => onRegister(session.id)}
                disabled={isFull || isRegistered || isRegistering}
                className="bg-wellz-coral hover:bg-wellz-coral/90 text-white font-semibold px-6"
              >
                {isRegistered ? 'Você está inscrito' : isFull ? 'Lotado' : 'GARANTIR LUGAR'}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
