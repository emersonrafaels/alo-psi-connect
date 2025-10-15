import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/ui/header";
import Footer from "@/components/ui/footer";
import { useTenant } from "@/hooks/useTenant";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, X, Loader2 } from "lucide-react";
import { PostCard } from "@/components/blog/PostCard";
import { useBlogPosts } from "@/hooks/useBlogPosts";
import { useBlogTags } from "@/hooks/useBlogTags";
import { useDebounce } from "@/hooks/useDebounce";
import { useRecentPosts } from "@/hooks/useRecentPosts";
import { SortDropdown, SortOption } from "@/components/blog/SortDropdown";
import { MobileFilters } from "@/components/blog/MobileFilters";

const Blog = () => {
  const { tenant } = useTenant();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  
  // Debounce search term
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  // SEO: Set meta tags for blog page
  useEffect(() => {
    if (tenant) {
      document.title = `Blog | ${tenant.name} - Saúde Mental`;
      
      const metaDescription = document.querySelector('meta[name="description"]');
      if (metaDescription) {
        metaDescription.setAttribute('content', tenant.meta_config.description);
      }
    }
    
    return () => {
      if (tenant) {
        document.title = tenant.meta_config.title;
      }
    };
  }, [tenant]);
  
  const { data: posts = [], isLoading } = useBlogPosts({
    status: 'published',
    searchTerm: debouncedSearchTerm || undefined,
    tagSlug: selectedTag || undefined,
    sortBy
  });
  
  const { data: allTags = [] } = useBlogTags();
  const { data: recentPosts = [], isLoading: recentPostsLoading } = useRecentPosts(5);
  
  // Check if currently searching (debouncing)
  const isSearching = searchTerm !== debouncedSearchTerm && searchTerm.length > 0;
  
  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedTag(null);
  };
  
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Header */}
      <section className="bg-accent py-16">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold text-accent-foreground mb-4">News & Blog</h1>
          <p className="text-accent-foreground/80">Artigos, dicas e reflexões sobre saúde mental</p>
        </div>
      </section>

      <div className="container mx-auto px-4 py-12">
        {/* Active Filters & Sort */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            {/* Mobile Filters Button */}
            <MobileFilters 
              allTags={allTags}
              selectedTag={selectedTag}
              onTagSelect={setSelectedTag}
            />
            
            {/* Result count & active filters */}
            {debouncedSearchTerm && (
              <Badge variant="secondary" className="text-sm">
                Buscando: "{debouncedSearchTerm}"
              </Badge>
            )}
            {selectedTag && (
              <Badge variant="secondary" className="text-sm gap-1">
                Tag: {allTags.find(t => t.slug === selectedTag)?.name}
                <X 
                  className="h-3 w-3 cursor-pointer hover:text-destructive" 
                  onClick={() => setSelectedTag(null)}
                />
              </Badge>
            )}
            {!isLoading && !isSearching && (
              <span className="text-sm text-muted-foreground">
                {posts.length} {posts.length === 1 ? 'post encontrado' : 'posts encontrados'}
              </span>
            )}
            {isSearching && (
              <Badge variant="outline" className="gap-2">
                <Loader2 className="h-3 w-3 animate-spin" />
                Buscando...
              </Badge>
            )}
          </div>
          
          {/* Sort Dropdown */}
          <SortDropdown 
            value={sortBy} 
            onChange={setSortBy}
            hasSearchTerm={!!debouncedSearchTerm}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {isLoading ? (
              <div className="space-y-8">
                {[1, 2, 3].map(i => (
                  <div key={i} className="space-y-4">
                    <Skeleton className="h-64 w-full" />
                    <Skeleton className="h-8 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                ))}
              </div>
            ) : posts.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-muted-foreground text-lg">Nenhum post encontrado.</p>
                {(debouncedSearchTerm || selectedTag) && (
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={handleClearFilters}
                  >
                    Limpar Filtros
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-8">
                {posts.map((post) => (
                  <PostCard key={post.id} post={post} searchTerm={debouncedSearchTerm} />
                ))}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <aside className="space-y-8 hidden lg:block">
            {/* Search */}
            <Card>
              <CardHeader>
                <CardTitle>Busca</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSearchSubmit} className="relative">
                  <Input 
                    placeholder="Procurar por palavra..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pr-20"
                  />
                  <div className="absolute right-1 top-1 flex gap-1">
                    {searchTerm && (
                      <Button 
                        size="sm" 
                        className="h-8 w-8" 
                        variant="ghost"
                        type="button"
                        onClick={() => setSearchTerm('')}
                      >
                        <X size={16} />
                      </Button>
                    )}
                    <Button size="sm" className="h-8 w-8" variant="default" type="submit">
                      <Search size={16} />
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Recent Posts */}
            <Card>
              <CardHeader>
                <CardTitle>Posts Recentes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {recentPostsLoading ? (
                  [1, 2, 3, 4, 5].map(i => (
                    <Skeleton key={i} className="h-20 w-full" />
                  ))
                ) : (
                  recentPosts.map((post) => (
                    <Link 
                      key={post.id} 
                      to={`/blog/${post.slug}`}
                      className="flex space-x-3 hover:bg-accent/50 p-2 -mx-2 rounded-lg transition-colors"
                    >
                      {post.featured_image_url ? (
                        <div className="w-16 h-16 rounded flex-shrink-0 overflow-hidden">
                          <img 
                            src={post.featured_image_url} 
                            alt={post.title}
                            loading="lazy"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-16 h-16 bg-primary rounded flex-shrink-0 flex items-center justify-center">
                          <span className="text-primary-foreground text-xs font-semibold text-center">
                            {post.tags?.[0]?.name || 'Blog'}
                          </span>
                        </div>
                      )}
                      <div>
                        <h4 className="font-medium text-sm leading-tight line-clamp-2">{post.title}</h4>
                        {post.published_at && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(post.published_at).toLocaleDateString('pt-BR')}
                          </p>
                        )}
                      </div>
                    </Link>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Tags */}
            <Card>
              <CardHeader>
                <CardTitle>Tags</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  <Badge 
                    variant={selectedTag === null ? "default" : "secondary"}
                    className="cursor-pointer"
                    onClick={() => setSelectedTag(null)}
                  >
                    Todas
                  </Badge>
                  {allTags.map((tag) => (
                    <Badge 
                      key={tag.id} 
                      variant={selectedTag === tag.slug ? "default" : "secondary"}
                      className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                      onClick={() => setSelectedTag(tag.slug)}
                    >
                      {tag.name}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Blog;
