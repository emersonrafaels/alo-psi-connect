import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

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
  author?: {
    nome: string;
    foto_perfil_url: string | null;
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
}

export const useBlogPosts = (options: UseBlogPostsOptions = {}) => {
  return useQuery({
    queryKey: ['blog-posts', options],
    queryFn: async () => {
      let query = supabase
        .from('blog_posts')
        .select(`
          *,
          tags:blog_post_tags(
            tag:blog_tags(id, name, slug)
          )
        `);

      if (options.status) {
        query = query.eq('status', options.status);
      }

      if (options.authorId) {
        query = query.eq('author_id', options.authorId);
      }

      if (options.searchTerm) {
        query = query.or(`title.ilike.%${options.searchTerm}%,content.ilike.%${options.searchTerm}%`);
      }

      if (options.tagSlug) {
        query = query.contains('tags', [{ slug: options.tagSlug }]);
      }

      query = query.order('published_at', { ascending: false, nullsFirst: false });

      if (options.limit) {
        query = query.limit(options.limit);
      }

      if (options.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Fetch authors for all posts
      const posts = data || [];
      const authorIds = [...new Set(posts.map(p => p.author_id))];
      
      const { data: authorsData } = await supabase
        .from('profiles')
        .select('user_id, nome, foto_perfil_url')
        .in('user_id', authorIds);

      const authorsMap = new Map(authorsData?.map(a => [a.user_id, a]) || []);

      return posts.map((post: any) => ({
        ...post,
        author: authorsMap.get(post.author_id) || undefined,
        tags: post.tags?.map((t: any) => t.tag).filter(Boolean) || []
      })) as BlogPost[];
    }
  });
};
