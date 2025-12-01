import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { useTenant } from '@/hooks/useTenant';

interface CreatePostData {
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  featured_image_url?: string;
  status: 'draft' | 'published';
  read_time_minutes?: number;
  tags?: string[];
  allow_comments?: boolean;
  allow_ratings?: boolean;
  tenant_id?: string;
  is_featured?: boolean;
  featured_order?: number;
  editorial_badge?: string;
  display_author_id?: string | null;
  custom_author_name?: string | null;
  custom_author_url?: string | null;
}

interface UpdatePostData extends CreatePostData {
  id: string;
}

export const useBlogPostManager = () => {
  const { tenant: contextTenant } = useTenant();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const createPost = useMutation({
    mutationFn: async (data: CreatePostData) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Não autenticado');

      // Determinar qual tenant usar: selecionado explicitamente ou do contexto
      let tenantId: string;

      if (data.tenant_id) {
        // Usuário selecionou um tenant específico
        tenantId = data.tenant_id;
      } else if (contextTenant) {
        // Usar tenant do contexto (detectado pela URL)
        tenantId = contextTenant.id;
      } else {
        throw new Error('Nenhum tenant disponível. Por favor, selecione um site ou acesse via URL de um tenant.');
      }

      // Validar slug único por tenant (apenas posts publicados - drafts podem ter slugs duplicados)
      const { data: existingPost } = await supabase
        .from('blog_posts')
        .select('id')
        .eq('slug', data.slug)
        .eq('status', 'published') // Só verificar contra posts publicados
        .or(`tenant_id.eq.${tenantId},tenant_id.is.null`) // Verificar no mesmo tenant ou posts sem tenant
        .maybeSingle();

      if (existingPost) {
        throw new Error('Já existe um post com este slug. Por favor, escolha outro.');
      }

      const { data: post, error } = await supabase
        .from('blog_posts')
        .insert({
          title: data.title,
          slug: data.slug,
          excerpt: data.excerpt,
          content: data.content,
          featured_image_url: data.featured_image_url,
          status: data.status,
          read_time_minutes: data.read_time_minutes,
          author_id: user.id,
          tenant_id: tenantId,
          published_at: data.status === 'published' ? new Date().toISOString() : null,
          allow_comments: data.allow_comments ?? true,
          allow_ratings: data.allow_ratings ?? true,
          is_featured: data.is_featured ?? false,
          featured_order: data.featured_order,
          editorial_badge: data.editorial_badge as any,
          display_author_id: data.display_author_id,
          custom_author_name: data.custom_author_name,
          custom_author_url: data.custom_author_url
        } as any)
        .select()
        .single();

      if (error) throw error;

      // Add tags if provided
      if (data.tags && data.tags.length > 0) {
        const tagRelations = data.tags.map(tagId => ({
          post_id: post.id,
          tag_id: tagId
        }));

        const { error: tagError } = await supabase
          .from('blog_post_tags')
          .insert(tagRelations);

        if (tagError) throw tagError;
      }

      return post;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blog-posts'] });
      queryClient.invalidateQueries({ queryKey: ['blog-post'] });
      queryClient.invalidateQueries({ queryKey: ['blog-post-slug-no-tenant'] });
      queryClient.invalidateQueries({ queryKey: ['blog-post-by-id'] });
      queryClient.invalidateQueries({ queryKey: ['curation-posts'] });
      queryClient.invalidateQueries({ queryKey: ['recent-posts'] });
      toast({ title: 'Post criado com sucesso' });
      navigate('/admin/blog');
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao criar post',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  const updatePost = useMutation({
    mutationFn: async (data: UpdatePostData) => {
      // Validar slug único por tenant (exceto o próprio post, apenas contra publicados)
      const { data: existingPost } = await supabase
        .from('blog_posts')
        .select('id, tenant_id')
        .eq('slug', data.slug)
        .eq('status', 'published')
        .or(`tenant_id.eq.${data.tenant_id || null},tenant_id.is.null`)
        .neq('id', data.id)
        .maybeSingle();

      if (existingPost) {
        throw new Error('Já existe outro post com este slug neste site. Por favor, escolha outro.');
      }

      const { data: updatedPost, error } = await supabase
        .from('blog_posts')
        .update({
          title: data.title,
          slug: data.slug,
          excerpt: data.excerpt,
          content: data.content,
          featured_image_url: data.featured_image_url,
          status: data.status,
          read_time_minutes: data.read_time_minutes,
          tenant_id: data.tenant_id,
          published_at: data.status === 'published' ? new Date().toISOString() : null,
          allow_comments: data.allow_comments ?? true,
          allow_ratings: data.allow_ratings ?? true,
          is_featured: data.is_featured ?? false,
          featured_order: data.featured_order,
          editorial_badge: data.editorial_badge as any,
          display_author_id: data.display_author_id,
          custom_author_name: data.custom_author_name,
          custom_author_url: data.custom_author_url
        } as any)
        .eq('id', data.id)
        .select()
        .single();

      if (error) throw error;

      // Update tags
      if (data.tags) {
        // Remove existing tags
        await supabase
          .from('blog_post_tags')
          .delete()
          .eq('post_id', data.id);

        // Add new tags
        if (data.tags.length > 0) {
          const tagRelations = data.tags.map(tagId => ({
            post_id: data.id,
            tag_id: tagId
          }));

          const { error: tagError } = await supabase
            .from('blog_post_tags')
            .insert(tagRelations);

          if (tagError) throw tagError;
        }
      }

      return updatedPost;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blog-posts'] });
      queryClient.invalidateQueries({ queryKey: ['blog-post'] });
      queryClient.invalidateQueries({ queryKey: ['blog-post-slug-no-tenant'] });
      queryClient.invalidateQueries({ queryKey: ['blog-post-by-id'] });
      queryClient.invalidateQueries({ queryKey: ['curation-posts'] });
      queryClient.invalidateQueries({ queryKey: ['recent-posts'] });
      toast({ 
        title: 'Post atualizado com sucesso',
        description: 'As alterações já estão visíveis. Recarregue a página se necessário.'
      });
      navigate('/admin/blog');
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao atualizar post',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  const deletePost = useMutation({
    mutationFn: async (postId: string) => {
      const { error } = await supabase
        .from('blog_posts')
        .delete()
        .eq('id', postId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blog-posts'] });
      queryClient.invalidateQueries({ queryKey: ['blog-post'] });
      queryClient.invalidateQueries({ queryKey: ['blog-post-slug-no-tenant'] });
      queryClient.invalidateQueries({ queryKey: ['blog-post-by-id'] });
      queryClient.invalidateQueries({ queryKey: ['curation-posts'] });
      queryClient.invalidateQueries({ queryKey: ['recent-posts'] });
      toast({ title: 'Post excluído com sucesso' });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao excluir post',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  const publishPost = useMutation({
    mutationFn: async (postId: string) => {
      const { error } = await supabase
        .from('blog_posts')
        .update({
          status: 'published',
          published_at: new Date().toISOString()
        })
        .eq('id', postId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blog-posts'] });
      queryClient.invalidateQueries({ queryKey: ['blog-post'] });
      queryClient.invalidateQueries({ queryKey: ['blog-post-slug-no-tenant'] });
      queryClient.invalidateQueries({ queryKey: ['blog-post-by-id'] });
      queryClient.invalidateQueries({ queryKey: ['curation-posts'] });
      queryClient.invalidateQueries({ queryKey: ['recent-posts'] });
      toast({ title: 'Post publicado com sucesso' });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao publicar post',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  return {
    createPost,
    updatePost,
    deletePost,
    publishPost
  };
};
