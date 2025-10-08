import { useState } from "react";
import Header from "@/components/ui/header";
import Footer from "@/components/ui/footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Search } from "lucide-react";
import { PostCard } from "@/components/blog/PostCard";
import { useBlogPosts } from "@/hooks/useBlogPosts";
import { useBlogTags } from "@/hooks/useBlogTags";

const Blog = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  
  const { data: posts = [], isLoading } = useBlogPosts({ 
    status: 'published',
    searchTerm: searchTerm || undefined,
    tagSlug: selectedTag || undefined 
  });
  
  const { data: allTags = [] } = useBlogTags();

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
                {(searchTerm || selectedTag) && (
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => {
                      setSearchTerm('');
                      setSelectedTag(null);
                    }}
                  >
                    Limpar Filtros
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-8">
                {posts.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <aside className="space-y-8">
            {/* Search */}
            <Card>
              <CardHeader>
                <CardTitle>Search</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <Input 
                    placeholder="Procurar por palavra..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <Button size="sm" className="absolute right-1 top-1 h-8 w-8" variant="default">
                    <Search size={16} />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Recent Posts */}
            <Card>
              <CardHeader>
                <CardTitle>Posts Recentes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {isLoading ? (
                  [1, 2, 3].map(i => (
                    <Skeleton key={i} className="h-20 w-full" />
                  ))
                ) : (
                  posts.slice(0, 3).map((post) => (
                    <div key={post.id} className="flex space-x-3 cursor-pointer hover:opacity-80">
                      {post.featured_image_url ? (
                        <div className="w-16 h-16 rounded flex-shrink-0 overflow-hidden">
                          <img 
                            src={post.featured_image_url} 
                            alt={post.title}
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
                    </div>
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
