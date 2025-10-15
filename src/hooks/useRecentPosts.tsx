import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/hooks/useTenant';
import { BlogPost } from './useBlogPosts';

export const useRecentPosts = (limit: number = 5) => {
  const { tenant } = useTenant();

  return useQuery({
    queryKey: ['recent-blog-posts', tenant?.id, limit],
    queryFn: async () => {
      if (!tenant) return [];

      const { data, error } = await supabase
        .from('blog_posts')
        .select(`
          *,
          tags:blog_post_tags(
            tag:blog_tags(id, name, slug)
          )
        `)
        .eq('status', 'published')
        .or(`tenant_id.eq.${tenant.id},tenant_id.is.null`)
        .order('published_at', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      const posts = data || [];
      const authorIds = [...new Set(posts.map(p => p.author_id))];
      
      const { data: authorsData } = await supabase
        .from('profiles')
        .select('user_id, nome, foto_perfil_url')
        .in('user_id', authorIds);

      const authorsMap = new Map(authorsData?.map(a => [a.user_id, a]) || []);

      return posts.map((post: any) => ({
        ...post,
        author: authorsMap.get(post.author_id) || { 
          user_id: post.author_id,
          nome: 'Administrador do Sistema', 
          foto_perfil_url: null 
        },
        tags: post.tags?.map((t: any) => t.tag).filter(Boolean) || []
      })) as BlogPost[];
    },
    enabled: !!tenant
  });
};
