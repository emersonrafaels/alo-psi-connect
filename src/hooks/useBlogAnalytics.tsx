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
  isRealTime?: boolean;
  trends?: {
    totalPosts?: number;
    totalViews?: number;
    totalUniqueVisitors?: number;
    avgTimeSpent?: number;
    avgCompletionRate?: number;
    totalComments?: number;
    totalRatings?: number;
    avgRating?: number;
  };
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

// Helper function to calculate trend percentage
const calculateTrend = (current: number, previous: number): number => {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
};

export const useBlogAnalyticsSummary = (
  dateRange: number = 30, 
  authorId?: string,
  tagSlug?: string,
  featuredStatus: 'all' | 'featured' | 'normal' = 'all'
) => {
  return useQuery({
    queryKey: ['blog-analytics-summary', dateRange, authorId, tagSlug, featuredStatus],
    queryFn: async () => {
      const startDate = format(subDays(startOfDay(new Date()), dateRange), 'yyyy-MM-dd');
      
      // Calculate previous period dates
      const prevEndDate = format(subDays(startOfDay(new Date()), dateRange + 1), 'yyyy-MM-dd');
      const prevStartDate = format(subDays(startOfDay(new Date()), dateRange * 2), 'yyyy-MM-dd');

      // Build post query with filters
      let postsQuery = supabase
        .from('blog_posts')
        .select('id, blog_post_tags(tag_id)')
        .eq('status', 'published');

      if (authorId) {
        postsQuery = postsQuery.eq('author_id', authorId);
      }

      if (featuredStatus === 'featured') {
        postsQuery = postsQuery.eq('is_featured', true);
      } else if (featuredStatus === 'normal') {
        postsQuery = postsQuery.eq('is_featured', false);
      }

      const { data: authorPosts, error: authorPostsError } = await postsQuery;
      if (authorPostsError) throw authorPostsError;

      // Filter by tag if provided
      let postIds = authorPosts?.map(p => p.id) || [];
      
      if (tagSlug && authorPosts) {
        const { data: tag } = await supabase
          .from('blog_tags')
          .select('id')
          .eq('slug', tagSlug)
          .single();
        
        if (tag) {
          postIds = authorPosts
            .filter((p: any) => p.blog_post_tags?.some((t: any) => t.tag_id === tag.id))
            .map(p => p.id);
        }
      }

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

      // Fetch previous period data for trend calculation
      let prevDailyQuery = supabase
        .from('blog_analytics_daily')
        .select('*')
        .gte('date', prevStartDate)
        .lte('date', prevEndDate);

      if (postIds.length > 0) {
        prevDailyQuery = prevDailyQuery.in('post_id', postIds);
      }

      const { data: prevDailyData } = await prevDailyQuery;

      // FALLBACK: Se blog_analytics_daily estiver vazio, calcular em tempo real
      if (!dailyData || dailyData.length === 0) {
        console.log('[Analytics] Usando dados em tempo real - blog_analytics_daily vazio');
        
        let trackingQuery = supabase
          .from('blog_post_views_tracking')
          .select('*')
          .gte('viewed_at', startDate);

        if (postIds.length > 0) {
          trackingQuery = trackingQuery.in('post_id', postIds);
        }

        const { data: trackingData } = await trackingQuery;

        // Se não há dados nem agregados nem em tempo real, retornar zeros
        if (!trackingData || trackingData.length === 0) {
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

        // Apenas marcar como tempo real se houver dados em tempo real mas não agregados
        const uniqueVisitors = new Set(trackingData.map(t => t.session_id)).size;
        const totalTimeSpent = trackingData.reduce((sum, t) => sum + (t.time_spent || 0), 0);
        const completedCount = trackingData.filter(t => t.completed_reading).length;

        // Buscar total de posts
        let totalPostsQuery = supabase
          .from('blog_posts')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'published');

        if (authorId) {
          totalPostsQuery = totalPostsQuery.eq('author_id', authorId);
        }

        const { count: totalPosts } = await totalPostsQuery;

        // Buscar comentários e ratings
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
          totalViews: trackingData.length,
          totalUniqueVisitors: uniqueVisitors,
          avgTimeSpent: Math.round(totalTimeSpent / trackingData.length),
          avgCompletionRate: Math.round((completedCount / trackingData.length) * 100 * 100) / 100,
          totalComments: totalComments || 0,
          totalRatings: totalRatings || 0,
          avgRating: Math.round(avgRating * 100) / 100,
          isRealTime: true, // Flag para indicar que está usando dados em tempo real
        } as BlogAnalyticsSummary & { isRealTime?: boolean };
      }

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

      // Calculate previous period metrics
      let prevTrends: BlogAnalyticsSummary['trends'] | undefined;
      
      if (prevDailyData && prevDailyData.length > 0) {
        const prevTotalViews = prevDailyData.reduce((sum, day) => sum + day.views_count, 0);
        const prevTotalUniqueVisitors = prevDailyData.reduce((sum, day) => sum + day.unique_visitors, 0);
        const prevAvgTimeSpent = prevDailyData.length
          ? prevDailyData.reduce((sum, day) => sum + parseFloat(String(day.avg_time_spent || 0)), 0) / prevDailyData.length
          : 0;
        const prevAvgCompletionRate = prevDailyData.length
          ? prevDailyData.reduce((sum, day) => sum + parseFloat(String(day.completion_rate || 0)), 0) / prevDailyData.length
          : 0;

        // For comments/ratings, we need to query the previous period
        let prevCommentsQuery = supabase
          .from('comments')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', prevStartDate)
          .lte('created_at', prevEndDate);

        let prevRatingsQuery = supabase
          .from('blog_post_ratings')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', prevStartDate)
          .lte('created_at', prevEndDate);

        let prevRatingsDataQuery = supabase
          .from('blog_post_ratings')
          .select('rating')
          .gte('created_at', prevStartDate)
          .lte('created_at', prevEndDate);

        if (postIds.length > 0) {
          prevCommentsQuery = prevCommentsQuery.in('post_id', postIds);
          prevRatingsQuery = prevRatingsQuery.in('post_id', postIds);
          prevRatingsDataQuery = prevRatingsDataQuery.in('post_id', postIds);
        }

        const { count: prevTotalComments } = await prevCommentsQuery;
        const { count: prevTotalRatings } = await prevRatingsQuery;
        const { data: prevRatingsData } = await prevRatingsDataQuery;

        const prevAvgRating = prevRatingsData?.length
          ? prevRatingsData.reduce((sum, r) => sum + r.rating, 0) / prevRatingsData.length
          : 0;

        prevTrends = {
          totalViews: calculateTrend(totalViews, prevTotalViews),
          totalUniqueVisitors: calculateTrend(totalUniqueVisitors, prevTotalUniqueVisitors),
          avgTimeSpent: calculateTrend(Math.round(avgTimeSpent), Math.round(prevAvgTimeSpent)),
          avgCompletionRate: calculateTrend(
            Math.round(avgCompletionRate * 100) / 100,
            Math.round(prevAvgCompletionRate * 100) / 100
          ),
          totalComments: calculateTrend(totalComments || 0, prevTotalComments || 0),
          totalRatings: calculateTrend(totalRatings || 0, prevTotalRatings || 0),
          avgRating: calculateTrend(
            Math.round(avgRating * 100) / 100,
            Math.round(prevAvgRating * 100) / 100
          ),
        };
      }

      return {
        totalPosts: totalPosts || 0,
        totalViews,
        totalUniqueVisitors,
        avgTimeSpent: Math.round(avgTimeSpent),
        avgCompletionRate: Math.round(avgCompletionRate * 100) / 100,
        totalComments: totalComments || 0,
        totalRatings: totalRatings || 0,
        avgRating: Math.round(avgRating * 100) / 100,
        trends: prevTrends,
      } as BlogAnalyticsSummary;
    },
  });
};

export const usePostAnalytics = (
  dateRange: number = 30, 
  limit: number = 10, 
  authorId?: string,
  tagSlug?: string,
  featuredStatus: 'all' | 'featured' | 'normal' = 'all'
) => {
  return useQuery({
    queryKey: ['post-analytics', dateRange, limit, authorId, tagSlug, featuredStatus],
    queryFn: async () => {
      const startDate = format(subDays(startOfDay(new Date()), dateRange), 'yyyy-MM-dd');

      // Build post query with filters
      let postsFilterQuery = supabase
        .from('blog_posts')
        .select('id, blog_post_tags(tag_id)')
        .eq('status', 'published');
        
      if (authorId) {
        postsFilterQuery = postsFilterQuery.eq('author_id', authorId);
      }

      if (featuredStatus === 'featured') {
        postsFilterQuery = postsFilterQuery.eq('is_featured', true);
      } else if (featuredStatus === 'normal') {
        postsFilterQuery = postsFilterQuery.eq('is_featured', false);
      }

      const { data: authorPosts } = await postsFilterQuery;
      
      let postsFilter = authorPosts?.map(p => p.id) || [];
      
      // Filter by tag if provided
      if (tagSlug && authorPosts) {
        const { data: tag } = await supabase
          .from('blog_tags')
          .select('id')
          .eq('slug', tagSlug)
          .single();
        
        if (tag) {
          postsFilter = authorPosts
            .filter((p: any) => p.blog_post_tags?.some((t: any) => t.tag_id === tag.id))
            .map(p => p.id);
        }
      }
      
      if (postsFilter.length === 0) return [];

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

export const useDailyAnalytics = (
  dateRange: number = 30, 
  authorId?: string,
  tagSlug?: string,
  featuredStatus: 'all' | 'featured' | 'normal' = 'all'
) => {
  return useQuery({
    queryKey: ['daily-analytics', dateRange, authorId, tagSlug, featuredStatus],
    queryFn: async () => {
      const startDate = format(subDays(startOfDay(new Date()), dateRange), 'yyyy-MM-dd');

      // Build post query with filters
      let postsFilterQuery = supabase
        .from('blog_posts')
        .select('id, blog_post_tags(tag_id)')
        .eq('status', 'published');
        
      if (authorId) {
        postsFilterQuery = postsFilterQuery.eq('author_id', authorId);
      }

      if (featuredStatus === 'featured') {
        postsFilterQuery = postsFilterQuery.eq('is_featured', true);
      } else if (featuredStatus === 'normal') {
        postsFilterQuery = postsFilterQuery.eq('is_featured', false);
      }

      const { data: authorPosts } = await postsFilterQuery;
      
      let postsFilter = authorPosts?.map(p => p.id) || [];
      
      // Filter by tag if provided
      if (tagSlug && authorPosts) {
        const { data: tag } = await supabase
          .from('blog_tags')
          .select('id')
          .eq('slug', tagSlug)
          .single();
        
        if (tag) {
          postsFilter = authorPosts
            .filter((p: any) => p.blog_post_tags?.some((t: any) => t.tag_id === tag.id))
            .map(p => p.id);
        }
      }
      
      if (postsFilter.length === 0) return [];

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
