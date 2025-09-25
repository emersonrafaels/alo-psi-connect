import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { format, parseISO, isToday, isTomorrow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface GoogleCalendarEvent {
  id: string;
  event_id: string;
  title: string;
  start_time: string;
  end_time: string;
  is_busy: boolean;
  created_at: string;
  updated_at: string;
}

interface BusyScheduleDisplayProps {
  onRefresh?: () => void;
}

export const BusyScheduleDisplay = ({ onRefresh }: BusyScheduleDisplayProps) => {
  const { user } = useAuth();
  const [events, setEvents] = useState<GoogleCalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  const fetchEvents = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('google_calendar_events')
        .select('*')
        .eq('user_id', user.id)
        .gte('start_time', new Date().toISOString())
        .order('start_time', { ascending: true })
        .limit(10);

      if (error) {
        console.error('Erro ao buscar eventos:', error);
        return;
      }

      setEvents(data || []);
      setLastSync(new Date());
    } catch (error) {
      console.error('Erro ao carregar eventos ocupados:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [user]);

  // Refresh when parent requests
  useEffect(() => {
    if (onRefresh) {
      fetchEvents();
    }
  }, [onRefresh]);

  const formatEventDate = (dateString: string) => {
    const date = parseISO(dateString);
    
    if (isToday(date)) {
      return 'Hoje';
    } else if (isTomorrow(date)) {
      return 'Amanhã';
    } else {
      return format(date, 'EEE, dd/MM', { locale: ptBR });
    }
  };

  const formatEventTime = (startString: string, endString: string) => {
    const start = parseISO(startString);
    const end = parseISO(endString);
    
    return `${format(start, 'HH:mm')} - ${format(end, 'HH:mm')}`;
  };


  if (loading && events.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Horários Ocupados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-4">
            <RefreshCw className="h-4 w-4 animate-spin mr-2" />
            Carregando eventos...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Horários Ocupados
          </CardTitle>
        </div>
        {lastSync && (
          <p className="text-sm text-muted-foreground">
            Última sincronização: {format(lastSync, 'dd/MM/yyyy HH:mm')}
          </p>
        )}
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Nenhum evento ocupado encontrado</p>
            <p className="text-sm">Clique em "Sincronizar" para buscar seus eventos do Google Calendar</p>
          </div>
        ) : (
          <div className="space-y-3">
            {events.map((event) => (
              <div
                key={event.id}
                className="flex items-start justify-between p-3 rounded-lg border bg-muted/20"
              >
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm truncate">{event.title}</h4>
                  <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatEventDate(event.start_time)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatEventTime(event.start_time, event.end_time)}
                    </span>
                  </div>
                </div>
                <Badge variant="secondary" className="ml-2 text-xs">
                  Ocupado
                </Badge>
              </div>
            ))}
            {events.length === 10 && (
              <p className="text-xs text-muted-foreground text-center pt-2">
                Mostrando os próximos 10 eventos
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};