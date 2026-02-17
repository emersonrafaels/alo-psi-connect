import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useAdminInstitutionPortal = (institutionId: string | null) => {
  // Fetch all institutions for the dropdown
  const { data: institutions = [], isLoading: isLoadingInstitutions } = useQuery({
    queryKey: ['admin-all-institutions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('educational_institutions')
        .select('id, name, type, has_partnership, is_active, logo_url, can_manage_users, can_manage_coupons, can_manage_professionals')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return data || [];
    },
  });

  // Fetch linked professionals
  const { data: linkedProfessionals = [], isLoading: isLoadingProfessionals } = useQuery({
    queryKey: ['admin-institution-professionals', institutionId],
    queryFn: async () => {
      if (!institutionId) return [];

      const { data, error } = await supabase
        .from('professional_institutions')
        .select(`
          professional_id,
          relationship_type,
          start_date,
          profissionais!inner(
            id,
            display_name,
            profissao,
            foto_perfil_url,
            user_email,
            ativo,
            profile_id,
            profiles(
              user_id
            )
          )
        `)
        .eq('institution_id', institutionId)
        .eq('is_active', true);

      if (error) throw error;
      return data || [];
    },
    enabled: !!institutionId,
  });

  // Fetch linked students
  const { data: linkedStudents = [], isLoading: isLoadingStudents } = useQuery({
    queryKey: ['admin-institution-students', institutionId],
    queryFn: async () => {
      if (!institutionId) return [];

      const { data, error } = await supabase
        .from('patient_institutions')
        .select(`
          patient_id,
          enrollment_status,
          enrollment_date,
          pacientes!inner(
            id,
            profile_id,
            eh_estudante,
            profiles!inner(
              nome,
              email,
              data_nascimento,
              user_id
            )
          )
        `)
        .eq('institution_id', institutionId);

      if (error) throw error;
      return data || [];
    },
    enabled: !!institutionId,
  });

  return {
    institutions,
    linkedProfessionals,
    linkedStudents,
    isLoading: isLoadingInstitutions || isLoadingProfessionals || isLoadingStudents,
    isLoadingInstitutions,
  };
};
