import { useState } from "react";
import { Calendar as CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ptBR } from "date-fns/locale";
import { format, isSameDay, parseISO } from "date-fns";
import { GroupSession } from "@/hooks/useGroupSessions";

interface SessionsCalendarViewProps {
  sessions: GroupSession[];
  onDateSelect?: (date: Date) => void;
}

export const SessionsCalendarView = ({ sessions, onDateSelect }: SessionsCalendarViewProps) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

  // Get all dates with sessions
  const sessionDates = sessions.map(s => parseISO(s.session_date));

  // Get sessions for selected date
  const selectedDateSessions = selectedDate
    ? sessions.filter(s => isSameDay(parseISO(s.session_date), selectedDate))
    : [];

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    if (date && onDateSelect) {
      onDateSelect(date);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Calendar */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5" />
            Calendário de Encontros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleDateSelect}
            locale={ptBR}
            modifiers={{
              session: sessionDates,
            }}
            modifiersClassNames={{
              session: "bg-primary/20 font-bold",
            }}
            className="rounded-md border w-full"
          />
        </CardContent>
      </Card>

      {/* Sessions for selected date */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {selectedDate
              ? format(selectedDate, "dd 'de' MMMM", { locale: ptBR })
              : "Selecione uma data"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {selectedDateSessions.length > 0 ? (
            <div className="space-y-4">
              {selectedDateSessions.map((session) => (
                <div
                  key={session.id}
                  className="p-3 border rounded-lg space-y-2 hover:bg-accent/50 transition-colors cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-semibold text-sm line-clamp-2">
                      {session.title}
                    </h4>
                    <Badge variant="secondary" className="text-xs shrink-0">
                      {session.start_time.slice(0, 5)}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {session.description}
                  </p>
                </div>
              ))}
            </div>
          ) : selectedDate ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Nenhum encontro agendado para esta data.
            </p>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              Selecione uma data no calendário para ver os encontros.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};