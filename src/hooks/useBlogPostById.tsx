import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { BlogPost } from './useBlogPosts';

export const useBlogPostById = (id: string | undefined) => {
  return useQuery({
    queryKey: ['blog-post-by-id', id],
    queryFn: async () => {
      if (!id) return null;

      const { data, error } = await supabase
        .from('blog_posts')
        .select(`
          *,
          tags:blog_post_tags(
            tag:blog_tags(id, name, slug)
          )
        `)
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;

      // Fetch author separately
      let author;
      
      if (data.custom_author_name) {
        // Custom author takes priority
        author = {
          nome: data.custom_author_name,
          foto_perfil_url: null,
          email: '',
          url: data.custom_author_url
        };
      } else if (data.display_author_id) {
        // Display author (selected user)
        const { data: authorData } = await supabase
          .from('profiles')
          .select('nome, foto_perfil_url, email')
          .eq('user_id', data.display_author_id)
          .single();
        
        author = authorData || { nome: 'Autor não encontrado', foto_perfil_url: null, email: '' };
      } else {
        // Original author (creator)
        const { data: authorData } = await supabase
          .from('profiles')
          .select('nome, foto_perfil_url, email')
          .eq('user_id', data.author_id)
          .single();
        
        author = authorData || { nome: 'Administrador do Sistema', foto_perfil_url: null, email: '' };
      }

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
        author,
        tags: data.tags?.map((t: any) => t.tag).filter(Boolean) || [],
        tenant: tenantData
      } as BlogPost & { 
        author: { nome: string; foto_perfil_url: string | null; email: string; url?: string | null };
        tenant: { id: string; slug: string } | null;
      };
    },
    enabled: !!id,
    staleTime: 0,
    gcTime: 5 * 60 * 1000
  });
};
