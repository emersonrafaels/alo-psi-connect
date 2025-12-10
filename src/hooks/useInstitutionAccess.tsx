import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useTenant } from './useTenant';
import { useLocation } from 'react-router-dom';

export const useInstitutionAccess = () => {
  const { user } = useAuth();
  const { tenant } = useTenant();
  const location = useLocation();
  
  // Detectar se estamos em rota institucional (suporta rotas multi-tenant como /medcos/portal-institucional)
  const isInstitutionalRoute = location.pathname.includes('/portal-institucional');

  // Buscar instituições do usuário
  const { data: userInstitutions, isLoading } = useQuery({
    queryKey: ['user-institutions', user?.id, isInstitutionalRoute ? 'institutional' : tenant?.id],
    queryFn: async () => {
      console.log('🔍 [useInstitutionAccess] Starting userInstitutions query');
      console.log('   User:', user?.id);
      console.log('   Tenant:', tenant?.id);
      console.log('   isInstitutionalRoute:', isInstitutionalRoute);
      
      if (!user) {
        console.log('❌ [useInstitutionAccess] No user found');
        return null;
      }

      let query = supabase
        .from('institution_users')
        .select(`
          id,
          institution_id,
          role,
          tenant_id,
          educational_institutions!inner(
            id,
            name,
            type,
            has_partnership,
            is_active,
            can_manage_users,
            can_manage_coupons,
            can_manage_professionals,
            logo_url
          )
        `)
        .eq('user_id', user.id)
        .eq('is_active', true);

      if (!isInstitutionalRoute && tenant?.id) {
        console.log('🔒 [useInstitutionAccess] Adding tenant filter:', tenant.id);
        query = query.eq('tenant_id', tenant.id);
      } else {
        console.log('✅ [useInstitutionAccess] Skipping tenant filter (institutional route)');
      }

      const { data, error } = await query;

      if (error) {
        console.error('❌ [useInstitutionAccess] Error fetching institutions:', error);
        throw error;
      }

      console.log('✅ [useInstitutionAccess] Institutions found:', data?.length || 0, data);
      return data;
    },
    enabled: !!user && (isInstitutionalRoute || !!tenant),
    staleTime: 0,
    refetchOnMount: true,
  });

  // Buscar profissionais vinculados
  const { data: linkedProfessionals } = useQuery({
    queryKey: ['institution-professionals', userInstitutions?.map(ui => ui.institution_id)],
    queryFn: async () => {
      console.log('🔍 [useInstitutionAccess] Starting linkedProfessionals query');
      console.log('   userInstitutions:', userInstitutions);
      
      if (!userInstitutions || userInstitutions.length === 0) {
        console.log('⚠️ [useInstitutionAccess] No institutions to query professionals');
        return [];
      }

      const institutionIds = userInstitutions.map(ui => ui.institution_id);
      console.log('   Institution IDs:', institutionIds);

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
        .in('institution_id', institutionIds)
        .eq('is_active', true);

      if (error) {
        console.error('❌ [useInstitutionAccess] Error fetching professionals:', error);
        throw error;
      }

      console.log('✅ [useInstitutionAccess] Professionals found:', data?.length || 0);
      return data;
    },
    enabled: Array.isArray(userInstitutions) && userInstitutions.length > 0,
  });

  // Buscar alunos vinculados
  const { data: linkedStudents } = useQuery({
    queryKey: ['institution-students', userInstitutions?.map(ui => ui.institution_id)],
    queryFn: async () => {
      console.log('🔍 [useInstitutionAccess] Starting linkedStudents query');
      console.log('   userInstitutions:', userInstitutions);
      
      if (!userInstitutions || userInstitutions.length === 0) {
        console.log('⚠️ [useInstitutionAccess] No institutions to query students');
        return [];
      }

      const institutionIds = userInstitutions.map(ui => ui.institution_id);
      console.log('   Institution IDs:', institutionIds);

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
        .in('institution_id', institutionIds);

      if (error) {
        console.error('❌ [useInstitutionAccess] Error fetching students:', error);
        throw error;
      }

      console.log('✅ [useInstitutionAccess] Students found:', data?.length || 0);
      return data;
    },
    enabled: Array.isArray(userInstitutions) && userInstitutions.length > 0,
  });

  return {
    userInstitutions: userInstitutions || [],
    linkedProfessionals: linkedProfessionals || [],
    linkedStudents: linkedStudents || [],
    isLoading,
  };
};
