import { User, Building, Building2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface OrganizerBadgeProps {
  organizerType: 'professional' | 'institution' | 'tenant';
  professional?: {
    display_name: string;
    crp_crm: string;
    foto_perfil_url?: string;
  };
  institution?: {
    name: string;
  };
  tenantName?: string;
}

export const OrganizerBadge = ({ 
  organizerType, 
  professional, 
  institution,
  tenantName 
}: OrganizerBadgeProps) => {
  if (organizerType === 'professional' && professional) {
    return (
      <div className="flex items-center gap-2 mt-3">
        <Avatar className="h-8 w-8">
          <AvatarImage src={professional.foto_perfil_url} />
          <AvatarFallback>
            <User className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col text-sm">
          <span className="font-medium">{professional.display_name}</span>
          <span className="text-xs text-muted-foreground">{professional.crp_crm}</span>
        </div>
      </div>
    );
  }

  if (organizerType === 'institution' && institution) {
    return (
      <Badge variant="outline" className="mt-3">
        <Building className="h-3 w-3 mr-1" />
        {institution.name}
      </Badge>
    );
  }

  if (organizerType === 'tenant' && tenantName) {
    return (
      <Badge variant="secondary" className="mt-3">
        <Building2 className="h-3 w-3 mr-1" />
        {tenantName}
      </Badge>
    );
  }

  return null;
};
