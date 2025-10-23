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

  const { data: patientInstitutions, isLoading } = useQuery({
    queryKey: ['patient-institutions', institutionId],
    queryFn: async () => {
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
      
      if (error) throw error;
      return data;
    },
    enabled: !!institutionId,
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
    addPatient: addPatientMutation.mutate,
    removePatient: removePatientMutation.mutate,
    isAdding: addPatientMutation.isPending,
    isRemoving: removePatientMutation.isPending,
  };
};
