import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Building2, User } from 'lucide-react';
import { useTenant } from '@/hooks/useTenant';
import { getTenantDisplayName } from '@/utils/tenantHelpers';

interface AuthorBadgeProps {
  name: string;
  photoUrl?: string | null;
  className?: string;
}

export const AuthorBadge = ({ name, photoUrl, className = '' }: AuthorBadgeProps) => {
  const { tenant } = useTenant();
  
  const isSystemAdmin = name === 'Administrador do Sistema';
  
  // Respeita o tenant atual - Medcos mostra "MEDCOS", RBE mostra "Rede Bem Estar"
  const displayName = isSystemAdmin 
    ? getTenantDisplayName(tenant, 'Alô Psi')
    : name;
  
  // Usa logo do tenant atual - Medcos mostra logo Medcos, RBE mostra logo RBE
  const displayPhotoUrl = isSystemAdmin 
    ? tenant?.logo_url 
    : photoUrl;
  
  const initials = displayName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Avatar className="h-8 w-8">
        <AvatarImage 
          src={displayPhotoUrl || undefined} 
          alt={displayName}
          className={isSystemAdmin ? "object-contain p-1" : ""}
        />
        <AvatarFallback>
          {isSystemAdmin ? (
            <Building2 className="h-4 w-4" />
          ) : displayPhotoUrl ? (
            <User className="h-4 w-4" />
          ) : (
            initials
          )}
        </AvatarFallback>
      </Avatar>
      <span className="font-medium">{displayName}</span>
    </div>
  );
};
