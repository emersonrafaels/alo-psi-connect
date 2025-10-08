import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User } from 'lucide-react';

interface AuthorBadgeProps {
  name: string;
  photoUrl?: string | null;
  className?: string;
}

export const AuthorBadge = ({ name, photoUrl, className = '' }: AuthorBadgeProps) => {
  const initials = name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Avatar className="h-8 w-8">
        <AvatarImage src={photoUrl || undefined} alt={name} />
        <AvatarFallback>
          {photoUrl ? <User className="h-4 w-4" /> : initials}
        </AvatarFallback>
      </Avatar>
      <span className="font-medium">{name}</span>
    </div>
  );
};
