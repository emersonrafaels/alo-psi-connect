import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

export interface IgnoredInstitution {
  id: string;
  institution_name: string;
  patient_count: number;
  first_mention: string | null;
  last_mention: string | null;
  ignored_at: string;
  ignored_by: string | null;
  reason: string | null;
  created_at: string;
}

export function useIgnoredInstitutions() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: ignoredInstitutions = [], isLoading } = useQuery({
    queryKey: ['ignored-uncatalogued-institutions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ignored_uncatalogued_institutions')
        .select('*')
        .order('ignored_at', { ascending: false });

      if (error) {
        console.error('Error fetching ignored institutions:', error);
        throw error;
      }

      return data as IgnoredInstitution[];
    },
  });

  const ignoreMutation = useMutation({
    mutationFn: async (institution: {
      name: string;
      patient_count: number;
      first_mention: string;
      last_mention: string;
      reason?: string;
    }) => {
      const { data, error } = await supabase
        .from('ignored_uncatalogued_institutions')
        .insert({
          institution_name: institution.name,
          patient_count: institution.patient_count,
          first_mention: institution.first_mention,
          last_mention: institution.last_mention,
          ignored_by: user?.id || null,
          reason: institution.reason || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ignored-uncatalogued-institutions'] });
      queryClient.invalidateQueries({ queryKey: ['uncatalogued-institutions'] });
      toast({
        title: 'Instituição arquivada',
        description: 'A instituição foi movida para a lista de arquivadas.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao arquivar',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const unignoreMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('ignored_uncatalogued_institutions')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ignored-uncatalogued-institutions'] });
      queryClient.invalidateQueries({ queryKey: ['uncatalogued-institutions'] });
      toast({
        title: 'Instituição restaurada',
        description: 'A instituição voltou para a lista de não catalogadas.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao restaurar',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const deletePermanentlyMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('ignored_uncatalogued_institutions')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ignored-uncatalogued-institutions'] });
      toast({
        title: 'Instituição excluída',
        description: 'A instituição foi removida permanentemente.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao excluir',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    ignoredInstitutions,
    isLoading,
    ignoreInstitution: ignoreMutation.mutate,
    unignoreInstitution: unignoreMutation.mutate,
    deletePermanently: deletePermanentlyMutation.mutate,
    isIgnoring: ignoreMutation.isPending,
    isUnignoring: unignoreMutation.isPending,
    isDeleting: deletePermanentlyMutation.isPending,
  };
}
