import { Badge } from '@/components/ui/badge';

interface PostStatusBadgeProps {
  status: 'draft' | 'published' | 'archived';
}

export const PostStatusBadge = ({ status }: PostStatusBadgeProps) => {
  const variants: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    draft: { label: 'Rascunho', variant: 'secondary' },
    published: { label: 'Publicado', variant: 'default' },
    archived: { label: 'Arquivado', variant: 'outline' }
  };

  const config = variants[status] || variants.draft;

  return <Badge variant={config.variant}>{config.label}</Badge>;
};
