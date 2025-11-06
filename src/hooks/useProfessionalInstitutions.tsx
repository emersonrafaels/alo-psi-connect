import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ProfessionalInstitution {
  id: string;
  professional_id: number;
  institution_id: string;
  relationship_type: 'employee' | 'consultant' | 'supervisor' | 'intern';
  start_date: string | null;
  end_date: string | null;
  is_active: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export const useProfessionalInstitutions = (professionalId?: number) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: professionalInstitutions, isLoading } = useQuery({
    queryKey: ['professional-institutions', professionalId],
    queryFn: async () => {
      let query = supabase
        .from('professional_institutions')
        .select(`
          *,
          educational_institutions!inner(
            id,
            name,
            type,
            is_active
          )
        `);
      
      if (professionalId) {
        query = query.eq('professional_id', professionalId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data;
    },
    enabled: !!professionalId,
  });

  const addInstitutionMutation = useMutation({
    mutationFn: async (data: {
      professional_id: number;
      institution_id: string;
      relationship_type?: 'employee' | 'consultant' | 'supervisor' | 'intern';
      start_date?: string;
      end_date?: string;
      notes?: string;
    }) => {
      const { error } = await supabase
        .from('professional_institutions')
        .insert(data);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['professional-institutions'] });
      toast({
        title: 'Instituição vinculada',
        description: 'O profissional foi vinculado à instituição com sucesso.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao vincular instituição',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const removeInstitutionMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('professional_institutions')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['professional-institutions'] });
      toast({
        title: 'Vínculo removido',
        description: 'O vínculo foi removido com sucesso.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao remover vínculo',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const updateInstitutionMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ProfessionalInstitution> & { id: string }) => {
      const { error } = await supabase
        .from('professional_institutions')
        .update(updates)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['professional-institutions'] });
      toast({
        title: 'Vínculo atualizado',
        description: 'As informações foram atualizadas com sucesso.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao atualizar vínculo',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    professionalInstitutions: professionalInstitutions || [],
    isLoading,
    addInstitution: addInstitutionMutation.mutate,
    removeInstitution: removeInstitutionMutation.mutate,
    updateInstitution: updateInstitutionMutation.mutate,
    isAdding: addInstitutionMutation.isPending,
    isRemoving: removeInstitutionMutation.isPending,
    isUpdating: updateInstitutionMutation.isPending,
  };
};
