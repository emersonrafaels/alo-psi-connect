import { GroupSession } from '@/hooks/useGroupSessions';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, Users, Flame, Building2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { SessionCountdown } from './SessionCountdown';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useTenant } from '@/hooks/useTenant';

interface NextSessionHighlightProps {
  session: GroupSession;
  onRegister: (sessionId: string) => void;
  isRegistered?: boolean;
  isRegistering?: boolean;
}

export const NextSessionHighlight = ({
  session,
  onRegister,
  isRegistered,
  isRegistering,
}: NextSessionHighlightProps) => {
  const { tenant } = useTenant();
  const sessionDate = parseISO(session.session_date);
  const formattedDate = format(sessionDate, "dd 'de' MMMM", { locale: ptBR });
  const formattedTime = session.start_time.slice(0, 5);
  
  const isOrganizedByTenant = session.organizer_type === 'tenant';
  
  const organizerName = isOrganizedByTenant 
    ? tenant?.name || 'Organizador'
    : session.professional?.display_name || 'Profissional';
  
  const organizerPhoto = isOrganizedByTenant
    ? tenant?.logo_url
    : session.professional?.foto_perfil_url;
  
  const organizerCredentials = isOrganizedByTenant
    ? null
    : session.professional?.crp_crm;

  const spotsLeft = (session.max_participants || 0) - (session.current_registrations || 0);
  const isFull = spotsLeft <= 0;

  return (
    <Card className="relative overflow-hidden border-2 border-primary/20 bg-gradient-to-br from-primary/5 via-background to-accent/5 p-6 md:p-8 shadow-lg hover:shadow-xl transition-all duration-300">
      {/* Badge "Próximo Encontro" */}
      <div className="absolute top-4 right-4">
        <div className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-full font-bold text-sm shadow-md">
          <Flame className="w-4 h-4" />
          PRÓXIMO ENCONTRO
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
        {/* Organizer Photo */}
        <Avatar className="w-20 h-20 border-4 border-primary/30 shadow-md">
          <AvatarImage 
            src={organizerPhoto} 
            alt={organizerName}
            className={isOrganizedByTenant ? "object-contain p-2" : ""}
          />
          <AvatarFallback className="bg-primary/10 text-primary font-bold text-xl">
            {isOrganizedByTenant ? (
              <Building2 className="w-8 h-8" />
            ) : (
              organizerName.charAt(0).toUpperCase()
            )}
          </AvatarFallback>
        </Avatar>

        {/* Session Info */}
        <div className="flex-1 space-y-3">
          <div className="space-y-2">
            <h3 className="text-2xl md:text-3xl font-bold text-foreground leading-tight">
              {session.title}
            </h3>
            <p className="text-muted-foreground line-clamp-2">
              {session.description}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-sm">
            <div className="flex items-center gap-1 text-foreground font-medium">
              <span>{isOrganizedByTenant ? 'Organizado por' : 'Com'}</span>
              <span className="font-bold">{organizerName}</span>
              {organizerCredentials && (
                <span className="text-muted-foreground">· {organizerCredentials}</span>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2 text-foreground">
              <Calendar className="w-4 h-4 text-primary" />
              <span className="font-semibold">{formattedDate}</span>
            </div>
            <div className="flex items-center gap-2 text-foreground">
              <Clock className="w-4 h-4 text-primary" />
              <span className="font-semibold">{formattedTime}</span>
            </div>
            <div className="flex items-center gap-2 text-foreground">
              <Users className="w-4 h-4 text-primary" />
              <span className="font-semibold">
                {session.current_registrations}/{session.max_participants} inscritos
              </span>
            </div>
            <SessionCountdown 
              sessionDate={session.session_date}
              startTime={session.start_time}
            />
          </div>
        </div>

        {/* CTA Button */}
        <div className="w-full md:w-auto">
          <Button
            size="lg"
            onClick={() => onRegister(session.id)}
            disabled={isFull || isRegistered || isRegistering}
            className="w-full md:w-auto bg-accent hover:bg-accent/90 text-accent-foreground font-bold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
          >
            {isRegistered ? 'Já Inscrito' : isFull ? 'Esgotado' : 'Garantir Minha Vaga'}
          </Button>
          {spotsLeft <= 3 && spotsLeft > 0 && (
            <p className="text-xs text-destructive font-semibold mt-2 text-center md:text-left">
              🔥 Últimas {spotsLeft} vagas!
            </p>
          )}
        </div>
      </div>
    </Card>
  );
};
