import { Button } from '@/components/ui/button';
import { Calendar, Sun, Moon, Clock } from 'lucide-react';

interface TimeSlot {
  id: string;
  day: string;
  startTime: string;
  endTime: string;
  duration: number;
}

interface ScheduleTemplatesProps {
  onApplyTemplate: (slots: Omit<TimeSlot, 'id'>[]) => void;
}

const TEMPLATES = {
  comercial: {
    name: 'Horário Comercial',
    icon: Calendar,
    description: 'Segunda a Sexta, 9h às 18h',
    color: 'bg-blue-50 border-blue-200 hover:bg-blue-100 text-blue-900',
    slots: [
      { day: 'mon', startTime: '09:00', endTime: '18:00', duration: 50 },
      { day: 'tue', startTime: '09:00', endTime: '18:00', duration: 50 },
      { day: 'wed', startTime: '09:00', endTime: '18:00', duration: 50 },
      { day: 'thu', startTime: '09:00', endTime: '18:00', duration: 50 },
      { day: 'fri', startTime: '09:00', endTime: '18:00', duration: 50 },
    ]
  },
  manha: {
    name: 'Apenas Manhã',
    icon: Sun,
    description: 'Segunda a Sexta, 8h às 12h',
    color: 'bg-amber-50 border-amber-200 hover:bg-amber-100 text-amber-900',
    slots: [
      { day: 'mon', startTime: '08:00', endTime: '12:00', duration: 50 },
      { day: 'tue', startTime: '08:00', endTime: '12:00', duration: 50 },
      { day: 'wed', startTime: '08:00', endTime: '12:00', duration: 50 },
      { day: 'thu', startTime: '08:00', endTime: '12:00', duration: 50 },
      { day: 'fri', startTime: '08:00', endTime: '12:00', duration: 50 },
    ]
  },
  tarde: {
    name: 'Apenas Tarde',
    icon: Sun,
    description: 'Segunda a Sexta, 14h às 18h',
    color: 'bg-orange-50 border-orange-200 hover:bg-orange-100 text-orange-900',
    slots: [
      { day: 'mon', startTime: '14:00', endTime: '18:00', duration: 50 },
      { day: 'tue', startTime: '14:00', endTime: '18:00', duration: 50 },
      { day: 'wed', startTime: '14:00', endTime: '18:00', duration: 50 },
      { day: 'thu', startTime: '14:00', endTime: '18:00', duration: 50 },
      { day: 'fri', startTime: '14:00', endTime: '18:00', duration: 50 },
    ]
  },
  noite: {
    name: 'Horário Noturno',
    icon: Moon,
    description: 'Segunda a Sexta, 18h às 22h',
    color: 'bg-indigo-50 border-indigo-200 hover:bg-indigo-100 text-indigo-900',
    slots: [
      { day: 'mon', startTime: '18:00', endTime: '22:00', duration: 50 },
      { day: 'tue', startTime: '18:00', endTime: '22:00', duration: 50 },
      { day: 'wed', startTime: '18:00', endTime: '22:00', duration: 50 },
      { day: 'thu', startTime: '18:00', endTime: '22:00', duration: 50 },
      { day: 'fri', startTime: '18:00', endTime: '22:00', duration: 50 },
    ]
  },
  flexivel: {
    name: 'Horário Flexível',
    icon: Clock,
    description: 'Seg a Sáb, 10h às 20h',
    color: 'bg-green-50 border-green-200 hover:bg-green-100 text-green-900',
    slots: [
      { day: 'mon', startTime: '10:00', endTime: '20:00', duration: 50 },
      { day: 'tue', startTime: '10:00', endTime: '20:00', duration: 50 },
      { day: 'wed', startTime: '10:00', endTime: '20:00', duration: 50 },
      { day: 'thu', startTime: '10:00', endTime: '20:00', duration: 50 },
      { day: 'fri', startTime: '10:00', endTime: '20:00', duration: 50 },
      { day: 'sat', startTime: '10:00', endTime: '20:00', duration: 50 },
    ]
  },
  fimDeSemana: {
    name: 'Final de Semana',
    icon: Calendar,
    description: 'Sábado e Domingo, 9h às 17h',
    color: 'bg-purple-50 border-purple-200 hover:bg-purple-100 text-purple-900',
    slots: [
      { day: 'sat', startTime: '09:00', endTime: '17:00', duration: 50 },
      { day: 'sun', startTime: '09:00', endTime: '17:00', duration: 50 },
    ]
  }
};

export const ScheduleTemplates = ({ onApplyTemplate }: ScheduleTemplatesProps) => {
  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-muted-foreground">
        💡 Templates rápidos - clique para aplicar:
      </p>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {Object.entries(TEMPLATES).map(([key, template]) => {
          const Icon = template.icon;
          return (
            <Button
              key={key}
              type="button"
              variant="outline"
              onClick={() => onApplyTemplate(template.slots)}
              className={`h-auto py-3 px-4 flex flex-col items-start gap-1 border-2 ${template.color}`}
            >
              <div className="flex items-center gap-2 w-full">
                <Icon className="h-4 w-4" />
                <span className="font-semibold text-sm">{template.name}</span>
              </div>
              <span className="text-xs opacity-80">{template.description}</span>
            </Button>
          );
        })}
      </div>
    </div>
  );
};
