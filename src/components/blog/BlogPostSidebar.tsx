import { Eye, Clock, Star, MessageCircle, Share2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Link } from 'react-router-dom';
import { BlogPost } from '@/hooks/useBlogPosts';
import { buildTenantPath } from '@/utils/tenantHelpers';
import { useTenant } from '@/hooks/useTenant';

interface BlogPostSidebarProps {
  post: BlogPost;
  content: string;
  relatedPosts?: BlogPost[];
  onShare?: () => void;
}

export const BlogPostSidebar = ({ post, content, relatedPosts = [], onShare }: BlogPostSidebarProps) => {
  const { tenant } = useTenant();
  const tenantSlug = tenant?.slug || 'alopsi';

  // Generate TOC from content
  const generateTOC = () => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(content, 'text/html');
    const headings = doc.querySelectorAll('h2, h3');
    
    return Array.from(headings).map((heading, index) => ({
      id: heading.id || `heading-${index}`,
      text: heading.textContent || '',
      level: parseInt(heading.tagName[1]),
    }));
  };

  const toc = generateTOC();

  const scrollToHeading = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 100;
      const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
      window.scrollTo({ top: elementPosition - offset, behavior: 'smooth' });
    }
  };

  return (
    <aside className="hidden lg:block lg:w-80 xl:w-96 flex-shrink-0">
      <div className="sticky top-24 space-y-6">
        {/* Table of Contents */}
        {toc.length > 0 && (
          <Card className="border-border/40 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Neste Artigo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              {toc.map((item) => (
                <button
                  key={item.id}
                  onClick={() => scrollToHeading(item.id)}
                  className={`block w-full text-left text-sm py-1.5 px-2 rounded transition-colors hover:bg-muted ${
                    item.level === 3 ? 'pl-6 text-muted-foreground' : 'font-medium'
                  }`}
                >
                  {item.text}
                </button>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Author Card */}
        <Card className="border-border/40 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-4">
              <Avatar className="h-12 w-12">
                <AvatarImage src={post.author.foto_perfil_url || undefined} />
                <AvatarFallback>{post.author.nome[0]}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold text-sm">{post.author.nome}</p>
                <p className="text-xs text-muted-foreground">Autor</p>
              </div>
            </div>
            <Button variant="outline" size="sm" className="w-full" asChild>
              <Link to={buildTenantPath(tenantSlug, `/blog?author=${post.author_id}`)}>
                Ver todos os artigos
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Post Stats */}
        <Card className="border-border/40 shadow-sm">
          <CardContent className="pt-6 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-muted-foreground">
                <Eye className="h-4 w-4" />
                Visualizações
              </span>
              <span className="font-semibold">{post.views_count || 0}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4" />
                Leitura
              </span>
              <span className="font-semibold">{post.read_time_minutes || 5} min</span>
            </div>
            {post.average_rating && post.average_rating > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <Star className="h-4 w-4" />
                  Avaliação
                </span>
                <span className="font-semibold">{post.average_rating.toFixed(1)}/5</span>
              </div>
            )}
            {post.comments_count && post.comments_count > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <MessageCircle className="h-4 w-4" />
                  Comentários
                </span>
                <span className="font-semibold">{post.comments_count}</span>
              </div>
            )}
            <Separator className="my-3" />
            {onShare && (
              <Button variant="outline" size="sm" className="w-full gap-2" onClick={onShare}>
                <Share2 className="h-4 w-4" />
                Compartilhar
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Related Posts */}
        {relatedPosts.length > 0 && (
          <Card className="border-border/40 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Artigos Relacionados</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {relatedPosts.slice(0, 3).map((relatedPost) => (
                <Link
                  key={relatedPost.id}
                  to={buildTenantPath(tenantSlug, `/blog/${relatedPost.slug}`)}
                  className="block group"
                >
                  <div className="space-y-2">
                    {relatedPost.featured_image_url && (
                      <div className="aspect-video rounded overflow-hidden">
                        <img
                          src={relatedPost.featured_image_url}
                          alt={relatedPost.title}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      </div>
                    )}
                    <h4 className="font-semibold text-sm line-clamp-2 group-hover:text-primary transition-colors">
                      {relatedPost.title}
                    </h4>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {relatedPost.read_time_minutes || 5} min
                    </div>
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Newsletter CTA */}
        <Card className="border-border/40 shadow-sm bg-gradient-to-br from-primary/5 to-primary/10">
          <CardContent className="pt-6">
            <h3 className="font-bold text-lg mb-2">📧 Newsletter</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Receba conteúdo exclusivo direto no seu e-mail
            </p>
            <Button className="w-full" size="sm">
              Assinar Agora
            </Button>
          </CardContent>
        </Card>
      </div>
    </aside>
  );
};
