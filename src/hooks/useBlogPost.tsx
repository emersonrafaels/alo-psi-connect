import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { BlogPost } from './useBlogPosts';

export const useBlogPost = (slug: string | undefined) => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['blog-post', slug],
    queryFn: async () => {
      if (!slug) return null;

      const { data, error } = await supabase
        .from('blog_posts')
        .select(`
          *,
          tags:blog_post_tags(
            tag:blog_tags(id, name, slug)
          )
        `)
        .eq('slug', slug)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;

      // Fetch author separately
      const { data: authorData } = await supabase
        .from('profiles')
        .select('nome, foto_perfil_url, email')
        .eq('user_id', data.author_id)
        .single();

      return {
        ...data,
        author: authorData || { nome: 'Autor Desconhecido', foto_perfil_url: null, email: '' },
        tags: data.tags?.map((t: any) => t.tag).filter(Boolean) || []
      } as BlogPost & { author: { nome: string; foto_perfil_url: string | null; email: string } };
    },
    enabled: !!slug
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
