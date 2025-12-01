import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/hooks/useTenant";
import { PenTool, Building2, X } from "lucide-react";

interface Author {
  author_id: string | null;
  author_name: string;
  author_photo: string | null;
  post_count: number;
  is_custom: boolean;
}

interface AuthorSpotlightProps {
  selectedAuthor?: string | null;
  onAuthorSelect?: (authorId: string | null) => void;
}

export const AuthorSpotlight = ({ selectedAuthor, onAuthorSelect }: AuthorSpotlightProps) => {
  const { tenant } = useTenant();

  const { data: topAuthors = [] } = useQuery({
    queryKey: ['top-blog-authors', tenant?.id],
    queryFn: async () => {
      if (!tenant) return [];

      // Buscar todos os posts publicados
      const { data: posts } = await supabase
        .from('blog_posts')
        .select('author_id, custom_author_name, display_author_id')
        .eq('status', 'published')
        .or(`tenant_id.eq.${tenant.id},tenant_id.is.null`);

      if (!posts) return [];

      // Criar mapa de autores: author_id -> count
      const authorMap = new Map<string, { name: string; photo: string | null; count: number; isCustom: boolean }>();

      for (const post of posts) {
        // Priorizar custom author
        if (post.custom_author_name) {
          const key = `custom_${post.custom_author_name}`;
          if (!authorMap.has(key)) {
            authorMap.set(key, {
              name: post.custom_author_name,
              photo: null,
              count: 0,
              isCustom: true
            });
          }
          authorMap.get(key)!.count++;
        } else {
          // Usar display_author_id ou author_id
          const authorId = post.display_author_id || post.author_id;
          if (!authorMap.has(authorId)) {
            authorMap.set(authorId, {
              name: '', // Será preenchido depois
              photo: null,
              count: 0,
              isCustom: false
            });
          }
          authorMap.get(authorId)!.count++;
        }
      }

      // Buscar dados dos autores de perfil
      const profileAuthorIds = Array.from(authorMap.keys()).filter(key => !key.startsWith('custom_'));
      
      if (profileAuthorIds.length > 0) {
        const { data: authorsData } = await supabase
          .from('profiles')
          .select('user_id, nome, foto_perfil_url')
          .in('user_id', profileAuthorIds);

        if (authorsData) {
          authorsData.forEach(author => {
            const entry = authorMap.get(author.user_id);
            if (entry) {
              entry.name = author.nome;
              entry.photo = author.foto_perfil_url;
            }
          });
        }
      }

      // Converter para array e ordenar
      const authorsArray: Author[] = Array.from(authorMap.entries())
        .map(([key, data]) => ({
          author_id: key,  // Usar a key para todos (que já é `custom_${nome}` para customizados)
          author_name: data.name,
          author_photo: data.photo,
          post_count: data.count,
          is_custom: data.isCustom
        }))
        .sort((a, b) => b.post_count - a.post_count)
        .slice(0, 3);

      return authorsArray;
    },
    enabled: !!tenant
  });

  if (topAuthors.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PenTool className="h-5 w-5 text-primary" />
            Autores em Destaque
          </div>
          {selectedAuthor && onAuthorSelect && (
            <Badge 
              variant="outline" 
              className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground gap-1"
              onClick={() => onAuthorSelect(null)}
            >
              Limpar <X className="h-3 w-3" />
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {topAuthors.map((author, index) => {
          const isSystemAdmin = !author.author_name || author.author_name === 'Administrador do Sistema';
          const displayName = isSystemAdmin ? (tenant?.name || 'Alô Psi') : author.author_name;
          const displayPhoto = isSystemAdmin ? tenant?.logo_url : author.author_photo;
          const isSelected = selectedAuthor !== null && selectedAuthor === author.author_id;

          return (
            <div 
              key={author.author_id || `custom_${author.author_name}`}
              className={`flex items-center gap-3 p-3 rounded-lg transition-all cursor-pointer ${
                isSelected 
                  ? 'bg-primary/20 border-2 border-primary' 
                  : 'bg-accent/20 hover:bg-accent/40 border-2 border-transparent'
              }`}
              onClick={() => onAuthorSelect?.(author.author_id)}
            >
              {/* Avatar */}
              {displayPhoto ? (
                <img 
                  src={displayPhoto} 
                  alt={displayName}
                  className={`rounded-full border-2 border-primary ${
                    isSystemAdmin 
                      ? 'w-14 h-14 object-contain p-2 bg-white' 
                      : 'w-12 h-12 object-cover'
                  }`}
                />
              ) : isSystemAdmin ? (
                <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center border-2 border-primary">
                  <Building2 className="h-6 w-6" />
                </div>
              ) : (
                <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg border-2 border-primary">
                  {displayName.charAt(0).toUpperCase()}
                </div>
              )}
              
              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{displayName}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary" className="text-xs">
                    {author.post_count} {author.post_count === 1 ? 'post' : 'posts'}
                  </Badge>
                  {index === 0 && (
                    <span className="text-xs">🏆</span>
                  )}
                  {isSelected && (
                    <Badge variant="default" className="text-xs">
                      Filtrado
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};
