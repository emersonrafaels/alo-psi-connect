import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { User } from 'lucide-react';

interface AuthorCardProps {
  author: {
    nome: string;
    foto_perfil_url: string | null;
    email: string;
  };
}

export const AuthorCard = ({ author }: AuthorCardProps) => {
  const initials = author.nome
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <Card className="p-6 my-8 bg-muted/50">
      <div className="flex items-start gap-4">
        <Avatar className="h-16 w-16 border-2 border-primary/20">
          <AvatarImage src={author.foto_perfil_url || ''} alt={author.nome} />
          <AvatarFallback className="bg-primary/10 text-primary">
            {author.foto_perfil_url ? <User className="h-8 w-8" /> : initials}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <h3 className="text-lg font-semibold mb-1">Sobre o autor</h3>
          <p className="text-base font-medium text-foreground mb-2">{author.nome}</p>
          <p className="text-sm text-muted-foreground">
            Colaborador do blog, compartilhando conhecimento e experiências na área de saúde mental.
          </p>
        </div>
      </div>
    </Card>
  );
};
