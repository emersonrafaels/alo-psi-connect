import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

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
  is_featured?: boolean;
  featured_order?: number;
  editorial_badge?: string;
}

interface UpdatePostData extends CreatePostData {
  id: string;
}

export const useBlogPostManager = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const createPost = useMutation({
    mutationFn: async (data: CreatePostData) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Não autenticado');

      // Get current tenant from localStorage
      const tenantSlug = localStorage.getItem('selected-tenant');
      if (!tenantSlug) throw new Error('Nenhum tenant selecionado');

      // Fetch tenant ID
      const { data: tenant } = await supabase
        .from('tenants')
        .select('id')
        .eq('slug', tenantSlug)
        .single();

      if (!tenant) throw new Error('Tenant não encontrado');

      // Validar slug único
      const { data: existingPost } = await supabase
        .from('blog_posts')
        .select('id')
        .eq('slug', data.slug)
        .eq('tenant_id', tenant.id)
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
          tenant_id: tenant.id,
          published_at: data.status === 'published' ? new Date().toISOString() : null,
          allow_comments: data.allow_comments ?? true,
          allow_ratings: data.allow_ratings ?? true,
          is_featured: data.is_featured ?? false,
          featured_order: data.featured_order,
          editorial_badge: data.editorial_badge as any
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
      // Validar slug único (exceto o próprio post)
      const { data: existingPost } = await supabase
        .from('blog_posts')
        .select('id')
        .eq('slug', data.slug)
        .neq('id', data.id)
        .maybeSingle();

      if (existingPost) {
        throw new Error('Já existe outro post com este slug. Por favor, escolha outro.');
      }

      const { error } = await supabase
        .from('blog_posts')
        .update({
          title: data.title,
          slug: data.slug,
          excerpt: data.excerpt,
          content: data.content,
          featured_image_url: data.featured_image_url,
          status: data.status,
          read_time_minutes: data.read_time_minutes,
          published_at: data.status === 'published' ? new Date().toISOString() : null,
          allow_comments: data.allow_comments ?? true,
          allow_ratings: data.allow_ratings ?? true,
          is_featured: data.is_featured ?? false,
          featured_order: data.featured_order,
          editorial_badge: data.editorial_badge as any
        } as any)
        .eq('id', data.id);

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
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blog-posts'] });
      toast({ title: 'Post atualizado com sucesso' });
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
