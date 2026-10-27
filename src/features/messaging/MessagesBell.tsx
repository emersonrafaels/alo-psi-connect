import { Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useUnreadCount } from './useMessages';

export function MessagesBell({ href }: { href: string }) {
  const unread = useUnreadCount();
  const navigate = useNavigate();
  return (
    <Button variant="ghost" size="icon" className="relative" onClick={() => navigate(href)}
      aria-label={unread ? `Mensagens, ${unread} não lidas` : 'Mensagens'}>
      <Mail className="h-5 w-5" />
      {unread > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
          {unread > 99 ? '99+' : unread}
        </span>
      )}
    </Button>
  );
}
