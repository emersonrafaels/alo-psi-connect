import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/ui/header';
import Footer from '@/components/ui/footer';
import { GroupSessionHero } from '@/components/group-sessions/GroupSessionHero';
import { FormatExplainer } from '@/components/group-sessions/FormatExplainer';
import { GroupSessionFilters } from '@/components/group-sessions/GroupSessionFilters';
import { GroupSessionGrid } from '@/components/group-sessions/GroupSessionGrid';
import { NextSessionHighlight } from '@/components/group-sessions/NextSessionHighlight';
import { EmptySessionsState } from '@/components/group-sessions/EmptySessionsState';
import { SessionsCTASection } from '@/components/group-sessions/SessionsCTASection';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Info } from 'lucide-react';
import { useGroupSessions } from '@/hooks/useGroupSessions';
import { useGroupSessionRegistration } from '@/hooks/useGroupSessionRegistration';
import { useNextAvailableMonth } from '@/hooks/useNextAvailableMonth';
import { useAuth } from '@/hooks/useAuth';
import { useTenant } from '@/hooks/useTenant';
import { buildTenantPath } from '@/utils/tenantHelpers';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function GroupSessions() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { tenant } = useTenant();
  const [selectedType, setSelectedType] = useState('all');
  const [selectedMonth, setSelectedMonth] = useState<Date | null>(null);
  
  const { data: nextAvailable, isLoading: isLoadingNext } = useNextAvailableMonth();

  // Initialize selected month with intelligent detection
  useEffect(() => {
    if (nextAvailable && !selectedMonth) {
      setSelectedMonth(nextAvailable.month);
    }
  }, [nextAvailable, selectedMonth]);

  const { sessions, isLoading } = useGroupSessions({
    sessionType: selectedType === 'all' ? undefined : selectedType,
    month: selectedMonth ? format(selectedMonth, 'yyyy-MM') : format(new Date(), 'yyyy-MM'),
    status: 'scheduled',
  });

  const { register, isRegistering } = useGroupSessionRegistration();
  
  // Get next upcoming session for highlight
  const nextSession = sessions.length > 0 ? sessions[0] : null;

  // IDs das sessões em que o usuário está inscrito
  const registeredSessionIds = new Set(
    sessions
      .filter(s => s.current_registrations > 0) // Placeholder - seria melhor buscar do banco
      .map(s => s.id)
  );

  const handleRegister = (sessionId: string) => {
    if (!user) {
      sessionStorage.setItem('pendingSessionRegistration', sessionId);
      navigate(buildTenantPath(tenant?.slug || 'alopsi', `/auth?redirect=${encodeURIComponent(window.location.pathname)}`));
      return;
    }
    register(sessionId);
  };

  const showMonthJumpBanner = nextAvailable && !nextAvailable.isCurrentMonth && selectedMonth;
  const hasNoFutureSessions = nextAvailable && !nextAvailable.nextSessionDate;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1">
        <GroupSessionHero />
        <FormatExplainer selectedType={selectedType} onTypeSelect={setSelectedType} />

        {/* Month Jump Banner */}
        {showMonthJumpBanner && (
          <div className="container mx-auto px-4 pt-8">
            <Alert className="border-2 border-primary/30 bg-primary/5 animate-fade-in">
              <Info className="h-4 w-4 text-primary" />
              <AlertDescription className="text-foreground">
                <strong>Aviso:</strong> Não há encontros em{' '}
                {format(new Date(), 'MMMM', { locale: ptBR })}, mas temos encontros disponíveis em{' '}
                <strong>{format(selectedMonth, 'MMMM', { locale: ptBR })}</strong>!
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* Next Session Highlight */}
        {nextSession && (
          <div className="container mx-auto px-4 py-8">
            <NextSessionHighlight
              session={nextSession}
              onRegister={handleRegister}
              isRegistered={registeredSessionIds.has(nextSession.id)}
              isRegistering={isRegistering}
            />
          </div>
        )}

        {/* Calendário de Sessões */}
        <div id="sessions-calendar" className="container mx-auto px-4 py-12">
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-bold text-wellz-text-title mb-2">
              Temas do mês
            </h2>
            <p className="text-muted-foreground text-lg">
              Escolha o assunto e entre na conversa
            </p>
          </div>

          {selectedMonth && (
            <GroupSessionFilters
              selectedType={selectedType}
              selectedMonth={selectedMonth}
              onTypeChange={setSelectedType}
              onMonthChange={setSelectedMonth}
            />
          )}

          <div className="mt-8">
            {isLoading || isLoadingNext ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Carregando encontros...</p>
              </div>
            ) : sessions.length === 0 ? (
              <EmptySessionsState hasNoFutureSessions={hasNoFutureSessions} />
            ) : (
              <GroupSessionGrid
                sessions={sessions}
                onRegister={handleRegister}
                registeredSessionIds={registeredSessionIds}
                isRegistering={isRegistering}
              />
            )}
          </div>
        </div>

        {/* CTAs Permanentes */}
        <SessionsCTASection />

        {/* Aviso de Saúde Mental */}
        <div className="container mx-auto px-4 py-8">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Atenção:</strong> Este site não oferece tratamento ou aconselhamento imediato 
              para pessoas em crise ou risco de suicídio. Em caso de crise, ligue para 188 (CVV) ou 
              acesse o site www.cvv.org.br. Em caso de emergência, procure atendimento em um hospital 
              mais próximo.
            </AlertDescription>
          </Alert>
        </div>
      </main>

      <Footer />
    </div>
  );
}
