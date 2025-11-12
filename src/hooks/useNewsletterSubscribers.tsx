import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface NewsletterSubscriber {
  id: string;
  email: string;
  nome: string | null;
  created_at: string;
  ativo: boolean;
}

interface UseNewsletterSubscribersOptions {
  search?: string;
  status?: 'all' | 'active' | 'inactive';
  page?: number;
  pageSize?: number;
}

export const useNewsletterSubscribers = (options: UseNewsletterSubscribersOptions = {}) => {
  const { search = '', status = 'all', page = 1, pageSize = 20 } = options;
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['newsletter-subscribers', search, status, page, pageSize],
    queryFn: async () => {
      let query = supabase
        .from('newsletter_subscriptions')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

      // Apply search filter
      if (search) {
        query = query.or(`email.ilike.%${search}%,nome.ilike.%${search}%`);
      }

      // Apply status filter
      if (status === 'active') {
        query = query.eq('ativo', true);
      } else if (status === 'inactive') {
        query = query.eq('ativo', false);
      }

      // Apply pagination
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        subscribers: data as NewsletterSubscriber[],
        total: count || 0,
        totalPages: Math.ceil((count || 0) / pageSize),
      };
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, ativo }: { id: string; ativo: boolean }) => {
      const { error } = await supabase
        .from('newsletter_subscriptions')
        .update({ ativo })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['newsletter-subscribers'] });
      toast.success('Status atualizado com sucesso!');
    },
    onError: (error) => {
      console.error('Error toggling subscriber status:', error);
      toast.error('Erro ao atualizar status do inscrito');
    },
  });

  return {
    subscribers: data?.subscribers || [],
    total: data?.total || 0,
    totalPages: data?.totalPages || 0,
    isLoading,
    error,
    toggleStatus: toggleStatusMutation.mutate,
    isTogglingStatus: toggleStatusMutation.isPending,
  };
};
