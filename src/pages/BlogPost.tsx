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
import { PostRating } from '@/components/blog/PostRating';
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
        <article className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-4xl">
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

          <div className="flex flex-wrap gap-2 mb-6">
            {post.tags?.map((tag) => (
              <Badge key={tag.id} variant="secondary">
                {tag.name}
              </Badge>
            ))}
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 leading-tight tracking-tight">
            {post.title}
          </h1>

          {post.excerpt && (
            <p className="text-xl text-muted-foreground leading-relaxed mb-8 font-light">
              {post.excerpt}
            </p>
          )}

          <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3 sm:gap-6 text-sm sm:text-base text-muted-foreground mb-8 pb-8 border-b">
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

          <hr className="my-8 border-border" />

          <div className="blog-content prose prose-lg dark:prose-invert max-w-none 
                          prose-headings:font-bold prose-headings:tracking-tight
                          prose-h1:text-4xl prose-h1:mb-6 prose-h1:mt-12
                          prose-h2:text-3xl prose-h2:mb-4 prose-h2:mt-10
                          prose-h3:text-2xl prose-h3:mb-3 prose-h3:mt-8
                          prose-p:text-lg prose-p:leading-relaxed prose-p:mb-6
                          prose-li:text-lg prose-li:leading-relaxed
                          prose-a:text-primary prose-a:no-underline hover:prose-a:underline
                          prose-strong:text-foreground prose-strong:font-semibold
                          prose-blockquote:border-l-4 prose-blockquote:border-primary
                          prose-blockquote:pl-6 prose-blockquote:italic prose-blockquote:text-muted-foreground
                          prose-code:text-primary prose-code:bg-muted prose-code:px-2 prose-code:py-1 prose-code:rounded
                          prose-pre:bg-muted prose-pre:border prose-pre:border-border
                          prose-img:rounded-xl prose-img:shadow-lg prose-img:my-8">
            <ReactMarkdown>{post.content}</ReactMarkdown>
          </div>

          <div className="mt-12 pt-8 border-t">
            <PostRating
              postId={post.id}
              allowRatings={post.allow_ratings ?? true}
              averageRating={post.average_rating || 0}
              ratingsCount={post.ratings_count || 0}
            />
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

          {post.allow_comments ? (
            <div className="mt-16 pt-8 border-t">
              <h2 className="text-2xl font-bold mb-6">
                Comentários {post.comments_count ? `(${post.comments_count})` : ''}
              </h2>
              <CommentForm postId={post.id} onCommentAdded={() => {}} />
              <CommentsList postId={post.id} refreshTrigger={0} />
            </div>
          ) : (
            <div className="mt-16 pt-8 border-t text-center">
              <p className="text-muted-foreground">
                Os comentários estão desabilitados para este post.
              </p>
            </div>
          )}
        </article>
      </main>
      <Footer />
    </div>
  );
}
