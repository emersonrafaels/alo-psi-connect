import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/hooks/useTenant";
import { PenTool } from "lucide-react";

interface Author {
  user_id: string;
  nome: string;
  foto_perfil_url: string | null;
  post_count: number;
}

export const AuthorSpotlight = () => {
  const { tenant } = useTenant();

  const { data: topAuthors = [] } = useQuery({
    queryKey: ['top-blog-authors', tenant?.id],
    queryFn: async () => {
      if (!tenant) return [];

      // Buscar autores mais ativos
      const { data: posts } = await supabase
        .from('blog_posts')
        .select('author_id')
        .eq('status', 'published')
        .or(`tenant_id.eq.${tenant.id},tenant_id.is.null`);

      if (!posts) return [];

      // Contar posts por autor
      const authorCounts = posts.reduce((acc, post) => {
        acc[post.author_id] = (acc[post.author_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Pegar top 3 autores
      const topAuthorIds = Object.entries(authorCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([id]) => id);

      if (topAuthorIds.length === 0) return [];

      // Buscar dados dos autores
      const { data: authorsData } = await supabase
        .from('profiles')
        .select('user_id, nome, foto_perfil_url')
        .in('user_id', topAuthorIds);

      if (!authorsData) return [];

      return authorsData.map(author => ({
        ...author,
        post_count: authorCounts[author.user_id]
      })) as Author[];
    },
    enabled: !!tenant
  });

  if (topAuthors.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PenTool className="h-5 w-5 text-primary" />
          Autores em Destaque
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {topAuthors.map((author, index) => (
          <div 
            key={author.user_id}
            className="flex items-center gap-3 p-3 rounded-lg bg-accent/20 hover:bg-accent/40 transition-colors"
          >
            {/* Avatar */}
            {author.foto_perfil_url ? (
              <img 
                src={author.foto_perfil_url} 
                alt={author.nome}
                className="w-12 h-12 rounded-full border-2 border-primary object-cover"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg border-2 border-primary">
                {author.nome.charAt(0).toUpperCase()}
              </div>
            )}
            
            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate">{author.nome}</p>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" className="text-xs">
                  {author.post_count} {author.post_count === 1 ? 'post' : 'posts'}
                </Badge>
                {index === 0 && (
                  <span className="text-xs">🏆</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
