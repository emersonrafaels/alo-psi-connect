import { Badge } from '@/components/ui/badge';
import { Star, Sparkles } from 'lucide-react';

interface PostBadgesProps {
  isFeatured?: boolean;
  isNew?: boolean;
  editorialBadge?: string | null;
  publishedAt: string;
}

export const PostBadges = ({ isFeatured, isNew, editorialBadge, publishedAt }: PostBadgesProps) => {
  const isNewPost = () => {
    const publishDate = new Date(publishedAt);
    const daysSincePublish = (Date.now() - publishDate.getTime()) / (1000 * 60 * 60 * 24);
    return daysSincePublish <= 7;
  };

  const showNew = isNew ?? isNewPost();

  if (!isFeatured && !showNew && !editorialBadge) return null;

  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {isFeatured && (
        <Badge variant="default" className="gap-1">
          <Star className="h-3 w-3" />
          Destaque
        </Badge>
      )}
      {showNew && (
        <Badge variant="secondary" className="gap-1">
          <Sparkles className="h-3 w-3" />
          Novo
        </Badge>
      )}
      {editorialBadge && (
        <Badge variant="outline" className="border-primary text-primary">
          {editorialBadge}
        </Badge>
      )}
    </div>
  );
};
