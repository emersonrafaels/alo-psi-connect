import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, subDays, startOfDay } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Eye, Users, TrendingUp, FileText, Star, MessageCircle } from 'lucide-react';

interface AuthorAnalyticsProps {
  dateRange: number;
}

interface AuthorMetrics {
  authorId: string;
  authorName: string;
  authorPhoto: string | null;
  totalPosts: number;
  totalViews: number;
  uniqueVisitors: number;
  avgRating: number;
  totalComments: number;
  avgTimeSpent: number;
  completionRate: number;
}

export const AuthorAnalytics = ({ dateRange }: AuthorAnalyticsProps) => {
  const { data: authorMetrics, isLoading } = useQuery({
    queryKey: ['author-analytics', dateRange],
    queryFn: async () => {
      const startDate = format(subDays(startOfDay(new Date()), dateRange), 'yyyy-MM-dd');

      // Fetch all analytics data
      const { data: analyticsData, error } = await supabase
        .from('blog_analytics_daily')
        .select(`
          post_id,
          views_count,
          unique_visitors,
          avg_time_spent,
          completion_rate,
          post:blog_posts(
            id,
            author_id,
            comments_count,
            ratings_count,
            average_rating
          )
        `)
        .gte('date', startDate);

      if (error) throw error;

      // Collect unique author IDs
      const authorIds = new Set<string>();
      analyticsData?.forEach((day: any) => {
        if (day.post?.author_id) {
          authorIds.add(day.post.author_id);
        }
      });

      // Fetch author profiles
      const { data: authorsData } = await supabase
        .from('profiles')
        .select('user_id, nome, foto_perfil_url')
        .in('user_id', Array.from(authorIds));

      // Create author lookup map
      const authorLookup = new Map();
      authorsData?.forEach(author => {
        authorLookup.set(author.user_id, {
          nome: author.nome,
          foto_perfil_url: author.foto_perfil_url
        });
      });

      // Group by author
      const authorMap = new Map<string, AuthorMetrics>();

      analyticsData?.forEach((day: any) => {
        if (!day.post?.author_id) return;

        const authorId = day.post.author_id;
        const authorInfo = authorLookup.get(authorId);
        const authorName = authorInfo?.nome || 'Administrador do Sistema';
        const authorPhoto = authorInfo?.foto_perfil_url;

        if (!authorMap.has(authorId)) {
          authorMap.set(authorId, {
            authorId,
            authorName,
            authorPhoto,
            totalPosts: 0,
            totalViews: 0,
            uniqueVisitors: 0,
            avgRating: 0,
            totalComments: 0,
            avgTimeSpent: 0,
            completionRate: 0,
          });
        }

        const metrics = authorMap.get(authorId)!;
        metrics.totalViews += day.views_count || 0;
        metrics.uniqueVisitors += day.unique_visitors || 0;
        metrics.avgTimeSpent += parseFloat(String(day.avg_time_spent || 0));
        metrics.completionRate += parseFloat(String(day.completion_rate || 0));
      });

      // Calculate post counts and ratings per author
      const { data: postCounts } = await supabase
        .from('blog_posts')
        .select('author_id, comments_count, ratings_count, average_rating')
        .eq('status', 'published')
        .not('author_id', 'is', null);

      postCounts?.forEach((post: any) => {
        const metrics = authorMap.get(post.author_id);
        if (metrics) {
          metrics.totalPosts += 1;
          metrics.totalComments += post.comments_count || 0;
          if (post.ratings_count > 0) {
            metrics.avgRating += (post.average_rating || 0) * post.ratings_count;
          }
        }
      });

      // Calculate averages
      const result: AuthorMetrics[] = Array.from(authorMap.values()).map(metrics => {
        const totalDays = Math.max(metrics.totalViews, 1);
        return {
          ...metrics,
          avgTimeSpent: Math.round(metrics.avgTimeSpent / totalDays),
          completionRate: Math.round((metrics.completionRate / totalDays) * 100) / 100,
          avgRating: metrics.totalComments > 0 
            ? Math.round((metrics.avgRating / metrics.totalComments) * 10) / 10 
            : 0,
        };
      });

      // Sort by total views
      return result.sort((a, b) => b.totalViews - a.totalViews);
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Analytics por Autor</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-muted rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!authorMetrics || authorMetrics.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Analytics por Autor</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-3 opacity-20" />
            <p>Nenhum dado de autor disponível</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Ranking de Autores</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {authorMetrics.map((author, index) => (
              <div 
                key={author.authorId} 
                className="flex items-center gap-4 p-4 border rounded-lg hover:bg-accent/50 transition-colors"
              >
                {/* Rank Badge */}
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary font-bold">
                  {index + 1}
                </div>

                {/* Author Info */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Avatar>
                    <AvatarImage src={author.authorPhoto || undefined} />
                    <AvatarFallback>{author.authorName[0]?.toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <h3 className="font-semibold truncate">{author.authorName}</h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <FileText className="h-3 w-3" />
                        {author.totalPosts} posts
                      </span>
                    </div>
                  </div>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                      <Eye className="h-3 w-3" />
                      <span className="text-xs">Views</span>
                    </div>
                    <div className="font-bold">{author.totalViews.toLocaleString()}</div>
                  </div>

                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                      <Users className="h-3 w-3" />
                      <span className="text-xs">Únicos</span>
                    </div>
                    <div className="font-bold">{author.uniqueVisitors.toLocaleString()}</div>
                  </div>

                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                      <Star className="h-3 w-3" />
                      <span className="text-xs">Rating</span>
                    </div>
                    <div className="font-bold">{author.avgRating.toFixed(1)}</div>
                  </div>

                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                      <MessageCircle className="h-3 w-3" />
                      <span className="text-xs">Coments</span>
                    </div>
                    <div className="font-bold">{author.totalComments}</div>
                  </div>
                </div>

                {/* Top Author Badge */}
                {index === 0 && (
                  <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    Top
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
