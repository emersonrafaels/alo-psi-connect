import { differenceInDays, differenceInHours, parseISO } from 'date-fns';
import { Calendar, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface SessionCountdownProps {
  sessionDate: string;
  startTime: string;
}

export const SessionCountdown = ({ sessionDate, startTime }: SessionCountdownProps) => {
  const sessionDateTime = parseISO(`${sessionDate}T${startTime}`);
  const now = new Date();
  
  const daysUntil = differenceInDays(sessionDateTime, now);
  const hoursUntil = differenceInHours(sessionDateTime, now);

  if (daysUntil < 0 || hoursUntil < 0) {
    return null; // Session has passed
  }

  let label = '';
  let icon = null;
  let variant: 'default' | 'secondary' | 'destructive' = 'secondary';

  if (daysUntil === 0) {
    if (hoursUntil <= 2) {
      label = 'Começando agora!';
      variant = 'destructive';
      icon = <Clock className="w-3 h-3 animate-pulse" />;
    } else {
      label = 'Hoje!';
      variant = 'destructive';
      icon = <Calendar className="w-3 h-3" />;
    }
  } else if (daysUntil === 1) {
    label = 'Amanhã!';
    variant = 'default';
    icon = <Calendar className="w-3 h-3" />;
  } else if (daysUntil <= 7) {
    label = `Em ${daysUntil} dias`;
    variant = 'default';
    icon = <Calendar className="w-3 h-3" />;
  } else {
    label = `Em ${daysUntil} dias`;
    variant = 'secondary';
    icon = <Calendar className="w-3 h-3" />;
  }

  return (
    <Badge 
      variant={variant} 
      className="gap-1 animate-fade-in font-semibold"
    >
      {icon}
      {label}
    </Badge>
  );
};
