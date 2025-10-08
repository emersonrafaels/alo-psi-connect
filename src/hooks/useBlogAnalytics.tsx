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

export const useBlogAnalyticsSummary = (dateRange: number = 30, authorId?: string) => {
  return useQuery({
    queryKey: ['blog-analytics-summary', dateRange, authorId],
    queryFn: async () => {
      const startDate = format(subDays(startOfDay(new Date()), dateRange), 'yyyy-MM-dd');

      // Se authorId fornecido, buscar apenas posts deste autor
      let postsQuery = supabase
        .from('blog_posts')
        .select('id')
        .eq('status', 'published');

      if (authorId) {
        postsQuery = postsQuery.eq('author_id', authorId);
      }

      const { data: authorPosts, error: authorPostsError } = await postsQuery;
      if (authorPostsError) throw authorPostsError;

      const postIds = authorPosts?.map(p => p.id) || [];

      // Buscar analytics apenas dos posts filtrados
      let dailyQuery = supabase
        .from('blog_analytics_daily')
        .select('*')
        .gte('date', startDate);

      if (postIds.length > 0) {
        dailyQuery = dailyQuery.in('post_id', postIds);
      } else if (authorId) {
        // Se é author mas não tem posts, retornar vazio
        return {
          totalPosts: 0,
          totalViews: 0,
          totalUniqueVisitors: 0,
          avgTimeSpent: 0,
          avgCompletionRate: 0,
          totalComments: 0,
          totalRatings: 0,
          avgRating: 0,
        };
      }

      const { data: dailyData, error: dailyError } = await dailyQuery;

      if (dailyError) throw dailyError;

      // Buscar total de posts publicados (filtrados por autor se necessário)
      let totalPostsQuery = supabase
        .from('blog_posts')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'published');

      if (authorId) {
        totalPostsQuery = totalPostsQuery.eq('author_id', authorId);
      }

      const { count: totalPosts, error: postsError } = await totalPostsQuery;

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

      // Buscar total de comentários e ratings (apenas dos posts do autor se filtrado)
      let commentsQuery = supabase
        .from('comments')
        .select('*', { count: 'exact', head: true });

      let ratingsQuery = supabase
        .from('blog_post_ratings')
        .select('*', { count: 'exact', head: true });

      let ratingsDataQuery = supabase
        .from('blog_post_ratings')
        .select('rating');

      if (postIds.length > 0) {
        commentsQuery = commentsQuery.in('post_id', postIds);
        ratingsQuery = ratingsQuery.in('post_id', postIds);
        ratingsDataQuery = ratingsDataQuery.in('post_id', postIds);
      }

      const { count: totalComments } = await commentsQuery;
      const { count: totalRatings } = await ratingsQuery;
      const { data: ratingsData } = await ratingsDataQuery;

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

export const usePostAnalytics = (dateRange: number = 30, limit: number = 10, authorId?: string) => {
  return useQuery({
    queryKey: ['post-analytics', dateRange, limit, authorId],
    queryFn: async () => {
      const startDate = format(subDays(startOfDay(new Date()), dateRange), 'yyyy-MM-dd');

      // Buscar posts do autor se filtrado
      let postsFilter: string[] | undefined;
      if (authorId) {
        const { data: authorPosts } = await supabase
          .from('blog_posts')
          .select('id')
          .eq('author_id', authorId);
        postsFilter = authorPosts?.map(p => p.id) || [];
        if (postsFilter.length === 0) return [];
      }

      let dailyQuery = supabase
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

      if (postsFilter) {
        dailyQuery = dailyQuery.in('post_id', postsFilter);
      }

      const { data: dailyData, error } = await dailyQuery;

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

export const useDailyAnalytics = (dateRange: number = 30, authorId?: string) => {
  return useQuery({
    queryKey: ['daily-analytics', dateRange, authorId],
    queryFn: async () => {
      const startDate = format(subDays(startOfDay(new Date()), dateRange), 'yyyy-MM-dd');

      // Buscar posts do autor se filtrado
      let postsFilter: string[] | undefined;
      if (authorId) {
        const { data: authorPosts } = await supabase
          .from('blog_posts')
          .select('id')
          .eq('author_id', authorId);
        postsFilter = authorPosts?.map(p => p.id) || [];
        if (postsFilter.length === 0) return [];
      }

      let dailyQuery = supabase
        .from('blog_analytics_daily')
        .select('*')
        .gte('date', startDate)
        .order('date', { ascending: true });

      if (postsFilter) {
        dailyQuery = dailyQuery.in('post_id', postsFilter);
      }

      const { data, error } = await dailyQuery;

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
