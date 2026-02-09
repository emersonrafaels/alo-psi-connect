import { useParams, useNavigate } from 'react-router-dom';
import { useGroupSessionById } from '@/hooks/useGroupSessionById';
import { useGroupSessionRegistration } from '@/hooks/useGroupSessionRegistration';
import { useUserRegistrations } from '@/hooks/useUserRegistrations';
import { useAuth } from '@/hooks/useAuth';
import { useTenant } from '@/hooks/useTenant';
import { useTheme } from 'next-themes';
import Header from '@/components/ui/header';
import Footer from '@/components/ui/footer';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Calendar, Clock, Users, Video, Building2, MessageCircle, ArrowLeft, Check } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { SessionTypeIcon, getSessionTypeLabel } from '@/components/group-sessions/SessionTypeIcon';
import { SessionCountdown } from '@/components/group-sessions/SessionCountdown';
import { VacancyProgressBar } from '@/components/group-sessions/VacancyProgressBar';
import { ShareSessionButton } from '@/components/group-sessions/ShareSessionButton';
import { AddToCalendarButton } from '@/components/group-sessions/AddToCalendarButton';
import { useState, useEffect } from 'react';
import { buildTenantPath } from '@/utils/tenantHelpers';

const GroupSessionDetail = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { session, isLoading, error } = useGroupSessionById(sessionId);
  const { user } = useAuth();
  const { tenant } = useTenant();
  const { resolvedTheme } = useTheme();
  const { register, isRegistering } = useGroupSessionRegistration(sessionId);
  const { registeredSessionIds } = useUserRegistrations();
  const [showSuccess, setShowSuccess] = useState(false);
  const tenantSlug = tenant?.slug || 'alopsi';

  const isRegistered = session ? registeredSessionIds.has(session.id) : false;

  const handleRegister = () => {
    if (!user) {
      navigate(`/auth?redirect=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    if (session) {
      register(session.id);
    }
  };

  useEffect(() => {
    if (isRegistered && !isRegistering) {
      setShowSuccess(true);
      const timer = setTimeout(() => setShowSuccess(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [isRegistered, isRegistering]);

  if (isLoading) {
    return (
      <>
        <Header />
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
        </div>
        <Footer />
      </>
    );
  }

  if (error || !session) {
    return (
      <>
        <Header />
        <div className="min-h-screen flex items-center justify-center">
          <Card className="max-w-md w-full mx-4">
            <CardContent className="py-12 text-center">
              <h2 className="text-xl font-bold mb-2">Encontro não encontrado</h2>
              <p className="text-muted-foreground mb-6">Este encontro pode ter sido removido ou o link está incorreto.</p>
              <Button onClick={() => navigate(buildTenantPath(tenantSlug, '/encontros'))}>
                Ver Encontros
              </Button>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </>
    );
  }

  const sessionDate = parseISO(session.session_date);
  const formattedDate = format(sessionDate, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  const formattedTime = session.start_time.slice(0, 5);
  const isOrganizedByTenant = session.organizer_type === 'tenant';
  const spotsLeft = (session.max_participants || 0) - (session.current_registrations || 0);
  const isFull = spotsLeft <= 0;

  const organizerName = isOrganizedByTenant
    ? tenant?.name || 'Organizador'
    : session.professional?.display_name || 'Profissional';

  const getFeatureLogo = () => {
    const isDarkMode = resolvedTheme === 'dark';
    return isDarkMode
      ? (tenant?.feature_logo_url_dark || tenant?.logo_url_dark)
      : (tenant?.feature_logo_url || tenant?.logo_url);
  };

  const organizerPhoto = isOrganizedByTenant
    ? getFeatureLogo()
    : session.professional?.foto_perfil_url;

  const organizerCredentials = isOrganizedByTenant
    ? null
    : session.professional?.crp_crm;

  return (
    <>
      <Header />
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          {/* Back button */}
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar para Encontros
          </Button>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Main content */}
            <div className="md:col-span-2 space-y-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="secondary" className="gap-1">
                    <SessionTypeIcon type={session.session_type} className="w-3 h-3" />
                    {getSessionTypeLabel(session.session_type)}
                  </Badge>
                  {session.has_libras && (
                    <Badge variant="outline" className="gap-1">♿ LIBRAS</Badge>
                  )}
                  <SessionCountdown sessionDate={session.session_date} startTime={session.start_time} />
                </div>

                <h1 className="text-3xl md:text-4xl font-bold text-foreground leading-tight">
                  {session.title}
                </h1>

                <p className="text-muted-foreground text-lg leading-relaxed whitespace-pre-line">
                  {session.description}
                </p>
              </div>

              {/* Date/Time details */}
              <Card>
                <CardContent className="p-6 space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-primary" />
                      <div>
                        <p className="font-semibold capitalize">{formattedDate}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Clock className="w-5 h-5 text-primary" />
                      <div>
                        <p className="font-semibold">{formattedTime}</p>
                        <p className="text-sm text-muted-foreground">{session.duration_minutes || 60} minutos</p>
                      </div>
                    </div>
                    {session.meeting_link && (
                      <div className="flex items-center gap-3">
                        <Video className="w-5 h-5 text-primary" />
                        <p className="font-semibold">Online (Google Meet)</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Organizer */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-4 text-muted-foreground text-sm uppercase tracking-wide">
                    {isOrganizedByTenant ? 'Organizado por' : 'Facilitador'}
                  </h3>
                  <div className="flex items-center gap-4">
                    <Avatar className="w-16 h-16 border-2 border-primary/20">
                      <AvatarImage
                        src={organizerPhoto}
                        alt={organizerName}
                        className={isOrganizedByTenant ? 'object-contain p-2' : ''}
                      />
                      <AvatarFallback className="bg-primary/10 text-primary font-bold text-xl">
                        {isOrganizedByTenant ? <Building2 className="w-8 h-8" /> : organizerName.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-bold text-lg">{organizerName}</p>
                      {organizerCredentials && (
                        <p className="text-muted-foreground">{organizerCredentials}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <Card className="sticky top-24">
                <CardContent className="p-6 space-y-6">
                  <VacancyProgressBar
                    current={session.current_registrations || 0}
                    max={session.max_participants || 0}
                  />

                  <Button
                    size="lg"
                    className={`w-full font-bold ${
                      showSuccess
                        ? 'bg-success hover:bg-success text-success-foreground'
                        : isRegistered
                          ? 'bg-muted hover:bg-muted text-muted-foreground'
                          : 'bg-accent hover:bg-accent/90 text-accent-foreground'
                    }`}
                    onClick={handleRegister}
                    disabled={isFull || isRegistered || isRegistering}
                  >
                    {showSuccess && <Check className="w-5 h-5 mr-1" />}
                    {showSuccess ? 'Inscrito!' : isRegistered ? 'Já Inscrito' : isRegistering ? 'Inscrevendo...' : isFull ? 'Esgotado' : 'Garantir Minha Vaga'}
                  </Button>

                  {spotsLeft <= 3 && spotsLeft > 0 && (
                    <p className="text-sm text-destructive font-semibold text-center">
                      🔥 Últimas {spotsLeft} vagas!
                    </p>
                  )}

                  <div className="space-y-3">
                    <AddToCalendarButton
                      sessionId={session.id}
                      title={session.title}
                      description={session.description}
                      date={session.session_date}
                      startTime={session.start_time}
                      durationMinutes={session.duration_minutes || 60}
                      meetingLink={session.meeting_link}
                      size="sm"
                    />

                    <div className="flex gap-2">
                      <ShareSessionButton
                        sessionId={session.id}
                        title={session.title}
                        description={session.description}
                        variant="outline"
                        size="sm"
                      />
                    </div>

                    {isRegistered && session.whatsapp_group_link && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-green-600 border-green-600 hover:bg-green-50"
                        onClick={() => window.open(session.whatsapp_group_link, '_blank')}
                      >
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Grupo WhatsApp
                      </Button>
                    )}
                  </div>

                  {session.is_free && (
                    <p className="text-center text-sm font-semibold text-green-600">✨ Evento Gratuito</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default GroupSessionDetail;
