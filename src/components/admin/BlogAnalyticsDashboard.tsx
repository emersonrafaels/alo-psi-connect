import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MetricsCard } from './config/MetricsCard';
import { UsageChart } from './config/UsageChart';
import { useBlogAnalyticsSummary, useDailyAnalytics, usePostAnalytics } from '@/hooks/useBlogAnalytics';
import { BarChart3, Eye, Users, Clock, CheckCircle2, MessageCircle, Star, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';

interface BlogAnalyticsDashboardProps {
  dateRange?: number;
}

export const BlogAnalyticsDashboard = ({ dateRange = 30 }: BlogAnalyticsDashboardProps) => {
  const { data: summary, isLoading: loadingSummary } = useBlogAnalyticsSummary(dateRange);
  const { data: dailyData, isLoading: loadingDaily } = useDailyAnalytics(dateRange);
  const { data: topPosts, isLoading: loadingPosts } = usePostAnalytics(dateRange, 10);

  if (loadingSummary || loadingDaily || loadingPosts) {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-muted rounded w-24"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded w-16"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Métricas principais */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricsCard
          title="Total de Posts"
          value={summary?.totalPosts || 0}
          description="Posts publicados"
          icon={BarChart3}
        />
        <MetricsCard
          title="Visualizações"
          value={summary?.totalViews.toLocaleString() || 0}
          description={`Últimos ${dateRange} dias`}
          icon={Eye}
        />
        <MetricsCard
          title="Visitantes Únicos"
          value={summary?.totalUniqueVisitors.toLocaleString() || 0}
          description={`Últimos ${dateRange} dias`}
          icon={Users}
        />
        <MetricsCard
          title="Tempo Médio"
          value={`${Math.floor((summary?.avgTimeSpent || 0) / 60)}min`}
          description="Tempo de leitura"
          icon={Clock}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricsCard
          title="Taxa de Conclusão"
          value={`${summary?.avgCompletionRate || 0}%`}
          description="Leitura completa"
          icon={CheckCircle2}
        />
        <MetricsCard
          title="Comentários"
          value={summary?.totalComments || 0}
          description="Total de comentários"
          icon={MessageCircle}
        />
        <MetricsCard
          title="Avaliações"
          value={summary?.totalRatings || 0}
          description="Total de ratings"
          icon={Star}
        />
        <MetricsCard
          title="Rating Médio"
          value={summary?.avgRating.toFixed(1) || '0.0'}
          description="De 5 estrelas"
          icon={Star}
        />
      </div>

      {/* Gráfico de visualizações ao longo do tempo */}
      <div className="grid gap-4 md:grid-cols-2">
        <UsageChart
          title="Visualizações ao Longo do Tempo"
          description={`Últimos ${dateRange} dias`}
          data={dailyData?.map(d => ({ date: d.date, value: d.views })) || []}
          type="area"
          dataKey="value"
          xAxisKey="date"
          height={300}
        />

        <UsageChart
          title="Visitantes Únicos"
          description={`Últimos ${dateRange} dias`}
          data={dailyData?.map(d => ({ date: d.date, value: d.uniqueVisitors })) || []}
          type="line"
          dataKey="value"
          xAxisKey="date"
          height={300}
        />
      </div>

      {/* Top 10 Posts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Top 10 Posts Mais Vistos
          </CardTitle>
          <CardDescription>Últimos {dateRange} dias</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {topPosts?.map((post, index) => (
              <div key={post.postId} className="flex items-center gap-4 pb-4 border-b last:border-0">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold">
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <Link 
                    to={`/blog/${post.postSlug}`}
                    className="font-medium hover:underline truncate block"
                  >
                    {post.postTitle}
                  </Link>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                    <span className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      {post.totalViews.toLocaleString()} views
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {post.uniqueVisitors.toLocaleString()} únicos
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {Math.floor(post.avgTimeSpent / 60)}min
                    </span>
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      {post.completionRate}%
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 text-sm">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span>{post.avgRating.toFixed(1)}</span>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <MessageCircle className="h-4 w-4" />
                    <span>{post.commentsCount}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Gráficos de engajamento */}
      <div className="grid gap-4 md:grid-cols-2">
        <UsageChart
          title="Tempo Médio de Leitura"
          description="Em segundos por dia"
          data={dailyData?.map(d => ({ date: d.date, value: d.avgTimeSpent })) || []}
          type="bar"
          dataKey="value"
          xAxisKey="date"
          height={300}
        />

        <UsageChart
          title="Taxa de Conclusão"
          description="Percentual de leitura completa"
          data={dailyData?.map(d => ({ date: d.date, value: d.completionRate })) || []}
          type="line"
          dataKey="value"
          xAxisKey="date"
          height={300}
        />
      </div>
    </div>
  );
};
