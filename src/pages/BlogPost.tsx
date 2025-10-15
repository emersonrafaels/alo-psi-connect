import { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Calendar, Clock, Eye, Home, Bookmark } from 'lucide-react';
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
import { ShareButtons } from '@/components/blog/ShareButtons';
import { useSavedPosts } from '@/hooks/useSavedPosts';
import { usePostViewTracking } from '@/hooks/usePostViewTracking';
import { useTenant } from '@/hooks/useTenant';
import { ReadingProgress } from '@/components/blog/ReadingProgress';
import { TableOfContents } from '@/components/blog/TableOfContents';
import { FloatingBackButton } from '@/components/blog/FloatingBackButton';
import { AuthorCard } from '@/components/blog/AuthorCard';
import { PostBadges } from '@/components/blog/PostBadges';
import { NewsletterCTA } from '@/components/blog/NewsletterCTA';
import { ShareButtonsFloating } from '@/components/blog/ShareButtonsFloating';
import { PostStats } from '@/components/blog/PostStats';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>();
  const { tenant } = useTenant();
  const { data: post, isLoading, incrementViews } = useBlogPost(slug);
  const { data: relatedPosts } = useBlogPosts({ 
    status: 'published',
    limit: 3,
    tagSlug: post?.tags?.[0]?.slug 
  });
  const { isSaved, toggleSave } = useSavedPosts(post?.id || '');
  
  // Track post view analytics
  usePostViewTracking(post?.id || '');

  useEffect(() => {
    if (slug && post) {
      incrementViews.mutate(slug);
    }
  }, [slug, post?.id]);

  // SEO: Dynamic meta tags and Schema.org
  useEffect(() => {
    if (post && tenant) {
      // Page title
      const siteTitle = tenant.meta_config?.title || tenant.name || 'Alô, Psi!';
      document.title = `${post.title} | ${siteTitle} Blog`;
      
      // Meta description
      const metaDescription = document.querySelector('meta[name="description"]');
      if (metaDescription) {
        metaDescription.setAttribute('content', post.excerpt || post.content.substring(0, 160));
      }
      
      // Open Graph tags
      const setOrCreateMeta = (property: string, content: string, isProperty = true) => {
        const selector = isProperty ? `meta[property="${property}"]` : `meta[name="${property}"]`;
        let meta = document.querySelector(selector);
        if (!meta) {
          meta = document.createElement('meta');
          if (isProperty) {
            meta.setAttribute('property', property);
          } else {
            meta.setAttribute('name', property);
          }
          document.head.appendChild(meta);
        }
        meta.setAttribute('content', content);
      };
      
      setOrCreateMeta('og:title', post.title);
      setOrCreateMeta('og:description', post.excerpt || post.content.substring(0, 160));
      setOrCreateMeta('og:type', 'article');
      setOrCreateMeta('og:url', window.location.href);
      if (post.featured_image_url) {
        setOrCreateMeta('og:image', post.featured_image_url);
      }
      
      // Twitter Card
      setOrCreateMeta('twitter:card', 'summary_large_image', false);
      setOrCreateMeta('twitter:title', post.title, false);
      setOrCreateMeta('twitter:description', post.excerpt || post.content.substring(0, 160), false);
      if (post.featured_image_url) {
        setOrCreateMeta('twitter:image', post.featured_image_url, false);
      }
      
      // Schema.org JSON-LD
      const publisherName = tenant.name || 'Alô, Psi!';
      const publisherLogo = tenant.logo_url || "https://lovable.dev/opengraph-image-p98pqg.png";
      
      const schema = {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        "headline": post.title,
        "description": post.excerpt || post.content.substring(0, 160),
        "image": post.featured_image_url || "",
        "author": {
          "@type": "Person",
          "name": post.author.nome,
          ...(post.author.foto_perfil_url && { "image": post.author.foto_perfil_url })
        },
        "publisher": {
          "@type": "Organization",
          "name": publisherName,
          "logo": {
            "@type": "ImageObject",
            "url": publisherLogo
          }
        },
        "datePublished": post.published_at || post.created_at,
        "dateModified": post.updated_at,
        ...(post.read_time_minutes && { "timeRequired": `PT${post.read_time_minutes}M` }),
        "url": window.location.href,
        "mainEntityOfPage": {
          "@type": "WebPage",
          "@id": window.location.href
        },
        ...(post.tags && post.tags.length > 0 && {
          "keywords": post.tags.map(t => t.name).join(', ')
        }),
        ...(post.average_rating && post.ratings_count && {
          "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": post.average_rating,
            "reviewCount": post.ratings_count,
            "bestRating": "5",
            "worstRating": "1"
          }
        }),
        ...(post.comments_count && {
          "commentCount": post.comments_count
        })
      };
      
      // Remove old schema if exists
      const existingSchema = document.getElementById('blog-post-schema');
      if (existingSchema) {
        existingSchema.remove();
      }
      
      // Add new schema
      const script = document.createElement('script');
      script.id = 'blog-post-schema';
      script.type = 'application/ld+json';
      script.text = JSON.stringify(schema);
      document.head.appendChild(script);
    }
    
    return () => {
      const existingSchema = document.getElementById('blog-post-schema');
      if (existingSchema) {
        existingSchema.remove();
      }
      const defaultTitle = tenant?.meta_config?.title || 'Alô, Psi! - Plataforma de Saúde Mental';
      document.title = defaultTitle;
    };
  }, [post, tenant]);

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
      <ReadingProgress />
      <FloatingBackButton />
      <ShareButtonsFloating url={window.location.href} title={post.title} />
      <TableOfContents content={post.content} />
      <Header />
      <main className="flex-1">
        <article className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 max-w-4xl">
          <div className="flex items-center justify-between mb-6">
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link to="/">
                      <Home className="h-4 w-4" />
                    </Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link to="/blog">Blog</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>{post.title}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
            
            <div className="flex items-center gap-2">
              <ShareButtons 
                url={window.location.href}
                title={post.title}
                description={post.excerpt || ''}
              />
              {post.id && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleSave}
                  className="gap-2"
                >
                  <Bookmark className={`h-4 w-4 ${isSaved ? 'fill-current' : ''}`} />
                  {isSaved ? 'Salvo' : 'Salvar'}
                </Button>
              )}
            </div>
          </div>

          <PostBadges 
            isFeatured={post.is_featured}
            editorialBadge={post.editorial_badge}
            publishedAt={post.published_at || post.created_at}
          />

          {post.featured_image_url && (
            <div className="aspect-video rounded-lg overflow-hidden mb-8 relative group">
              <img
                src={post.featured_image_url}
                alt={post.title}
                loading="eager"
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            </div>
          )}

          <div className="flex flex-wrap gap-2 mb-6">
            {post.tags?.map((tag) => (
              <Link key={tag.id} to={`/blog?tag=${tag.slug}`}>
                <Badge variant="secondary" className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors">
                  {tag.name}
                </Badge>
              </Link>
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

          <PostStats 
            views={post.views_count || 0}
            readTime={post.read_time_minutes || 5}
            averageRating={post.average_rating}
            ratingsCount={post.ratings_count}
            commentsCount={post.comments_count}
          />

          <div className="blog-content prose prose-lg dark:prose-invert max-w-none 
                          prose-headings:font-bold prose-headings:tracking-tight
                          prose-h1:text-4xl prose-h1:mb-8 prose-h1:mt-16
                          prose-h2:text-3xl prose-h2:mb-6 prose-h2:mt-14
                          prose-h3:text-2xl prose-h3:mb-5 prose-h3:mt-10
                          prose-p:text-lg prose-p:leading-loose prose-p:mb-8
                          prose-li:text-lg prose-li:leading-relaxed prose-li:mb-3
                          prose-ul:my-8 prose-ol:my-8
                          prose-a:text-primary prose-a:no-underline hover:prose-a:underline
                          prose-strong:text-foreground prose-strong:font-semibold
                          prose-blockquote:border-l-4 prose-blockquote:border-primary
                          prose-blockquote:pl-6 prose-blockquote:italic prose-blockquote:text-muted-foreground prose-blockquote:my-8
                          prose-code:text-primary prose-code:bg-muted prose-code:px-2 prose-code:py-1 prose-code:rounded
                          prose-pre:bg-muted prose-pre:border prose-pre:border-border prose-pre:my-8
                          prose-img:rounded-xl prose-img:shadow-lg prose-img:my-10
                          prose-hr:my-12">
            <ReactMarkdown
              components={{
                img: ({ node, ...props }) => (
                  <img 
                    {...props} 
                    loading="lazy"
                    className="rounded-xl shadow-lg my-8"
                  />
                )
              }}
            >
              {post.content}
            </ReactMarkdown>
          </div>

          <NewsletterCTA />

          <AuthorCard author={post.author} />

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
              <h2 className="text-2xl font-bold mb-6">Você também pode gostar</h2>
              <div className="grid md:grid-cols-2 gap-6">
                {filteredRelatedPosts.map(relatedPost => (
                  <div key={relatedPost.id} className="group">
                    <PostCard post={relatedPost} />
                  </div>
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
