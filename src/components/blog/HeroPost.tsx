import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Eye } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { BlogPost } from "@/hooks/useBlogPosts";
import { extractTextFromHtml } from "@/utils/htmlSanitizer";

interface HeroPostProps {
  post: BlogPost;
}

export const HeroPost = ({ post }: HeroPostProps) => {
  const getPlainTextPreview = (): string => {
    if (post.excerpt) {
      return extractTextFromHtml(post.excerpt);
    }
    
    const plainText = extractTextFromHtml(post.content);
    return plainText.length > 300 
      ? plainText.substring(0, 300) + '...' 
      : plainText;
  };

  return (
    <Link to={`/blog/${post.slug}`} className="block group mb-16">
      <div className="relative overflow-hidden rounded-2xl shadow-elegant hover:shadow-2xl transition-all duration-500">
        {/* Featured Image */}
        {post.featured_image_url ? (
          <div className="relative h-[500px] w-full overflow-hidden">
            <img 
              src={post.featured_image_url} 
              alt={post.title}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
          </div>
        ) : (
          <div className="h-[500px] bg-gradient-to-br from-primary via-accent to-teal" />
        )}
        
        {/* Content Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12">
          {/* Badge de Destaque */}
          <Badge className="mb-4 animate-pulse bg-destructive text-destructive-foreground hover:bg-destructive">
            ⭐ POST EM DESTAQUE
          </Badge>
          
          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {post.tags.slice(0, 3).map(tag => (
                <Badge 
                  key={tag.id} 
                  variant="secondary"
                  className="bg-background/80 backdrop-blur-sm hover:bg-background"
                >
                  {tag.name}
                </Badge>
              ))}
            </div>
          )}
          
          {/* Title */}
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-foreground leading-tight group-hover:text-primary transition-colors duration-300">
            {post.title}
          </h2>
          
          {/* Preview */}
          <p className="text-lg md:text-xl text-muted-foreground mb-6 line-clamp-2 max-w-4xl">
            {getPlainTextPreview()}
          </p>
          
          {/* Meta Info */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            {/* Author */}
            {post.author && (
              <div className="flex items-center gap-2">
                {post.author.foto_perfil_url ? (
                  <img 
                    src={post.author.foto_perfil_url} 
                    alt={post.author.nome}
                    className="w-10 h-10 rounded-full border-2 border-background shadow-md"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold border-2 border-background shadow-md">
                    {post.author.nome.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="font-medium text-foreground">{post.author.nome}</span>
              </div>
            )}
            
            {/* Date */}
            {post.published_at && (
              <div className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                {format(new Date(post.published_at), "d 'de' MMMM, yyyy", { locale: ptBR })}
              </div>
            )}
            
            {/* Read Time */}
            <div className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              {Math.ceil(post.content.length / 1000)} min de leitura
            </div>
            
            {/* Views */}
            {post.views_count > 0 && (
              <div className="flex items-center gap-1.5">
                <Eye className="h-4 w-4" />
                {post.views_count} visualizações
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
};
