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
import { useBlogPosts } from "@/hooks/useBlogPosts";
import { useBlogTags } from "@/hooks/useBlogTags";
import { useDebounce } from "@/hooks/useDebounce";
import { useRecentPosts } from "@/hooks/useRecentPosts";
import { SortDropdown, SortOption } from "@/components/blog/SortDropdown";
import { MobileFilters } from "@/components/blog/MobileFilters";
import { HeroPost } from "@/components/blog/HeroPost";
import { FeaturedGrid } from "@/components/blog/FeaturedGrid";
import { PostCardVariant } from "@/components/blog/PostCardVariant";
import { PopularPosts } from "@/components/blog/PopularPosts";
import { NewsletterCTA } from "@/components/blog/NewsletterCTA";
import { AuthorSpotlight } from "@/components/blog/AuthorSpotlight";

const Blog = () => {
  const { tenant } = useTenant();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [selectedAuthor, setSelectedAuthor] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [displayLimit, setDisplayLimit] = useState(10);
  
  // Debounce search term
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  // SEO: Set meta tags for blog page
  useEffect(() => {
    if (tenant) {
      document.title = `Blog | ${tenant.name} - Saúde Emocional`;
      
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
    authorId: selectedAuthor || undefined,
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
    setSelectedAuthor(null);
  };
  
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Header */}
      <section className="bg-secondary py-16">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold text-accent-foreground mb-4">News & Blog</h1>
          <p className="text-accent-foreground/80">Artigos, dicas e reflexões sobre saúde emocional</p>
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
            {selectedAuthor && (
              <Badge variant="secondary" className="text-sm gap-1">
                Autor filtrado
                <X 
                  className="h-3 w-3 cursor-pointer hover:text-destructive" 
                  onClick={() => setSelectedAuthor(null)}
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

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3">
            {isLoading ? (
              <div className="space-y-12">
                <Skeleton className="h-96 w-full rounded-2xl" />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1, 2, 3, 4, 5, 6].map(i => (
                    <Skeleton key={i} className="h-80" />
                  ))}
                </div>
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
              <>
                {/* Hero Post - Primeiro post em destaque */}
                {!debouncedSearchTerm && !selectedTag && posts.length > 0 && (
                  <HeroPost post={posts[0]} />
                )}

                {/* Featured Grid - Próximos 6 posts */}
                {!debouncedSearchTerm && !selectedTag && posts.length > 1 && (
                  <FeaturedGrid posts={posts.slice(1, 7)} />
                )}

                {/* Regular Posts - Resto dos posts ou resultados de busca */}
                <section>
                  {(debouncedSearchTerm || selectedTag) && (
                    <div className="mb-8">
                      <h2 className="text-2xl font-bold mb-2">Resultados da Busca</h2>
                    </div>
                  )}
                  {(!debouncedSearchTerm && !selectedTag && posts.length > 7) && (
                    <div className="mb-8">
                      <h2 className="text-2xl font-bold mb-2">Mais Artigos</h2>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {(debouncedSearchTerm || selectedTag || selectedAuthor 
                      ? posts.slice(0, displayLimit)
                      : posts.slice(7, 7 + displayLimit)
                    ).map((post, index) => {
                      // Variação de layouts
                      const variant = index % 5 === 0 ? 'horizontal' : index % 7 === 0 ? 'minimal' : 'default';
                      return (
                        <PostCardVariant
                          key={post.id}
                          post={post}
                          variant={variant}
                          className={variant === 'horizontal' ? 'md:col-span-2' : ''}
                        />
                      );
                    })}
                  </div>

                  {/* Botão Carregar Mais */}
                  {((debouncedSearchTerm || selectedTag || selectedAuthor) 
                    ? posts.length > displayLimit
                    : posts.length > 7 + displayLimit
                  ) && (
                    <div className="flex justify-center mt-8">
                      <Button 
                        variant="outline"
                        onClick={() => setDisplayLimit(prev => prev + 10)}
                      >
                        Carregar mais ({
                          (debouncedSearchTerm || selectedTag || selectedAuthor)
                            ? posts.length - displayLimit
                            : posts.length - (7 + displayLimit)
                        } restantes)
                      </Button>
                    </div>
                  )}
                </section>
              </>
            )}
          </div>

          {/* Sidebar */}
          <aside className="space-y-6 hidden lg:block">
            {/* Search */}
            <Card className="shadow-card hover:shadow-card-hover transition-shadow">
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

            {/* Popular Posts */}
            {!isLoading && posts.length > 0 && (
              <PopularPosts posts={posts} />
            )}

            {/* Newsletter CTA */}
            <NewsletterCTA />

            {/* Author Spotlight */}
            <AuthorSpotlight 
              selectedAuthor={selectedAuthor}
              onAuthorSelect={setSelectedAuthor}
            />

            {/* Tags */}
            <Card className="shadow-card hover:shadow-card-hover transition-shadow">
              <CardHeader>
                <CardTitle>Tags</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  <Badge 
                    variant={selectedTag === null ? "default" : "secondary"}
                    className="cursor-pointer hover-scale"
                    onClick={() => setSelectedTag(null)}
                  >
                    Todas
                  </Badge>
                  {allTags.map((tag) => (
                    <Badge 
                      key={tag.id} 
                      variant={selectedTag === tag.slug ? "default" : "secondary"}
                      className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors hover-scale"
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
