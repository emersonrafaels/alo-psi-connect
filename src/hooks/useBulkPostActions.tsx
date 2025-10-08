import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export const useBulkPostActions = () => {
  const queryClient = useQueryClient();

  const bulkPublish = useMutation({
    mutationFn: async (postIds: string[]) => {
      const { error } = await supabase
        .from('blog_posts')
        .update({ 
          status: 'published',
          published_at: new Date().toISOString()
        })
        .in('id', postIds);

      if (error) throw error;
    },
    onSuccess: (_, postIds) => {
      queryClient.invalidateQueries({ queryKey: ['curation-posts'] });
      queryClient.invalidateQueries({ queryKey: ['curation-stats'] });
      toast({
        title: "Posts publicados",
        description: `${postIds.length} post(s) publicado(s) com sucesso.`
      });
    },
    onError: () => {
      toast({
        title: "Erro ao publicar",
        description: "Não foi possível publicar os posts.",
        variant: "destructive"
      });
    }
  });

  const bulkUnpublish = useMutation({
    mutationFn: async (postIds: string[]) => {
      const { error } = await supabase
        .from('blog_posts')
        .update({ status: 'draft' })
        .in('id', postIds);

      if (error) throw error;
    },
    onSuccess: (_, postIds) => {
      queryClient.invalidateQueries({ queryKey: ['curation-posts'] });
      queryClient.invalidateQueries({ queryKey: ['curation-stats'] });
      toast({
        title: "Posts despublicados",
        description: `${postIds.length} post(s) alterado(s) para rascunho.`
      });
    },
    onError: () => {
      toast({
        title: "Erro ao despublicar",
        description: "Não foi possível despublicar os posts.",
        variant: "destructive"
      });
    }
  });

  const bulkSetFeatured = useMutation({
    mutationFn: async ({ postIds, featured }: { postIds: string[], featured: boolean }) => {
      const updates: any = { is_featured: featured };
      
      if (!featured) {
        updates.featured_order = null;
      }

      const { error } = await supabase
        .from('blog_posts')
        .update(updates)
        .in('id', postIds);

      if (error) throw error;
    },
    onSuccess: (_, { postIds, featured }) => {
      queryClient.invalidateQueries({ queryKey: ['curation-posts'] });
      queryClient.invalidateQueries({ queryKey: ['curation-stats'] });
      toast({
        title: featured ? "Posts destacados" : "Destaque removido",
        description: `${postIds.length} post(s) atualizado(s).`
      });
    },
    onError: () => {
      toast({
        title: "Erro ao atualizar destaque",
        description: "Não foi possível atualizar os posts.",
        variant: "destructive"
      });
    }
  });

  const bulkSetBadge = useMutation({
    mutationFn: async ({ postIds, badge }: { postIds: string[], badge: string | null }) => {
      const updates: any = { editorial_badge: badge };
      
      if (badge) {
        updates.badge_expires_at = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      } else {
        updates.badge_expires_at = null;
      }

      const { error } = await supabase
        .from('blog_posts')
        .update(updates)
        .in('id', postIds);

      if (error) throw error;
    },
    onSuccess: (_, { postIds, badge }) => {
      queryClient.invalidateQueries({ queryKey: ['curation-posts'] });
      queryClient.invalidateQueries({ queryKey: ['curation-stats'] });
      toast({
        title: badge ? "Badge aplicado" : "Badge removido",
        description: `${postIds.length} post(s) atualizado(s).`
      });
    },
    onError: () => {
      toast({
        title: "Erro ao atualizar badge",
        description: "Não foi possível atualizar os posts.",
        variant: "destructive"
      });
    }
  });

  const bulkDelete = useMutation({
    mutationFn: async (postIds: string[]) => {
      const { error } = await supabase
        .from('blog_posts')
        .delete()
        .in('id', postIds);

      if (error) throw error;
    },
    onSuccess: (_, postIds) => {
      queryClient.invalidateQueries({ queryKey: ['curation-posts'] });
      queryClient.invalidateQueries({ queryKey: ['curation-stats'] });
      toast({
        title: "Posts excluídos",
        description: `${postIds.length} post(s) excluído(s) com sucesso.`
      });
    },
    onError: () => {
      toast({
        title: "Erro ao excluir",
        description: "Não foi possível excluir os posts.",
        variant: "destructive"
      });
    }
  });

  const updateFeaturedOrder = useMutation({
    mutationFn: async (posts: { id: string, featured_order: number }[]) => {
      const updates = posts.map(post => 
        supabase
          .from('blog_posts')
          .update({ featured_order: post.featured_order })
          .eq('id', post.id)
      );

      await Promise.all(updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['curation-posts'] });
      toast({
        title: "Ordem atualizada",
        description: "A ordem dos posts em destaque foi atualizada."
      });
    },
    onError: () => {
      toast({
        title: "Erro ao reordenar",
        description: "Não foi possível atualizar a ordem dos posts.",
        variant: "destructive"
      });
    }
  });

  return {
    bulkPublish,
    bulkUnpublish,
    bulkSetFeatured,
    bulkSetBadge,
    bulkDelete,
    updateFeaturedOrder
  };
};
