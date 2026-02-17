import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { parseISO } from 'date-fns';

interface LiveCountdownProps {
  sessionDate: string;
  startTime: string;
}

export const LiveCountdown = ({ sessionDate, startTime }: LiveCountdownProps) => {
  const sessionDateTime = parseISO(`${sessionDate}T${startTime}`);
  const [diff, setDiff] = useState(() => sessionDateTime.getTime() - Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      setDiff(sessionDateTime.getTime() - Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, [sessionDateTime.getTime()]);

  // Only show when < 24h
  if (diff > 24 * 3600000) return null;

  if (diff <= 0) {
    return (
      <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-destructive/10 border border-destructive/30 animate-pulse">
        <Clock className="w-5 h-5 text-destructive" />
        <span className="font-bold text-destructive">🔴 Acontecendo agora!</span>
      </div>
    );
  }

  const hours = Math.floor(diff / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);
  const pad = (n: number) => String(n).padStart(2, '0');

  const isUrgent = hours < 1;
  const isWarning = hours < 6;

  const bgClass = isUrgent
    ? 'bg-destructive/10 border-destructive/30'
    : isWarning
      ? 'bg-yellow-500/10 border-yellow-500/30'
      : 'bg-primary/10 border-primary/30';

  const textClass = isUrgent
    ? 'text-destructive'
    : isWarning
      ? 'text-yellow-600 dark:text-yellow-400'
      : 'text-primary';

  return (
    <div className={`flex items-center gap-2 px-4 py-3 rounded-lg border ${bgClass} ${isUrgent ? 'animate-pulse' : ''}`}>
      <Clock className={`w-5 h-5 ${textClass}`} />
      <span className={`font-bold ${textClass}`}>
        Começa em {pad(hours)}:{pad(minutes)}:{pad(seconds)}
      </span>
    </div>
  );
};
