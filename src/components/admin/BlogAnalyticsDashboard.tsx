import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MetricsCard } from './config/MetricsCard';
import { UsageChart } from './config/UsageChart';
import { useBlogAnalyticsSummary, useDailyAnalytics, usePostAnalytics } from '@/hooks/useBlogAnalytics';
import { BarChart3, Eye, Users, Clock, CheckCircle2, MessageCircle, Star, TrendingUp, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AnalyticsSync } from './AnalyticsSync';
import { AnalyticsStatus } from './AnalyticsStatus';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface BlogAnalyticsDashboardProps {
  dateRange?: number;
  authorId?: string;
  tagSlug?: string;
  featuredStatus?: 'all' | 'featured' | 'normal';
  tenantFilter?: string | null;
}

export const BlogAnalyticsDashboard = ({ 
  dateRange = 30, 
  authorId,
  tagSlug,
  featuredStatus = 'all',
  tenantFilter
}: BlogAnalyticsDashboardProps) => {
  const { data: summary, isLoading: loadingSummary } = useBlogAnalyticsSummary(dateRange, authorId, tagSlug, featuredStatus, tenantFilter);
  const { data: dailyData, isLoading: loadingDaily } = useDailyAnalytics(dateRange, authorId, tagSlug, featuredStatus, tenantFilter);
  const { data: topPosts, isLoading: loadingPosts } = usePostAnalytics(dateRange, 10, authorId, tagSlug, featuredStatus, tenantFilter);

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
      {/* Header com botão de sincronização */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-bold">Analytics do Blog</h2>
          {summary?.isRealTime && (
            <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">
              Dados em tempo real
            </Badge>
          )}
        </div>
        <AnalyticsSync />
      </div>

      {/* Status da agregação */}
      <AnalyticsStatus />

      {/* Alerta quando não há dados */}
      {!summary?.isRealTime && summary?.totalViews === 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Ainda não há visualizações registradas para este período. Os dados serão agregados automaticamente às 00:05 UTC diariamente, ou você pode sincronizar manualmente usando o botão acima.
          </AlertDescription>
        </Alert>
      )}

      {/* Métricas principais */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricsCard
          title="Total de Posts"
          value={summary?.totalPosts || 0}
          description="Posts publicados"
          icon={BarChart3}
          trend={summary?.trends?.totalPosts}
        />
        <MetricsCard
          title="Visualizações"
          value={summary?.totalViews.toLocaleString() || 0}
          description={`Últimos ${dateRange} dias`}
          icon={Eye}
          trend={summary?.trends?.totalViews}
        />
        <MetricsCard
          title="Visitantes Únicos"
          value={summary?.totalUniqueVisitors.toLocaleString() || 0}
          description={`Últimos ${dateRange} dias`}
          icon={Users}
          trend={summary?.trends?.totalUniqueVisitors}
        />
        <MetricsCard
          title="Tempo Médio"
          value={`${Math.floor((summary?.avgTimeSpent || 0) / 60)}min`}
          description="Tempo de leitura"
          icon={Clock}
          trend={summary?.trends?.avgTimeSpent}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricsCard
          title="Taxa de Conclusão"
          value={`${summary?.avgCompletionRate || 0}%`}
          description="Leitura completa"
          icon={CheckCircle2}
          trend={summary?.trends?.avgCompletionRate}
        />
        <MetricsCard
          title="Comentários"
          value={summary?.totalComments || 0}
          description="Total de comentários"
          icon={MessageCircle}
          trend={summary?.trends?.totalComments}
        />
        <MetricsCard
          title="Avaliações"
          value={summary?.totalRatings || 0}
          description="Total de ratings"
          icon={Star}
          trend={summary?.trends?.totalRatings}
        />
        <MetricsCard
          title="Rating Médio"
          value={summary?.avgRating.toFixed(1) || '0.0'}
          description="De 5 estrelas"
          icon={Star}
          trend={summary?.trends?.avgRating}
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
          {!topPosts || topPosts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Eye className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p>Nenhum post foi visualizado neste período</p>
              <p className="text-sm mt-1">Aguarde até que os posts sejam visualizados e agregados</p>
            </div>
          ) : (
            <div className="space-y-4">
              {topPosts.map((post, index) => (
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
          )}
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
