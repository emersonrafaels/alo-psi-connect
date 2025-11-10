import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { BlogPost } from './useBlogPosts';
import { useTenant } from './useTenant';

export const useBlogPost = (slug: string | undefined) => {
  const queryClient = useQueryClient();
  const { tenant } = useTenant();

  const query = useQuery({
    queryKey: ['blog-post', slug, tenant?.id],
    queryFn: async () => {
      console.log('[useBlogPost] 🔍 Fetching post:', slug);
      console.log('[useBlogPost] 🔍 Using tenant:', tenant?.slug, 'ID:', tenant?.id);
      
      if (!slug || !tenant) {
        console.log('[useBlogPost] ❌ Missing slug or tenant, skipping fetch');
        return null;
      }

      const { data, error } = await supabase
        .from('blog_posts')
        .select(`
          *,
          tags:blog_post_tags(
            tag:blog_tags(id, name, slug)
          )
        `)
        .eq('slug', slug)
        .eq('status', 'published')
        .or(`tenant_id.eq.${tenant.id},tenant_id.is.null`)
        .maybeSingle();

      console.log('[useBlogPost]', data ? '✅ FOUND' : '❌ NOT FOUND');
      console.log('[useBlogPost] 🔍 Query tenant filter:', tenant.id);

      if (error) {
        console.error('[useBlogPost] ❌ Query error:', error);
        throw error;
      }
      if (!data) {
        console.log('[useBlogPost] ℹ️ No post found with current filters');
        return null;
      }

      // Fetch author separately
      const { data: authorData } = await supabase
        .from('profiles')
        .select('nome, foto_perfil_url, email')
        .eq('user_id', data.author_id)
        .single();

      return {
        ...data,
        author: authorData || { nome: 'Administrador do Sistema', foto_perfil_url: null, email: '' },
        tags: data.tags?.map((t: any) => t.tag).filter(Boolean) || []
      } as BlogPost & { author: { nome: string; foto_perfil_url: string | null; email: string } };
    },
    enabled: !!slug && !!tenant,
    staleTime: 0,
    gcTime: 5 * 60 * 1000
  });

  const incrementViews = useMutation({
    mutationFn: async (postSlug: string) => {
      const { error } = await supabase.rpc('increment_post_views', {
        post_slug: postSlug
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blog-post', slug] });
    }
  });

  return { ...query, incrementViews };
};
