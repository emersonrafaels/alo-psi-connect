import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BlogPostsList } from '@/components/blog/BlogPostsList';
import { BlogAnalyticsDashboard } from '@/components/admin/BlogAnalyticsDashboard';
import { AnalyticsFilters } from '@/components/admin/AnalyticsFilters';
import { AuthorAnalytics } from '@/components/admin/AuthorAnalytics';
import { useAuth } from '@/hooks/useAuth';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { Button } from '@/components/ui/button';
import { FileText, BarChart3, Star, Sparkles } from 'lucide-react';
import { CurationStatsCards } from '@/components/blog/curation/CurationStatsCards';
import { CurationFilters } from '@/components/blog/curation/CurationFilters';
import { CurationTable } from '@/components/blog/curation/CurationTable';
import { BulkActionsToolbar } from '@/components/blog/curation/BulkActionsToolbar';
import { FeaturedPostsReorder } from '@/components/blog/curation/FeaturedPostsReorder';
import { useCurationPosts, CurationFilters as FilterType } from '@/hooks/useCurationPosts';

const BlogManagement = () => {
  const [dateRange, setDateRange] = useState(30);
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'featured' | 'normal'>('all');
  const [selectedAuthor, setSelectedAuthor] = useState<string>('all');
  
  const { user } = useAuth();
  const { hasRole } = useAdminAuth();
  const isAdmin = hasRole('admin' as any);
  
  const [filters, setFilters] = useState<FilterType>({
    status: 'all',
    badge: 'all',
    featured: 'all',
    orderBy: 'created_at',
    orderDirection: 'desc'
  });
  
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [reorderModalOpen, setReorderModalOpen] = useState(false);
  
  const { data: posts = [], isLoading } = useCurationPosts(filters);
  const { data: featuredPosts = [] } = useCurationPosts({ 
    featured: 'yes', 
    orderBy: 'featured_order',
    orderDirection: 'asc'
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Gerenciamento do Blog</h2>
        <p className="text-muted-foreground">
          Gerencie posts, analytics e curadoria em um só lugar
        </p>
      </div>

      <Tabs defaultValue="posts" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="posts" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Posts
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
          {isAdmin && (
            <TabsTrigger value="curation" className="flex items-center gap-2">
              <Star className="h-4 w-4" />
              Curadoria
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="posts" className="space-y-4">
          <BlogPostsList />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold tracking-tight">Analytics</h3>
              <p className="text-muted-foreground">
                Análises detalhadas e comparativas dos posts do blog
              </p>
            </div>
            <AnalyticsFilters 
              dateRange={dateRange} 
              onDateRangeChange={setDateRange}
              selectedTag={selectedTag}
              onTagChange={setSelectedTag}
              selectedStatus={selectedStatus}
              onStatusChange={setSelectedStatus}
              selectedAuthor={selectedAuthor}
              onAuthorChange={setSelectedAuthor}
            />
          </div>

          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList>
              <TabsTrigger value="overview">Visão Geral</TabsTrigger>
              <TabsTrigger value="authors">Por Autor</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <BlogAnalyticsDashboard 
                dateRange={dateRange} 
                authorId={selectedAuthor !== 'all' ? selectedAuthor : undefined}
                tagSlug={selectedTag !== 'all' ? selectedTag : undefined}
                featuredStatus={selectedStatus}
              />
            </TabsContent>

            <TabsContent value="authors" className="space-y-4">
              <AuthorAnalytics dateRange={dateRange} />
            </TabsContent>
          </Tabs>
        </TabsContent>

        {isAdmin && (
          <TabsContent value="curation" className="space-y-6">
            <CurationStatsCards />
            
            <div className="bg-card border rounded-lg p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold">Posts em Destaque</h3>
                  <p className="text-sm text-muted-foreground">
                    {featuredPosts.length} post(s) em destaque no momento
                  </p>
                </div>
                <Button onClick={() => setReorderModalOpen(true)} className="gap-2">
                  <Sparkles className="h-4 w-4" />
                  Reordenar Destaques
                </Button>
              </div>
              
              {featuredPosts.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {featuredPosts.slice(0, 6).map((post) => (
                    <div key={post.id} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                        {post.featured_order}
                      </div>
                      {post.featured_image_url && (
                        <img 
                          src={post.featured_image_url} 
                          alt={post.title}
                          className="w-12 h-10 object-cover rounded"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{post.title}</p>
                        <p className="text-xs text-muted-foreground">{post.views_count || 0} views</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-4">
              <CurationFilters filters={filters} onFiltersChange={setFilters} />
              
              <BulkActionsToolbar
                selectedIds={selectedIds}
                onSelectAll={() => setSelectedIds(posts.map(p => p.id))}
                onDeselectAll={() => setSelectedIds([])}
                totalCount={posts.length}
              />
              
              <CurationTable
                posts={posts}
                isLoading={isLoading}
                selectedIds={selectedIds}
                onSelectionChange={setSelectedIds}
              />
            </div>

            <FeaturedPostsReorder
              open={reorderModalOpen}
              onOpenChange={setReorderModalOpen}
              posts={featuredPosts}
            />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

export default BlogManagement;
