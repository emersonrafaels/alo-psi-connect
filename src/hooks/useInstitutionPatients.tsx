import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface PatientInstitution {
  id: string;
  patient_id: string;
  institution_id: string;
  enrollment_status: 'enrolled' | 'graduated' | 'inactive';
  enrollment_date: string | null;
  created_at: string;
}

export const useInstitutionPatients = (institutionId?: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: patientInstitutions, isLoading, error: queryError } = useQuery({
    queryKey: ['patient-institutions', institutionId],
    queryFn: async () => {
      console.log('[useInstitutionPatients] Fetching patients for institution:', institutionId);
      
      let query = supabase
        .from('patient_institutions')
        .select(`
          *,
          pacientes!inner(
            id,
            profile_id,
            profiles!inner(
              nome,
              email
            )
          )
        `);
      
      if (institutionId) {
        query = query.eq('institution_id', institutionId);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('[useInstitutionPatients] Error fetching patients:', {
          error,
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
          institutionId
        });
        throw error;
      }
      
      console.log('[useInstitutionPatients] Successfully fetched patients:', {
        count: data?.length || 0,
        institutionId
      });
      
      return data;
    },
    enabled: !!institutionId,
    retry: 1,
    meta: {
      errorMessage: 'Erro ao carregar pacientes vinculados'
    }
  });

  const addPatientMutation = useMutation({
    mutationFn: async (data: {
      patient_id: string;
      institution_id: string;
      enrollment_status?: 'enrolled' | 'graduated' | 'inactive';
      enrollment_date?: string;
    }) => {
      const { error } = await supabase
        .from('patient_institutions')
        .insert(data);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient-institutions'] });
      toast({
        title: 'Paciente vinculado',
        description: 'O paciente foi vinculado à instituição com sucesso.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao vincular paciente',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const removePatientMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('patient_institutions')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient-institutions'] });
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

  return {
    patientInstitutions: patientInstitutions || [],
    isLoading,
    error: queryError,
    addPatient: addPatientMutation.mutate,
    removePatient: removePatientMutation.mutate,
    isAdding: addPatientMutation.isPending,
    isRemoving: removePatientMutation.isPending,
  };
};
