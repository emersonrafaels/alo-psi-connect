import { useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Clock, Eye, Home, Bookmark, RefreshCw } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import DOMPurify from 'dompurify';
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
import { useBlogPostBySlugWithoutTenantFilter } from '@/hooks/useBlogPostBySlugWithoutTenantFilter';
import { ShareButtons } from '@/components/blog/ShareButtons';
import { useSavedPosts } from '@/hooks/useSavedPosts';
import { usePostViewTracking } from '@/hooks/usePostViewTracking';
import { useTenant } from '@/hooks/useTenant';
import { buildTenantPath, getTenantSlugFromPath } from '@/utils/tenantHelpers';
import { ReadingProgress } from '@/components/blog/ReadingProgress';
import { TableOfContents } from '@/components/blog/TableOfContents';
import { FloatingBackButton } from '@/components/blog/FloatingBackButton';
import { AuthorCard } from '@/components/blog/AuthorCard';
import { PostBadges } from '@/components/blog/PostBadges';
import { NewsletterCTA } from '@/components/blog/NewsletterCTA';
import { ShareButtonsFloating } from '@/components/blog/ShareButtonsFloating';
import { PostStats } from '@/components/blog/PostStats';
import { useAuth } from '@/hooks/useAuth';
import { useAdminAuth } from '@/hooks/useAdminAuth';
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
  const navigate = useNavigate();
  const { tenant } = useTenant();
  const tenantSlug = tenant?.slug || 'alopsi';
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { isAdmin } = useAdminAuth();
  
  // First, fetch post without tenant filter to check its tenant
  const { data: postWithoutFilter, isLoading: isLoadingNoFilter } = useBlogPostBySlugWithoutTenantFilter(slug);
  
  // Check if redirect is needed - MUST happen before filtered query
  useEffect(() => {
    if (postWithoutFilter) {
      const currentPathTenant = getTenantSlugFromPath(window.location.pathname);
      const postTenantSlug = postWithoutFilter.tenant?.slug || 'alopsi';
      
      console.log('[BlogPost] Current path:', window.location.pathname);
      console.log('[BlogPost] Detected tenant from path:', currentPathTenant);
      console.log('[BlogPost] Post tenant:', postTenantSlug);
      console.log('[BlogPost] Context tenant:', tenant?.slug);
      
      // If post has a tenant and current path doesn't match, redirect
      if (currentPathTenant !== postTenantSlug) {
        const correctPath = buildTenantPath(postTenantSlug, `/blog/${slug}`);
        console.log('[BlogPost] Redirecting to correct tenant path:', correctPath);
        navigate(correctPath, { replace: true });
        return;
      }
    }
  }, [postWithoutFilter, slug, navigate, tenant?.slug]);
  
  // Then fetch with tenant filter for the UI
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
      const siteTitle = tenant.meta_config?.title || tenant.name || 'Rede Bem Estar';
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
      const publisherName = tenant.name || 'Rede Bem Estar';
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
      const defaultTitle = tenant?.meta_config?.title || 'Rede Bem Estar - Plataforma de Saúde Mental';
      document.title = defaultTitle;
    };
  }, [post, tenant]);

  // Show loading during redirect or initial load
  if (isLoading || isLoadingNoFilter || (postWithoutFilter && !post && !isLoading)) {
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
            <Link to={buildTenantPath(tenantSlug, '/blog')}>
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

  // Helper para gerar IDs consistentes para os headings
  const generateHeadingId = (text: string) => {
    return text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
  };

  return (
    <div className="min-h-screen flex flex-col">
      <ReadingProgress />
      <FloatingBackButton />
      <ShareButtonsFloating url={window.location.href} title={post.title} />
      <TableOfContents content={post.content} />
      <Header />
      <main className="flex-1">
        <article className="container mx-auto px-6 sm:px-8 lg:px-12 py-16 max-w-3xl xl:max-w-5xl">
          <div className="flex items-center justify-between mb-6">
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link to={buildTenantPath(tenantSlug, '/')}>
                      <Home className="h-4 w-4" />
                    </Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link to={buildTenantPath(tenantSlug, '/blog')}>Blog</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>{post.title}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
            
            {isAdmin && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const keys = Object.keys(localStorage).filter(k => k.startsWith('tenant_'));
                  keys.forEach(k => localStorage.removeItem(k));
                  queryClient.invalidateQueries();
                  window.location.reload();
                }}
                className="gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Limpar Cache
              </Button>
            )}
            
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

          {isAdmin && (
            <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                🔧 Debug do Tenant
              </h4>
              <div className="text-sm space-y-1 font-mono">
                <p><strong>URL:</strong> <code className="bg-background/50 px-2 py-0.5 rounded">{window.location.pathname}</code></p>
                <p><strong>Tenant Context:</strong> <code className="bg-background/50 px-2 py-0.5 rounded">{tenant?.slug}</code> (ID: <code className="bg-background/50 px-2 py-0.5 rounded">{tenant?.id}</code>)</p>
                <p><strong>Post sem filtro:</strong> <code className="bg-background/50 px-2 py-0.5 rounded">{postWithoutFilter ? '✅ Encontrado' : '❌ Não encontrado'}</code></p>
                <p><strong>Post com filtro:</strong> <code className="bg-background/50 px-2 py-0.5 rounded">{post ? '✅ Encontrado' : '❌ Não encontrado'}</code></p>
                {postWithoutFilter && (
                  <p><strong>Tenant do Post:</strong> <code className="bg-background/50 px-2 py-0.5 rounded">{postWithoutFilter.tenant?.slug}</code> (ID: <code className="bg-background/50 px-2 py-0.5 rounded">{postWithoutFilter.tenant?.id}</code>)</p>
                )}
              </div>
            </div>
          )}

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

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6 mt-2 leading-[1.1] tracking-tight text-balance">
            {post.title}
          </h1>

          {post.excerpt && (
            <p className="text-2xl text-muted-foreground leading-relaxed mb-12 font-light">
              {post.excerpt}
            </p>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6 pb-6 border-b">
            <AuthorBadge 
              name={post.author.nome} 
              photoUrl={post.author.foto_perfil_url}
            />
            {post.published_at && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>{format(new Date(post.published_at), "d 'de' MMMM, yyyy", { locale: ptBR })}</span>
              </div>
            )}
          </div>

          <PostStats 
            views={post.views_count || 0}
            readTime={post.read_time_minutes || 5}
            averageRating={post.average_rating}
            ratingsCount={post.ratings_count}
            commentsCount={post.comments_count}
          />

          <div className="my-10 w-24 h-1 bg-gradient-to-r from-primary/50 to-transparent rounded-full" />

          <div 
            className="blog-content prose prose-lg dark:prose-invert max-w-none 
                          prose-headings:font-bold prose-headings:tracking-tight prose-headings:scroll-mt-24
                          prose-h1:text-4xl prose-h1:mb-8 prose-h1:mt-16 prose-h1:leading-tight
                          prose-h2:text-3xl prose-h2:mb-6 prose-h2:mt-14 prose-h2:leading-snug
                          prose-h3:text-2xl prose-h3:mb-5 prose-h3:mt-10 prose-h3:leading-snug
                          prose-p:text-lg prose-p:leading-[1.9] prose-p:mb-8 prose-p:text-foreground
                          prose-li:text-lg prose-li:leading-[1.8] prose-li:mb-3
                          prose-ul:my-8 prose-ul:ml-8 prose-ol:my-8 prose-ol:ml-8
                          prose-a:text-primary prose-a:font-medium prose-a:no-underline prose-a:transition-all hover:prose-a:underline hover:prose-a:text-primary/80
                          prose-strong:text-foreground prose-strong:font-semibold
                          prose-em:text-foreground/90 prose-em:italic
                          prose-blockquote:border-l-4 prose-blockquote:border-primary/40
                          prose-blockquote:pl-6 prose-blockquote:pr-6 prose-blockquote:py-3
                          prose-blockquote:italic prose-blockquote:text-muted-foreground
                          prose-blockquote:bg-muted/30 prose-blockquote:rounded-r-lg prose-blockquote:my-10
                          prose-code:text-primary prose-code:bg-muted prose-code:px-2 prose-code:py-1 prose-code:rounded prose-code:text-sm prose-code:font-mono
                          prose-pre:bg-muted prose-pre:border prose-pre:border-border prose-pre:my-6 prose-pre:rounded-lg
                          prose-img:rounded-2xl prose-img:shadow-2xl prose-img:my-12
                          prose-hr:my-10 prose-hr:border-border/50"
            dangerouslySetInnerHTML={{ 
              __html: DOMPurify.sanitize(post.content, {
                ALLOWED_TAGS: [
                  'p', 'br', 'strong', 'em', 'u', 's', 'a', 'img',
                  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
                  'ul', 'ol', 'li', 'blockquote', 'code', 'pre',
                  'table', 'thead', 'tbody', 'tr', 'th', 'td', 'hr',
                  'div', 'span'
                ],
                ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class', 'id', 'target', 'rel']
              })
            }}
          />

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
