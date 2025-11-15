import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface EducationalInstitution {
  id: string;
  name: string;
  type: 'public' | 'private';
  has_partnership: boolean;
  is_active: boolean;
  can_manage_users: boolean;
  can_manage_coupons: boolean;
  can_manage_professionals: boolean;
  created_at: string;
  updated_at: string;
}

export const useInstitutions = (activeOnly: boolean = false) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: institutions, isLoading } = useQuery({
    queryKey: ['educational-institutions', activeOnly],
    queryFn: async () => {
      let query = supabase
        .from('educational_institutions')
        .select('*');
      
      if (activeOnly) {
        query = query.eq('is_active', true);
      }
      
      const { data, error } = await query.order('name');
      
      if (error) throw error;
      return data as EducationalInstitution[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (institution: Omit<EducationalInstitution, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('educational_institutions')
        .insert(institution)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['educational-institutions'] });
      toast({
        title: 'Instituição criada',
        description: 'A instituição foi criada com sucesso.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao criar instituição',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<EducationalInstitution> & { id: string }) => {
      const { data, error } = await supabase
        .from('educational_institutions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['educational-institutions'] });
      toast({
        title: 'Instituição atualizada',
        description: 'A instituição foi atualizada com sucesso.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao atualizar instituição',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('educational_institutions')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['educational-institutions'] });
      toast({
        title: 'Instituição removida',
        description: 'A instituição foi removida com sucesso.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao remover instituição',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const stats = {
    total: institutions?.length || 0,
    public: institutions?.filter(i => i.type === 'public').length || 0,
    private: institutions?.filter(i => i.type === 'private').length || 0,
    withPartnership: institutions?.filter(i => i.has_partnership).length || 0,
    active: institutions?.filter(i => i.is_active).length || 0,
  };

  return {
    institutions: institutions || [],
    isLoading,
    stats,
    createInstitution: createMutation.mutate,
    updateInstitution: updateMutation.mutate,
    deleteInstitution: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
};
