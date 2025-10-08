import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BlogPostsList } from '@/components/blog/BlogPostsList';
import { BlogAnalyticsDashboard } from '@/components/admin/BlogAnalyticsDashboard';
import { AnalyticsFilters } from '@/components/admin/AnalyticsFilters';
import { useAuth } from '@/hooks/useAuth';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { Card } from '@/components/ui/card';
import { FileText, BarChart3, Star } from 'lucide-react';

const BlogManagement = () => {
  const [dateRange, setDateRange] = useState(30);
  const { user } = useAuth();
  const { hasRole } = useAdminAuth();
  const isAdmin = hasRole('admin' as any);

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
                Análises detalhadas dos seus posts
              </p>
            </div>
            <AnalyticsFilters dateRange={dateRange} onDateRangeChange={setDateRange} />
          </div>
          <BlogAnalyticsDashboard dateRange={dateRange} authorId={user?.id} />
        </TabsContent>

        {isAdmin && (
          <TabsContent value="curation" className="space-y-4">
            <Card className="p-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-2xl font-bold tracking-tight mb-2">Dashboard de Curadoria</h3>
                  <p className="text-muted-foreground">
                    Ferramentas avançadas para curadoria e destaque de posts
                  </p>
                </div>
                
                <div className="bg-muted/50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">Funcionalidades Planejadas (Sprint 2):</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                    <li>Filtros avançados (status, badges, featured)</li>
                    <li>Ações em massa (destacar, badges, publicar)</li>
                    <li>Drag & drop para reordenar posts em destaque</li>
                    <li>Ações rápidas inline</li>
                    <li>Estatísticas de curadoria</li>
                    <li>Gerenciamento de coleções</li>
                  </ul>
                </div>

                <p className="text-sm text-muted-foreground mt-4">
                  Por enquanto, você pode editar badges e destaques na aba <strong>Posts</strong> ao editar cada post individualmente.
                </p>
              </div>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

export default BlogManagement;
