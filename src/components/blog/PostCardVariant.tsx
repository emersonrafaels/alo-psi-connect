import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Eye } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { BlogPost } from "@/hooks/useBlogPosts";
import { extractTextFromHtml } from "@/utils/htmlSanitizer";
import { cn } from "@/lib/utils";

interface PostCardVariantProps {
  post: BlogPost;
  variant?: 'default' | 'large' | 'horizontal' | 'minimal' | 'avatar';
  className?: string;
}

export const PostCardVariant = ({ post, variant = 'default', className }: PostCardVariantProps) => {
  const getPlainTextPreview = (): string => {
    if (post.excerpt) {
      return extractTextFromHtml(post.excerpt);
    }
    
    const plainText = extractTextFromHtml(post.content);
    const length = variant === 'large' ? 200 : variant === 'minimal' ? 100 : 150;
    return plainText.length > length 
      ? plainText.substring(0, length) + '...' 
      : plainText;
  };

  const preview = getPlainTextPreview();

  // Variant: Large (2 columns)
  if (variant === 'large') {
    return (
      <Link to={`/blog/${post.slug}`} className={cn("block group", className)}>
        <Card className="overflow-hidden h-full hover:shadow-elegant transition-all duration-300 hover:-translate-y-1">
          {post.featured_image_url && (
            <div className="relative h-64 overflow-hidden">
              <img 
                src={post.featured_image_url} 
                alt={post.title}
                loading="lazy"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              {post.tags && post.tags.length > 0 && (
                <div className="absolute top-4 left-4">
                  <Badge className="bg-primary/90 backdrop-blur-sm">
                    {post.tags[0].name}
                  </Badge>
                </div>
              )}
            </div>
          )}
          <CardContent className="p-6">
            <h3 className="text-2xl font-bold mb-3 group-hover:text-primary transition-colors line-clamp-2">
              {post.title}
            </h3>
            <p className="text-muted-foreground mb-4 line-clamp-3">{preview}</p>
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              {post.author && (
                <div className="flex items-center gap-2">
                  {post.author.foto_perfil_url ? (
                    <img 
                      src={post.author.foto_perfil_url} 
                      alt={post.author.nome}
                      className="w-6 h-6 rounded-full"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-semibold">
                      {post.author.nome.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span>{post.author.nome}</span>
                </div>
              )}
              {post.published_at && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {format(new Date(post.published_at), "dd/MM/yyyy")}
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      </Link>
    );
  }

  // Variant: Horizontal
  if (variant === 'horizontal') {
    return (
      <Link to={`/blog/${post.slug}`} className={cn("block group", className)}>
        <Card className="overflow-hidden h-full hover:shadow-lg transition-all duration-300">
          <div className="flex flex-col sm:flex-row h-full">
            {post.featured_image_url && (
              <div className="relative w-full sm:w-48 h-48 sm:h-auto overflow-hidden flex-shrink-0">
                <img 
                  src={post.featured_image_url} 
                  alt={post.title}
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
              </div>
            )}
            <CardContent className="p-6 flex flex-col justify-between flex-1">
              <div>
                {post.tags && post.tags.length > 0 && (
                  <Badge variant="secondary" className="mb-2">
                    {post.tags[0].name}
                  </Badge>
                )}
                <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors line-clamp-2">
                  {post.title}
                </h3>
                <p className="text-muted-foreground text-sm mb-3 line-clamp-2">{preview}</p>
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                {post.published_at && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(post.published_at), "dd/MM/yyyy")}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {Math.ceil(post.content.length / 1000)} min
                </span>
                {post.views_count > 0 && (
                  <span className="flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    {post.views_count}
                  </span>
                )}
              </div>
            </CardContent>
          </div>
        </Card>
      </Link>
    );
  }

  // Variant: Minimal (no image)
  if (variant === 'minimal') {
    return (
      <Link to={`/blog/${post.slug}`} className={cn("block group", className)}>
        <Card className="h-full hover:shadow-lg transition-all duration-300 hover:border-primary/50">
          <CardContent className="p-6">
            {post.tags && post.tags.length > 0 && (
              <Badge variant="outline" className="mb-3">
                {post.tags[0].name}
              </Badge>
            )}
            <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors line-clamp-2">
              {post.title}
            </h3>
            <p className="text-muted-foreground text-sm mb-4 line-clamp-3">{preview}</p>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              {post.author && <span>{post.author.nome}</span>}
              {post.published_at && (
                <span>{format(new Date(post.published_at), "dd/MM/yyyy")}</span>
              )}
            </div>
          </CardContent>
        </Card>
      </Link>
    );
  }

  // Variant: Avatar (author spotlight)
  if (variant === 'avatar') {
    return (
      <Link to={`/blog/${post.slug}`} className={cn("block group", className)}>
        <Card className="overflow-hidden h-full hover:shadow-lg transition-all duration-300">
          {post.featured_image_url && (
            <div className="relative h-48 overflow-hidden">
              <img 
                src={post.featured_image_url} 
                alt={post.title}
                loading="lazy"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
            </div>
          )}
          <CardContent className="p-6">
            {post.author && (
              <div className="flex items-center gap-3 mb-4">
                {post.author.foto_perfil_url ? (
                  <img 
                    src={post.author.foto_perfil_url} 
                    alt={post.author.nome}
                    className="w-12 h-12 rounded-full border-2 border-primary"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg border-2 border-primary">
                    {post.author.nome.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="font-semibold text-sm">{post.author.nome}</p>
                  {post.published_at && (
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(post.published_at), "dd/MM/yyyy")}
                    </p>
                  )}
                </div>
              </div>
            )}
            <h3 className="text-lg font-bold mb-2 group-hover:text-primary transition-colors line-clamp-2">
              {post.title}
            </h3>
            <p className="text-muted-foreground text-sm line-clamp-2">{preview}</p>
          </CardContent>
        </Card>
      </Link>
    );
  }

  // Default variant
  return (
    <Link to={`/blog/${post.slug}`} className={cn("block group", className)}>
      <Card className="overflow-hidden h-full hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
        {post.featured_image_url && (
          <div className="relative h-48 overflow-hidden">
            <img 
              src={post.featured_image_url} 
              alt={post.title}
              loading="lazy"
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
            {post.tags && post.tags.length > 0 && (
              <div className="absolute top-3 left-3">
                <Badge className="bg-primary/90 backdrop-blur-sm">
                  {post.tags[0].name}
                </Badge>
              </div>
            )}
          </div>
        )}
        <CardContent className="p-6">
          <h3 className="text-xl font-bold mb-3 group-hover:text-primary transition-colors line-clamp-2">
            {post.title}
          </h3>
          <p className="text-muted-foreground mb-4 line-clamp-3">{preview}</p>
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            {post.author && <span className="font-medium">{post.author.nome}</span>}
            {post.published_at && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {format(new Date(post.published_at), "dd/MM/yyyy")}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};
