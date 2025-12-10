import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { Building2, User } from 'lucide-react';
import { useTenant } from '@/hooks/useTenant';
import { getTenantDisplayName } from '@/utils/tenantHelpers';

interface AuthorCardProps {
  author: {
    nome: string;
    foto_perfil_url: string | null;
    email: string;
  };
}

export const AuthorCard = ({ author }: AuthorCardProps) => {
  const { tenant } = useTenant();
  
  const isSystemAdmin = author.nome === 'Administrador do Sistema';
  
  // Respeita o tenant atual - Medcos mostra "MEDCOS", RBE mostra "Rede Bem Estar"
  const displayName = isSystemAdmin
    ? getTenantDisplayName(tenant, 'Alô Psi')
    : author.nome;
  
  // Usa logo do tenant atual - Medcos mostra logo Medcos, RBE mostra logo RBE
  const displayPhotoUrl = isSystemAdmin
    ? tenant?.logo_url
    : author.foto_perfil_url;
  
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <Card className="p-6 my-8 bg-muted/50">
      <div className="flex items-start gap-4">
        <Avatar className="h-16 w-16 border-2 border-primary/20">
          <AvatarImage 
            src={displayPhotoUrl || ''} 
            alt={displayName}
            className={isSystemAdmin ? "object-contain p-2" : ""}
          />
          <AvatarFallback className="bg-primary/10 text-primary">
            {isSystemAdmin ? (
              <Building2 className="h-8 w-8" />
            ) : displayPhotoUrl ? (
              <User className="h-8 w-8" />
            ) : (
              initials
            )}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <h3 className="text-lg font-semibold mb-1">Sobre o autor</h3>
          <p className="text-base font-medium text-foreground mb-2">{displayName}</p>
          <p className="text-sm text-muted-foreground">
            Colaborador do blog, compartilhando conhecimento e experiências na área de saúde emocional.
          </p>
        </div>
      </div>
    </Card>
  );
};
