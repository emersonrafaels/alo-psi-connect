import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/hooks/useTenant';
import { getRelevanceScore } from '@/utils/highlightHelpers';

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  featured_image_url: string | null;
  author_id: string;
  status: 'draft' | 'published' | 'archived';
  published_at: string | null;
  read_time_minutes: number | null;
  views_count: number;
  created_at: string;
  updated_at: string;
  allow_comments?: boolean;
  comments_count?: number;
  allow_ratings?: boolean;
  average_rating?: number;
  ratings_count?: number;
  is_featured?: boolean;
  featured_order?: number | null;
  editorial_badge?: string | null;
  badge_expires_at?: string | null;
  custom_author_name?: string | null;
  custom_author_url?: string | null;
  display_author_id?: string | null;
  author?: {
    id?: string;
    nome: string;
    email?: string;
    foto_perfil_url: string | null;
    url?: string | null;
  };
  tags?: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
}

interface UseBlogPostsOptions {
  status?: string;
  authorId?: string;
  searchTerm?: string;
  tagSlug?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'recent' | 'views' | 'read-time' | 'rating' | 'relevance';
  ignoreTenantIsolation?: boolean;
}

export const useBlogPosts = (options: UseBlogPostsOptions = {}) => {
  const { tenant } = useTenant();

  return useQuery({
    queryKey: ['blog-posts', options, tenant?.id],
    queryFn: async () => {
      if (!options.ignoreTenantIsolation && !tenant) return [];

      let query = supabase
        .from('blog_posts')
        .select(`
          *,
          tags:blog_post_tags(
            tag:blog_tags(id, name, slug)
          )
        `);
      
      // Aplicar filtro de tenant apenas se não for para ignorar
      if (!options.ignoreTenantIsolation && tenant) {
        query = query.or(`tenant_id.eq.${tenant.id},tenant_id.is.null`);
      }

      if (options.status) {
        query = query.eq('status', options.status);
      }

      if (options.authorId) {
        query = query.eq('author_id', options.authorId);
      }

      if (options.searchTerm) {
        query = query.or(`title.ilike.%${options.searchTerm}%,content.ilike.%${options.searchTerm}%,excerpt.ilike.%${options.searchTerm}%`);
      }

      // Ordenação baseada no sortBy
      const sortBy = options.sortBy || 'recent';
      
      if (sortBy === 'recent') {
        query = query.order('published_at', { ascending: false, nullsFirst: false })
          .order('created_at', { ascending: false });
      } else if (sortBy === 'views') {
        query = query.order('views_count', { ascending: false });
      } else if (sortBy === 'read-time') {
        query = query.order('read_time_minutes', { ascending: true, nullsFirst: false });
      } else if (sortBy === 'rating') {
        query = query.order('average_rating', { ascending: false, nullsFirst: false })
          .order('ratings_count', { ascending: false });
      }
      // relevance sorting is done client-side after fetching

      if (options.limit) {
        query = query.limit(options.limit);
      }

      if (options.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Fetch authors for all posts
      let posts = data || [];
      
      // Filter by tag client-side (includes tag name in search)
      if (options.tagSlug) {
        posts = posts.filter(post => 
          post.tags?.some((tagRelation: any) => tagRelation.tag?.slug === options.tagSlug)
        );
      }
      
      // Also search in tags if searchTerm exists
      if (options.searchTerm) {
        const term = options.searchTerm.toLowerCase();
        posts = posts.filter(post => {
          const titleMatch = post.title?.toLowerCase().includes(term);
          const contentMatch = post.content?.toLowerCase().includes(term);
          const excerptMatch = post.excerpt?.toLowerCase().includes(term);
          const tagMatch = post.tags?.some((tagRelation: any) => 
            tagRelation.tag?.name?.toLowerCase().includes(term)
          );
          
          return titleMatch || contentMatch || excerptMatch || tagMatch;
        });
      }
      
      // Collect all unique author IDs (both author_id and display_author_id)
      const authorIds = [...new Set(posts.flatMap(p => [
        p.author_id, 
        p.display_author_id
      ].filter(Boolean)))];
      
      const { data: authorsData } = await supabase
        .from('profiles')
        .select('user_id, nome, foto_perfil_url')
        .in('user_id', authorIds);

      const authorsMap = new Map(authorsData?.map(a => [a.user_id, a]) || []);

      let processedPosts = posts.map((post: any) => {
        // Determine which author to display
        let author;
        
        if (post.custom_author_name) {
          // Custom author takes priority
          author = {
            nome: post.custom_author_name,
            foto_perfil_url: null,
            url: post.custom_author_url
          };
        } else if (post.display_author_id) {
          // Display author (selected user)
          author = authorsMap.get(post.display_author_id) || {
            user_id: post.display_author_id,
            nome: 'Autor não encontrado',
            foto_perfil_url: null
          };
        } else {
          // Original author (creator)
          author = authorsMap.get(post.author_id) || { 
            user_id: post.author_id,
            nome: 'Administrador do Sistema', 
            foto_perfil_url: null 
          };
        }

        return {
          ...post,
          author,
          tags: post.tags?.map((t: any) => t.tag).filter(Boolean) || []
        };
      }) as BlogPost[];
      
      // Sort by relevance if needed (client-side)
      if (options.sortBy === 'relevance' && options.searchTerm) {
        processedPosts = processedPosts.sort((a, b) => {
          const scoreA = getRelevanceScore(a, options.searchTerm!);
          const scoreB = getRelevanceScore(b, options.searchTerm!);
          return scoreB - scoreA;
        });
      }
      
      return processedPosts;
    },
    enabled: options.ignoreTenantIsolation ? true : !!tenant
  });
};
