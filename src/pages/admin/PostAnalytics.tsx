import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MetricsCard } from '@/components/admin/config/MetricsCard';
import { UsageChart } from '@/components/admin/config/UsageChart';
import { AnalyticsFilters } from '@/components/admin/AnalyticsFilters';
import { useBlogPostById } from '@/hooks/useBlogPostById';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, subDays, startOfDay } from 'date-fns';
import { Eye, Users, Clock, CheckCircle2, MessageCircle, Star, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';

export default function PostAnalytics() {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const [dateRange, setDateRange] = useState(30);
  const { data: post, isLoading: loadingPost } = useBlogPostById(postId);

  const { data: analytics, isLoading: loadingAnalytics } = useQuery({
    queryKey: ['post-analytics-detail', postId, dateRange],
    queryFn: async () => {
      if (!postId) return null;

      const startDate = format(subDays(startOfDay(new Date()), dateRange), 'yyyy-MM-dd');

      // Buscar analytics diários do post
      const { data: dailyData, error: dailyError } = await supabase
        .from('blog_analytics_daily')
        .select('*')
        .eq('post_id', postId)
        .gte('date', startDate)
        .order('date', { ascending: true });

      if (dailyError) throw dailyError;

      // Calcular totais
      const totalViews = dailyData?.reduce((sum, day) => sum + day.views_count, 0) || 0;
      const totalUniqueVisitors = dailyData?.reduce((sum, day) => sum + day.unique_visitors, 0) || 0;
      const avgTimeSpent = dailyData?.length
        ? dailyData.reduce((sum, day) => sum + parseFloat(String(day.avg_time_spent || 0)), 0) / dailyData.length
        : 0;
      const avgCompletionRate = dailyData?.length
        ? dailyData.reduce((sum, day) => sum + parseFloat(String(day.completion_rate || 0)), 0) / dailyData.length
        : 0;

      return {
        totalViews,
        totalUniqueVisitors,
        avgTimeSpent: Math.round(avgTimeSpent),
        avgCompletionRate: Math.round(avgCompletionRate * 100) / 100,
        dailyData: dailyData || [],
      };
    },
    enabled: !!postId,
  });

  if (loadingPost || loadingAnalytics) {
    return (
      <div className="space-y-6 p-8">
        <Skeleton className="h-12 w-64" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="p-8">
        <p>Post não encontrado</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-8">
      <div className="flex items-center justify-between">
        <div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/admin/blog')}
            className="mb-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para posts
          </Button>
          <h2 className="text-3xl font-bold tracking-tight">{post.title}</h2>
          <p className="text-muted-foreground">Analytics detalhados do post</p>
        </div>
        <AnalyticsFilters dateRange={dateRange} onDateRangeChange={setDateRange} />
      </div>

      {/* Métricas principais */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricsCard
          title="Visualizações"
          value={analytics?.totalViews.toLocaleString() || 0}
          description={`Últimos ${dateRange} dias`}
          icon={Eye}
        />
        <MetricsCard
          title="Visitantes Únicos"
          value={analytics?.totalUniqueVisitors.toLocaleString() || 0}
          description={`Últimos ${dateRange} dias`}
          icon={Users}
        />
        <MetricsCard
          title="Tempo Médio"
          value={`${Math.floor((analytics?.avgTimeSpent || 0) / 60)}min`}
          description="Tempo de leitura"
          icon={Clock}
        />
        <MetricsCard
          title="Taxa de Conclusão"
          value={`${analytics?.avgCompletionRate || 0}%`}
          description="Leitura completa"
          icon={CheckCircle2}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricsCard
          title="Comentários"
          value={post.comments_count || 0}
          description="Total de comentários"
          icon={MessageCircle}
        />
        <MetricsCard
          title="Avaliações"
          value={post.ratings_count || 0}
          description="Total de ratings"
          icon={Star}
        />
        <MetricsCard
          title="Rating Médio"
          value={parseFloat(String(post.average_rating || 0)).toFixed(1)}
          description="De 5 estrelas"
          icon={Star}
        />
        <MetricsCard
          title="Views Totais"
          value={post.views_count || 0}
          description="Desde a publicação"
          icon={Eye}
        />
      </div>

      {/* Gráficos */}
      <div className="grid gap-4 md:grid-cols-2">
        <UsageChart
          title="Visualizações ao Longo do Tempo"
          description={`Últimos ${dateRange} dias`}
          data={analytics?.dailyData?.map(d => ({ date: d.date, value: d.views_count })) || []}
          type="area"
          dataKey="value"
          xAxisKey="date"
          height={300}
        />

        <UsageChart
          title="Visitantes Únicos"
          description={`Últimos ${dateRange} dias`}
          data={analytics?.dailyData?.map(d => ({ date: d.date, value: d.unique_visitors })) || []}
          type="line"
          dataKey="value"
          xAxisKey="date"
          height={300}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <UsageChart
          title="Tempo Médio de Leitura"
          description="Em segundos por dia"
          data={analytics?.dailyData?.map(d => ({ 
            date: d.date, 
            value: parseFloat(String(d.avg_time_spent || 0))
          })) || []}
          type="bar"
          dataKey="value"
          xAxisKey="date"
          height={300}
        />

        <UsageChart
          title="Taxa de Conclusão"
          description="Percentual de leitura completa"
          data={analytics?.dailyData?.map(d => ({ 
            date: d.date, 
            value: parseFloat(String(d.completion_rate || 0))
          })) || []}
          type="line"
          dataKey="value"
          xAxisKey="date"
          height={300}
        />
      </div>

      {/* Informações do Post */}
      <Card>
        <CardHeader>
          <CardTitle>Informações do Post</CardTitle>
          <CardDescription>Detalhes e metadados</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Autor</p>
              <p className="text-base">{post.author?.nome || 'Desconhecido'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Data de Publicação</p>
              <p className="text-base">
                {post.published_at
                  ? new Date(post.published_at).toLocaleDateString('pt-BR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })
                  : 'Não publicado'}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Tempo de Leitura</p>
              <p className="text-base">{post.read_time_minutes || 0} minutos</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Status</p>
              <p className="text-base capitalize">{post.status}</p>
            </div>
            {post.tags && post.tags.length > 0 && (
              <div className="md:col-span-2">
                <p className="text-sm font-medium text-muted-foreground mb-2">Tags</p>
                <div className="flex flex-wrap gap-2">
                  {post.tags.map((tag: any) => (
                    <span
                      key={tag.id}
                      className="px-2 py-1 text-xs rounded-full bg-primary/10 text-primary"
                    >
                      {tag.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
