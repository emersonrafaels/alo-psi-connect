import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { BlogPost } from './useBlogPosts';

export const useBlogPostBySlugWithoutTenantFilter = (slug: string | undefined) => {
  return useQuery({
    queryKey: ['blog-post-slug-no-tenant', slug],
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
        .eq('status', 'published')
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;

      // Fetch author separately
      const { data: authorData } = await supabase
        .from('profiles')
        .select('nome, foto_perfil_url, email')
        .eq('user_id', data.author_id)
        .single();

      // Fetch tenant data if tenant_id exists
      let tenantData = null;
      if (data.tenant_id) {
        const { data: tenant } = await supabase
          .from('tenants')
          .select('id, slug')
          .eq('id', data.tenant_id)
          .single();
        tenantData = tenant;
      }

      return {
        ...data,
        author: authorData || { nome: 'Administrador do Sistema', foto_perfil_url: null, email: '' },
        tags: data.tags?.map((t: any) => t.tag).filter(Boolean) || [],
        tenant: tenantData
      } as BlogPost & { 
        author: { nome: string; foto_perfil_url: string | null; email: string };
        tenant: { id: string; slug: string } | null;
      };
    },
    enabled: !!slug,
    staleTime: 0,
    gcTime: 5 * 60 * 1000
  });
};
