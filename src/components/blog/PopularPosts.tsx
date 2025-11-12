import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Flame } from "lucide-react";
import { BlogPost } from "@/hooks/useBlogPosts";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface PopularPostsProps {
  posts: BlogPost[];
}

export const PopularPosts = ({ posts }: PopularPostsProps) => {
  if (posts.length === 0) return null;

  // Ordenar por views (maior primeiro)
  const sortedPosts = [...posts].sort((a, b) => (b.views_count || 0) - (a.views_count || 0)).slice(0, 5);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Flame className="h-5 w-5 text-destructive" />
          Posts Populares
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {sortedPosts.map((post, index) => (
          <Link 
            key={post.id} 
            to={`/blog/${post.slug}`}
            className={cn(
              "flex gap-3 hover:bg-accent/50 p-2 -mx-2 rounded-lg transition-all duration-200 group",
              index === 0 && "bg-primary/5 border border-primary/20"
            )}
          >
            {/* Ranking number */}
            <div className={cn(
              "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors",
              index === 0 ? "bg-destructive text-destructive-foreground" : "bg-muted text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground"
            )}>
              {index + 1}
            </div>
            
            {/* Post info */}
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-sm leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                {post.title}
              </h4>
              <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                {post.published_at && (
                  <span>
                    {format(new Date(post.published_at), "dd MMM", { locale: ptBR })}
                  </span>
                )}
                {post.views_count > 0 && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Flame className="h-3 w-3" />
                      {post.views_count} views
                    </span>
                  </>
                )}
              </div>
            </div>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
};
