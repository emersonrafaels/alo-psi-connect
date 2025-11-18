import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface PatientInstitution {
  id: string;
  enrollment_status: string;
  enrollment_date: string | null;
  institution_id: string;
  institution_name: string;
  institution_type: string;
  has_partnership: boolean;
}

export function usePatientInstitutions() {
  const { user } = useAuth();

  const { data: linkedInstitutions, isLoading, error, refetch } = useQuery({
    queryKey: ['patient-institutions', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      // Primeiro buscar o profile_id e patient_id do usuário
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (profileError || !profileData) {
        console.error('Error fetching profile:', profileError);
        return [];
      }

      // Buscar o patient_id usando o profile_id
      const { data: patientData, error: patientError } = await supabase
        .from('pacientes')
        .select('id')
        .eq('profile_id', profileData.id)
        .single();

      if (patientError || !patientData) {
        // Usuário não é paciente ou não tem registro
        return [];
      }

      // Buscar todas as instituições vinculadas
      const { data, error } = await supabase
        .from('patient_institutions')
        .select(`
          id,
          enrollment_status,
          enrollment_date,
          institution_id,
          educational_institutions!inner (
            id,
            name,
            type,
            has_partnership
          )
        `)
        .eq('patient_id', patientData.id)
        .order('enrollment_date', { ascending: false, nullsFirst: false });

      if (error) {
        console.error('Error fetching patient institutions:', error);
        throw error;
      }

      // Mapear os dados para o formato esperado
      return (data || []).map((item: any) => ({
        id: item.id,
        enrollment_status: item.enrollment_status,
        enrollment_date: item.enrollment_date,
        institution_id: item.educational_institutions.id,
        institution_name: item.educational_institutions.name,
        institution_type: item.educational_institutions.type,
        has_partnership: item.educational_institutions.has_partnership,
      })) as PatientInstitution[];
    },
    enabled: !!user?.id,
  });

  return {
    linkedInstitutions: linkedInstitutions || [],
    isLoading,
    error,
    refetch,
  };
}
