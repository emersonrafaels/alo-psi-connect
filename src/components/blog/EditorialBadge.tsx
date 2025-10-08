import { Badge } from '@/components/ui/badge';

interface EditorialBadgeProps {
  badge: string;
  className?: string;
}

export const EditorialBadge = ({ badge, className }: EditorialBadgeProps) => {
  const badgeConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    editors_pick: { label: '⭐ Escolha do Editor', variant: 'default' },
    trending: { label: '🔥 Em Alta', variant: 'destructive' },
    must_read: { label: '📚 Leitura Obrigatória', variant: 'secondary' },
    community_favorite: { label: '❤️ Favorito da Comunidade', variant: 'outline' },
    staff_pick: { label: '✨ Escolha da Equipe', variant: 'default' },
  };

  const config = badgeConfig[badge];
  if (!config) return null;

  return (
    <Badge variant={config.variant} className={className}>
      {config.label}
    </Badge>
  );
};
