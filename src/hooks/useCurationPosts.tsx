import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { BlogPost } from './useBlogPosts';

export interface CurationFilters {
  status?: 'published' | 'draft' | 'archived' | 'all';
  badge?: string | 'all';
  featured?: 'yes' | 'no' | 'all';
  searchTerm?: string;
  orderBy?: 'featured_order' | 'views_count' | 'published_at' | 'average_rating' | 'created_at';
  orderDirection?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface CurationStats {
  totalFeatured: number;
  totalWithBadges: number;
  totalPublished: number;
  totalDrafts: number;
  avgViewsFeatured: number;
}

export const useCurationPosts = (filters?: CurationFilters) => {
  return useQuery({
    queryKey: ['curation-posts', filters],
    queryFn: async () => {
      let query = supabase
        .from('blog_posts')
        .select('*, author:profiles!blog_posts_author_id_fkey(id, nome, email, foto_perfil_url)');

      // Apply status filter
      if (filters?.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }

      // Apply badge filter
      if (filters?.badge && filters.badge !== 'all') {
        query = query.eq('editorial_badge', filters.badge as any);
      }

      // Apply featured filter
      if (filters?.featured === 'yes') {
        query = query.eq('is_featured', true);
      } else if (filters?.featured === 'no') {
        query = query.eq('is_featured', false);
      }

      // Apply search
      if (filters?.searchTerm) {
        query = query.or(`title.ilike.%${filters.searchTerm}%,content.ilike.%${filters.searchTerm}%`);
      }

      // Apply ordering
      const orderBy = filters?.orderBy || 'created_at';
      const orderDirection = filters?.orderDirection || 'desc';
      
      if (orderBy === 'featured_order') {
        query = query.order('is_featured', { ascending: false })
                     .order('featured_order', { ascending: orderDirection === 'asc', nullsFirst: false })
                     .order('created_at', { ascending: false });
      } else {
        query = query.order(orderBy, { ascending: orderDirection === 'asc' });
      }

      // Apply pagination
      if (filters?.limit) {
        query = query.range(filters.offset || 0, (filters.offset || 0) + filters.limit - 1);
      }

      const { data, error } = await query;

      if (error) throw error;

      return (data || []).map(post => ({
        ...post,
        author: Array.isArray(post.author) && post.author.length > 0 ? {
          id: post.author[0].id,
          nome: post.author[0].nome,
          email: post.author[0].email,
          foto_perfil_url: post.author[0].foto_perfil_url
        } : null
      })) as BlogPost[];
    }
  });
};

export const useCurationStats = () => {
  return useQuery({
    queryKey: ['curation-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('is_featured, editorial_badge, status, views_count');

      if (error) throw error;

      const stats: CurationStats = {
        totalFeatured: data.filter(p => p.is_featured).length,
        totalWithBadges: data.filter(p => p.editorial_badge).length,
        totalPublished: data.filter(p => p.status === 'published').length,
        totalDrafts: data.filter(p => p.status === 'draft').length,
        avgViewsFeatured: 0
      };

      const featuredPosts = data.filter(p => p.is_featured);
      if (featuredPosts.length > 0) {
        stats.avgViewsFeatured = Math.round(
          featuredPosts.reduce((sum, p) => sum + (p.views_count || 0), 0) / featuredPosts.length
        );
      }

      return stats;
    }
  });
};
