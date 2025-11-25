import { GroupSession } from '@/hooks/useGroupSessions';
import { GroupSessionCard } from './GroupSessionCard';

interface GroupSessionGridProps {
  sessions: GroupSession[];
  onRegister: (sessionId: string) => void;
  registeredSessionIds?: Set<string>;
  isRegistering?: boolean;
}

export const GroupSessionGrid = ({ 
  sessions, 
  onRegister,
  registeredSessionIds = new Set(),
  isRegistering 
}: GroupSessionGridProps) => {
  if (sessions.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">
          Nenhum encontro disponível para este período.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {sessions.map((session) => (
        <GroupSessionCard
          key={session.id}
          session={session}
          onRegister={onRegister}
          isRegistered={registeredSessionIds.has(session.id)}
          isRegistering={isRegistering}
        />
      ))}
    </div>
  );
};
