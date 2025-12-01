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
    return plainText.length > 180
      ? plainText.substring(0, 180) + "..."
      : plainText;
  };

  return (
    <Link 
      to={`/blog/${post.slug}`} 
      className="block mb-14 group"
    >
      <div className="relative overflow-hidden rounded-2xl shadow-md hover:shadow-lg transition-all duration-500">

        {/* Image */}
        <div className="relative h-[420px] w-full">
          <img
            src={post.featured_image_url || "/placeholder.jpg"}
            alt={post.title}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />

          {/* Gradiente mais leve */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/20 to-transparent" />
        </div>

        {/* Content */}
        <div className="absolute bottom-0 left-0 right-0 p-8">

          {/* Tags simplificadas */}
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {post.tags.slice(0, 2).map((tag) => (
                <Badge
                  key={tag.id}
                  variant="secondary"
                  className="bg-white/70 backdrop-blur-sm text-sm"
                >
                  {tag.name}
                </Badge>
              ))}
            </div>
          )}

          {/* Title */}
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 leading-tight drop-shadow">
            {post.title}
          </h2>

          {/* Preview */}
          <p className="text-base md:text-lg text-white/90 max-w-3xl mb-4 drop-shadow">
            {getPlainTextPreview()}
          </p>

          {/* Meta */}
          <div className="flex flex-wrap items-center gap-5 text-white/90 text-sm drop-shadow">

            {/* Author */}
            {post.author && (
              <div className="flex items-center gap-2">
                {post.author.foto_perfil_url ? (
                  <img
                    src={post.author.foto_perfil_url}
                    alt={post.author.nome}
                    className="w-8 h-8 rounded-full border border-white/50"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-white/30 flex items-center justify-center font-semibold">
                    {post.author.nome.charAt(0).toUpperCase()}
                  </div>
                )}
                <span>{post.author.nome}</span>
              </div>
            )}

            {/* Date */}
            {post.published_at && (
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {format(new Date(post.published_at), "d 'de' MMM yyyy", {
                  locale: ptBR,
                })}
              </div>
            )}

            {/* Read time */}
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {Math.ceil(post.content.length / 1000)} min
            </div>

            {/* Views */}
            {post.views_count > 0 && (
              <div className="flex items-center gap-1">
                <Eye className="h-4 w-4" />
                {post.views_count}
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
};
