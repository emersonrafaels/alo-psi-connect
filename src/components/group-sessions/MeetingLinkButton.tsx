import { useState, useEffect } from 'react';
import { Video, Lock } from 'lucide-react';
import { parseISO, differenceInMinutes } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface MeetingLinkButtonProps {
  meetingLink: string;
  sessionDate: string;
  startTime: string;
  isRegistered: boolean;
}

export const MeetingLinkButton = ({ meetingLink, sessionDate, startTime, isRegistered }: MeetingLinkButtonProps) => {
  const sessionDateTime = parseISO(`${sessionDate}T${startTime}`);
  const [isUnlocked, setIsUnlocked] = useState(() => differenceInMinutes(sessionDateTime, new Date()) <= 60);

  useEffect(() => {
    const check = () => setIsUnlocked(differenceInMinutes(sessionDateTime, new Date()) <= 60);
    const interval = setInterval(check, 30000);
    return () => clearInterval(interval);
  }, [sessionDateTime.getTime()]);

  if (!isRegistered) {
    return (
      <div className="flex items-center gap-3">
        <Video className="w-5 h-5 text-primary" />
        <p className="font-semibold">Online (Google Meet)</p>
      </div>
    );
  }

  if (isUnlocked) {
    return (
      <Button
        variant="default"
        size="sm"
        className="w-full gap-2 bg-green-600 hover:bg-green-700 text-white"
        onClick={() => window.open(meetingLink, '_blank')}
      >
        <Video className="w-4 h-4" />
        Entrar na Reunião
      </Button>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline" size="sm" className="w-full gap-2" disabled>
            <Lock className="w-4 h-4" />
            Entrar na Reunião
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Disponível 1h antes do evento</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
