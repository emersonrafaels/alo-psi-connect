import { useState } from 'react';
import { BlogAnalyticsDashboard } from '@/components/admin/BlogAnalyticsDashboard';
import { AnalyticsFilters } from '@/components/admin/AnalyticsFilters';
import { useAuth } from '@/hooks/useAuth';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AuthorAnalytics } from '@/components/admin/AuthorAnalytics';

export default function BlogAnalytics() {
  const [dateRange, setDateRange] = useState(30);
  const [selectedTag, setSelectedTag] = useState<string | undefined>();
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'featured' | 'normal'>('all');
  const [selectedAuthor, setSelectedAuthor] = useState<string | undefined>();
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Blog Analytics</h2>
          <p className="text-muted-foreground">
            Análises detalhadas dos seus posts
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
            authorId={selectedAuthor || user?.id}
            tagSlug={selectedTag}
            featuredStatus={selectedStatus}
          />
        </TabsContent>

        <TabsContent value="authors" className="space-y-4">
          <AuthorAnalytics dateRange={dateRange} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
