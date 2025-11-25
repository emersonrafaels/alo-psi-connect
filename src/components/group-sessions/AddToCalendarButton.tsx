import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Calendar, Download } from "lucide-react";
import { format } from "date-fns";
import { useSessionAnalytics } from "@/hooks/useSessionAnalytics";

interface AddToCalendarButtonProps {
  sessionId: string;
  title: string;
  description: string;
  date: string;
  startTime: string;
  durationMinutes: number;
  meetingLink?: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg";
}

export const AddToCalendarButton = ({
  sessionId,
  title,
  description,
  date,
  startTime,
  durationMinutes,
  meetingLink,
  variant = "outline",
  size = "default",
}: AddToCalendarButtonProps) => {
  const { trackEvent } = useSessionAnalytics();

  const generateCalendarLink = (type: 'google' | 'outlook' | 'apple') => {
    const startDateTime = new Date(`${date}T${startTime}`);
    const endDateTime = new Date(startDateTime.getTime() + durationMinutes * 60000);
    
    const formatDateForCal = (d: Date) => {
      return format(d, "yyyyMMdd'T'HHmmss");
    };

    const details = `${description}${meetingLink ? `\n\nLink: ${meetingLink}` : ''}`;

    if (type === 'google') {
      const params = new URLSearchParams({
        action: 'TEMPLATE',
        text: title,
        dates: `${formatDateForCal(startDateTime)}/${formatDateForCal(endDateTime)}`,
        details: details,
        location: meetingLink || '',
      });
      return `https://calendar.google.com/calendar/render?${params.toString()}`;
    }

    if (type === 'outlook') {
      const params = new URLSearchParams({
        path: '/calendar/action/compose',
        rru: 'addevent',
        subject: title,
        startdt: startDateTime.toISOString(),
        enddt: endDateTime.toISOString(),
        body: details,
        location: meetingLink || '',
      });
      return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
    }

    return ''; // Apple handled separately
  };

  const generateICS = () => {
    const startDateTime = new Date(`${date}T${startTime}`);
    const endDateTime = new Date(startDateTime.getTime() + durationMinutes * 60000);
    
    const formatDateForICS = (d: Date) => {
      return format(d, "yyyyMMdd'T'HHmmss");
    };

    const ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'BEGIN:VEVENT',
      `DTSTART:${formatDateForICS(startDateTime)}`,
      `DTEND:${formatDateForICS(endDateTime)}`,
      `SUMMARY:${title}`,
      `DESCRIPTION:${description.replace(/\n/g, '\\n')}`,
      meetingLink ? `LOCATION:${meetingLink}` : '',
      'END:VEVENT',
      'END:VCALENDAR',
    ].filter(Boolean).join('\n');

    const blob = new Blob([ics], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/[^a-z0-9]/gi, '_')}.ics`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleAddToCalendar = (type: 'google' | 'outlook' | 'apple') => {
    trackEvent(sessionId, 'calendar_add', { calendar_type: type });
    
    if (type === 'apple') {
      generateICS();
    } else {
      window.open(generateCalendarLink(type), '_blank');
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size}>
          <Calendar className="w-4 h-4 mr-2" />
          Adicionar ao Calendário
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem onClick={() => handleAddToCalendar('google')}>
          <Calendar className="w-4 h-4 mr-2" />
          Google Calendar
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleAddToCalendar('outlook')}>
          <Calendar className="w-4 h-4 mr-2" />
          Outlook
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleAddToCalendar('apple')}>
          <Download className="w-4 h-4 mr-2" />
          Apple Calendar (.ics)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};