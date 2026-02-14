import { Card, CardContent } from '@/components/ui/card';
import { Calendar, CheckCircle, Users, TrendingUp, Award, XCircle } from 'lucide-react';
import { useMemo } from 'react';

interface CreatedSessionsStatsProps {
  sessions: any[];
}

export const CreatedSessionsStats = ({ sessions }: CreatedSessionsStatsProps) => {
  const stats = useMemo(() => {
    const totalSessions = sessions.length;
    const approvedSessions = sessions.filter(s => s.status === 'scheduled').length;
    const completedSessions = sessions.filter(s => s.status === 'completed').length;

    const totalRegistrations = sessions.reduce(
      (acc, s) => acc + (s.group_session_registrations?.filter((r: any) => r.status === 'confirmed').length || 0),
      0
    );

    const totalCancellations = sessions.reduce(
      (acc, s) => acc + (s.group_session_registrations?.filter((r: any) => r.status === 'cancelled').length || 0),
      0
    );

    const activeSessions = sessions.filter(s => ['scheduled', 'completed'].includes(s.status ?? ''));
    const avgOccupancy = activeSessions.length > 0
      ? Math.round(
          activeSessions.reduce((acc, s) => {
            const confirmed = s.group_session_registrations?.filter((r: any) => r.status === 'confirmed').length || 0;
            const max = s.max_participants || 1;
            return acc + (confirmed / max);
          }, 0) / activeSessions.length * 100
        )
      : 0;

    return { totalSessions, approvedSessions, completedSessions, totalRegistrations, totalCancellations, avgOccupancy };
  }, [sessions]);

  const kpis = [
    { icon: Calendar, value: stats.totalSessions, label: 'Total de Encontros', color: 'text-primary bg-primary/10' },
    { icon: CheckCircle, value: stats.approvedSessions, label: 'Aprovados', color: 'text-green-600 bg-green-50' },
    { icon: Users, value: stats.totalRegistrations, label: 'Total de Inscritos', color: 'text-blue-600 bg-blue-50' },
    { icon: TrendingUp, value: `${stats.avgOccupancy}%`, label: 'Ocupação Média', color: 'text-amber-600 bg-amber-50' },
    { icon: Award, value: stats.completedSessions, label: 'Realizados', color: 'text-violet-600 bg-violet-50' },
    { icon: XCircle, value: stats.totalCancellations, label: 'Cancelamentos', color: 'text-red-600 bg-red-50' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 animate-fade-in">
      {kpis.map((kpi) => {
        const Icon = kpi.icon;
        return (
          <Card key={kpi.label}>
            <CardContent className="flex items-center gap-3 p-4">
              <div className={`rounded-lg p-2.5 ${kpi.color}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold leading-none">{kpi.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{kpi.label}</p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
