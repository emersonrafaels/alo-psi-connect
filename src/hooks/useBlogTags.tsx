import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface BlogTag {
  id: string;
  name: string;
  slug: string;
  created_at: string;
}

export const useBlogTags = () => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['blog-tags'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_tags')
        .select('*')
        .order('name');

      if (error) throw error;
      return data as BlogTag[];
    }
  });

  const createTag = useMutation({
    mutationFn: async (tag: { name: string; slug: string }) => {
      const { data, error } = await supabase
        .from('blog_tags')
        .insert(tag)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blog-tags'] });
      toast({ title: 'Tag criada com sucesso' });
    },
    onError: (error: any) => {
      toast({ 
        title: 'Erro ao criar tag',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  const deleteTag = useMutation({
    mutationFn: async (tagId: string) => {
      const { error } = await supabase
        .from('blog_tags')
        .delete()
        .eq('id', tagId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blog-tags'] });
      toast({ title: 'Tag excluída com sucesso' });
    },
    onError: (error: any) => {
      toast({ 
        title: 'Erro ao excluir tag',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  return { ...query, createTag, deleteTag };
};
