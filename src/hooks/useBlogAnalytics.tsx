import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { startOfDay, subDays, format } from 'date-fns';

export interface BlogAnalyticsSummary {
  totalPosts: number;
  totalViews: number;
  totalUniqueVisitors: number;
  avgTimeSpent: number;
  avgCompletionRate: number;
  totalComments: number;
  totalRatings: number;
  avgRating: number;
}

export interface PostAnalytics {
  postId: string;
  postTitle: string;
  postSlug: string;
  totalViews: number;
  uniqueVisitors: number;
  avgTimeSpent: number;
  completionRate: number;
  commentsCount: number;
  ratingsCount: number;
  avgRating: number;
  trend: number;
}

export interface DailyAnalytics {
  date: string;
  views: number;
  uniqueVisitors: number;
  avgTimeSpent: number;
  completionRate: number;
}

export const useBlogAnalyticsSummary = (dateRange: number = 30) => {
  return useQuery({
    queryKey: ['blog-analytics-summary', dateRange],
    queryFn: async () => {
      const startDate = format(subDays(startOfDay(new Date()), dateRange), 'yyyy-MM-dd');

      // Buscar analytics diários
      const { data: dailyData, error: dailyError } = await supabase
        .from('blog_analytics_daily')
        .select('*')
        .gte('date', startDate);

      if (dailyError) throw dailyError;

      // Buscar total de posts publicados
      const { count: totalPosts, error: postsError } = await supabase
        .from('blog_posts')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'published');

      if (postsError) throw postsError;

      // Calcular métricas agregadas
      const totalViews = dailyData?.reduce((sum, day) => sum + day.views_count, 0) || 0;
      const totalUniqueVisitors = dailyData?.reduce((sum, day) => sum + day.unique_visitors, 0) || 0;
      const avgTimeSpent = dailyData?.length
        ? dailyData.reduce((sum, day) => sum + parseFloat(String(day.avg_time_spent || 0)), 0) / dailyData.length
        : 0;
      const avgCompletionRate = dailyData?.length
        ? dailyData.reduce((sum, day) => sum + parseFloat(String(day.completion_rate || 0)), 0) / dailyData.length
        : 0;

      // Buscar total de comentários e ratings
      const { count: totalComments } = await supabase
        .from('comments')
        .select('*', { count: 'exact', head: true });

      const { count: totalRatings } = await supabase
        .from('blog_post_ratings')
        .select('*', { count: 'exact', head: true });

      const { data: ratingsData } = await supabase
        .from('blog_post_ratings')
        .select('rating');

      const avgRating = ratingsData?.length
        ? ratingsData.reduce((sum, r) => sum + r.rating, 0) / ratingsData.length
        : 0;

      return {
        totalPosts: totalPosts || 0,
        totalViews,
        totalUniqueVisitors,
        avgTimeSpent: Math.round(avgTimeSpent),
        avgCompletionRate: Math.round(avgCompletionRate * 100) / 100,
        totalComments: totalComments || 0,
        totalRatings: totalRatings || 0,
        avgRating: Math.round(avgRating * 100) / 100,
      } as BlogAnalyticsSummary;
    },
  });
};

export const usePostAnalytics = (dateRange: number = 30, limit: number = 10) => {
  return useQuery({
    queryKey: ['post-analytics', dateRange, limit],
    queryFn: async () => {
      const startDate = format(subDays(startOfDay(new Date()), dateRange), 'yyyy-MM-dd');

      const { data: dailyData, error } = await supabase
        .from('blog_analytics_daily')
        .select(`
          post_id,
          views_count,
          unique_visitors,
          avg_time_spent,
          completion_rate,
          date
        `)
        .gte('date', startDate);

      if (error) throw error;

      // Agrupar por post
      const postMetrics: Record<string, any> = {};
      dailyData?.forEach((day) => {
        if (!postMetrics[day.post_id]) {
          postMetrics[day.post_id] = {
            totalViews: 0,
            uniqueVisitors: 0,
            totalTimeSpent: 0,
            totalCompletionRate: 0,
            daysCount: 0,
          };
        }
        postMetrics[day.post_id].totalViews += day.views_count;
        postMetrics[day.post_id].uniqueVisitors += day.unique_visitors;
        postMetrics[day.post_id].totalTimeSpent += parseFloat(String(day.avg_time_spent || 0));
        postMetrics[day.post_id].totalCompletionRate += parseFloat(String(day.completion_rate || 0));
        postMetrics[day.post_id].daysCount += 1;
      });

      // Buscar informações dos posts
      const postIds = Object.keys(postMetrics);
      const { data: posts, error: postsError } = await supabase
        .from('blog_posts')
        .select('id, title, slug, comments_count, ratings_count, average_rating')
        .in('id', postIds);

      if (postsError) throw postsError;

      const analytics: PostAnalytics[] = posts?.map((post) => {
        const metrics = postMetrics[post.id];
        return {
          postId: post.id,
          postTitle: post.title,
          postSlug: post.slug,
          totalViews: metrics.totalViews,
          uniqueVisitors: metrics.uniqueVisitors,
          avgTimeSpent: Math.round(metrics.totalTimeSpent / metrics.daysCount),
          completionRate: Math.round((metrics.totalCompletionRate / metrics.daysCount) * 100) / 100,
          commentsCount: post.comments_count || 0,
          ratingsCount: post.ratings_count || 0,
          avgRating: parseFloat(String(post.average_rating || 0)),
          trend: 0, // TODO: calcular trend comparando com período anterior
        };
      }) || [];

      return analytics.sort((a, b) => b.totalViews - a.totalViews).slice(0, limit);
    },
  });
};

export const useDailyAnalytics = (dateRange: number = 30) => {
  return useQuery({
    queryKey: ['daily-analytics', dateRange],
    queryFn: async () => {
      const startDate = format(subDays(startOfDay(new Date()), dateRange), 'yyyy-MM-dd');

      const { data, error } = await supabase
        .from('blog_analytics_daily')
        .select('*')
        .gte('date', startDate)
        .order('date', { ascending: true });

      if (error) throw error;

      // Agrupar por data
      const dailyMetrics: Record<string, any> = {};
      data?.forEach((day) => {
        if (!dailyMetrics[day.date]) {
          dailyMetrics[day.date] = {
            views: 0,
            uniqueVisitors: 0,
            totalTimeSpent: 0,
            totalCompletionRate: 0,
            count: 0,
          };
        }
        dailyMetrics[day.date].views += day.views_count;
        dailyMetrics[day.date].uniqueVisitors += day.unique_visitors;
        dailyMetrics[day.date].totalTimeSpent += parseFloat(String(day.avg_time_spent || 0));
        dailyMetrics[day.date].totalCompletionRate += parseFloat(String(day.completion_rate || 0));
        dailyMetrics[day.date].count += 1;
      });

      const analytics: DailyAnalytics[] = Object.entries(dailyMetrics).map(([date, metrics]: [string, any]) => ({
        date,
        views: metrics.views,
        uniqueVisitors: metrics.uniqueVisitors,
        avgTimeSpent: Math.round(metrics.totalTimeSpent / metrics.count),
        completionRate: Math.round((metrics.totalCompletionRate / metrics.count) * 100) / 100,
      }));

      return analytics;
    },
  });
};
