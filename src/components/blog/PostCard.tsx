import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Eye, User } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { BlogPost } from '@/hooks/useBlogPosts';

interface PostCardProps {
  post: BlogPost;
}

export const PostCard = ({ post }: PostCardProps) => {
  return (
    <Link to={`/blog/${post.slug}`}>
      <Card className="overflow-hidden transition-all hover:shadow-lg h-full">
        {post.featured_image_url && (
          <div className="aspect-video overflow-hidden">
            <img
              src={post.featured_image_url}
              alt={post.title}
              loading="lazy"
              className="w-full h-full object-cover transition-transform hover:scale-105"
            />
          </div>
        )}
        <CardHeader>
          <div className="flex flex-wrap gap-2 mb-2">
            {post.tags?.slice(0, 3).map((tag) => (
              <Badge key={tag.id} variant="secondary">
                {tag.name}
              </Badge>
            ))}
          </div>
          <h3 className="text-2xl font-bold line-clamp-2 hover:text-primary transition-colors">
            {post.title}
          </h3>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground line-clamp-3 mb-4">
            {post.excerpt || post.content.substring(0, 150) + '...'}
          </p>
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            {post.author && (
              <div className="flex items-center gap-1">
                <User className="h-4 w-4" />
                <span>{post.author.nome}</span>
              </div>
            )}
            {post.published_at && (
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>{format(new Date(post.published_at), "d 'de' MMMM, yyyy", { locale: ptBR })}</span>
              </div>
            )}
            {post.read_time_minutes && (
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>{post.read_time_minutes} min</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <Eye className="h-4 w-4" />
              <span>{post.views_count}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};
