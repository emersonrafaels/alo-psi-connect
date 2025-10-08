import { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Calendar, Clock, Eye, User } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import ReactMarkdown from 'react-markdown';
import Header from '@/components/ui/header';
import Footer from '@/components/ui/footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AuthorBadge } from '@/components/blog/AuthorBadge';
import { PostCard } from '@/components/blog/PostCard';
import { CommentForm } from '@/components/CommentForm';
import { CommentsList } from '@/components/CommentsList';
import { useBlogPost } from '@/hooks/useBlogPost';
import { useBlogPosts } from '@/hooks/useBlogPosts';

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>();
  const { data: post, isLoading, incrementViews } = useBlogPost(slug);
  const { data: relatedPosts } = useBlogPosts({ 
    status: 'published',
    limit: 3,
    tagSlug: post?.tags?.[0]?.slug 
  });

  useEffect(() => {
    if (slug && post) {
      incrementViews.mutate(slug);
    }
  }, [slug, post?.id]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8">
          <Skeleton className="h-96 w-full mb-8" />
          <Skeleton className="h-8 w-3/4 mb-4" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-2/3" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-16 text-center">
          <h1 className="text-4xl font-bold mb-4">Post não encontrado</h1>
          <p className="text-muted-foreground mb-8">O post que você está procurando não existe.</p>
          <Button asChild>
            <Link to="/blog">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar ao Blog
            </Link>
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  const filteredRelatedPosts = relatedPosts?.filter(p => p.id !== post.id).slice(0, 2) || [];

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <article className="container mx-auto px-4 py-8 max-w-4xl">
          <Button variant="ghost" asChild className="mb-6">
            <Link to="/blog">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar ao Blog
            </Link>
          </Button>

          {post.featured_image_url && (
            <div className="aspect-video rounded-lg overflow-hidden mb-8">
              <img
                src={post.featured_image_url}
                alt={post.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <div className="flex flex-wrap gap-2 mb-4">
            {post.tags?.map((tag) => (
              <Badge key={tag.id} variant="secondary">
                {tag.name}
              </Badge>
            ))}
          </div>

          <h1 className="text-4xl md:text-5xl font-bold mb-6">{post.title}</h1>

          <div className="flex flex-wrap gap-6 text-muted-foreground mb-8 pb-8 border-b">
            <AuthorBadge 
              name={post.author.nome} 
              photoUrl={post.author.foto_perfil_url}
            />
            {post.published_at && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>{format(new Date(post.published_at), "d 'de' MMMM, yyyy", { locale: ptBR })}</span>
              </div>
            )}
            {post.read_time_minutes && (
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>{post.read_time_minutes} min de leitura</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              <span>{post.views_count} visualizações</span>
            </div>
          </div>

          <div className="prose prose-lg dark:prose-invert max-w-none">
            <ReactMarkdown>{post.content}</ReactMarkdown>
          </div>

          {filteredRelatedPosts.length > 0 && (
            <div className="mt-16 pt-8 border-t">
              <h2 className="text-2xl font-bold mb-6">Posts Relacionados</h2>
              <div className="grid md:grid-cols-2 gap-6">
                {filteredRelatedPosts.map(relatedPost => (
                  <PostCard key={relatedPost.id} post={relatedPost} />
                ))}
              </div>
            </div>
          )}

          <div className="mt-16 pt-8 border-t">
            <h2 className="text-2xl font-bold mb-6">Comentários</h2>
            <CommentForm postId={post.id} onCommentAdded={() => {}} />
            <CommentsList postId={post.id} refreshTrigger={0} />
          </div>
        </article>
      </main>
      <Footer />
    </div>
  );
}
