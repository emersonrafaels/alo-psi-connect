import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useTenant } from './useTenant';
import { useLocation } from 'react-router-dom';

export const useInstitutionAccess = () => {
  const { user } = useAuth();
  const { tenant } = useTenant();
  const location = useLocation();
  
  // Detectar se estamos em rota institucional
  const isInstitutionalRoute = location.pathname.startsWith('/portal-institucional');

  // Buscar instituições do usuário
  const { data: userInstitutions, isLoading } = useQuery({
    queryKey: ['user-institutions', user?.id, tenant?.id],
    queryFn: async () => {
      if (!user) return null;

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
            can_manage_professionals
          )
        `)
        .eq('user_id', user.id)
        .eq('is_active', true);

      // Não filtrar por tenant em rotas institucionais (o user_id já é suficiente)
      // Em outras rotas, manter o filtro por tenant para compatibilidade
      if (tenant?.id && !isInstitutionalRoute) {
        query = query.eq('tenant_id', tenant.id);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data;
    },
    enabled: !!user && !!tenant,
  });

  // Buscar profissionais vinculados
  const { data: linkedProfessionals } = useQuery({
    queryKey: ['institution-professionals', userInstitutions],
    queryFn: async () => {
      if (!userInstitutions || userInstitutions.length === 0) return [];

      const institutionIds = userInstitutions.map(ui => ui.institution_id);

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
            ativo
          )
        `)
        .in('institution_id', institutionIds)
        .eq('is_active', true);

      if (error) throw error;
      return data;
    },
    enabled: !!userInstitutions && userInstitutions.length > 0,
  });

  // Buscar alunos vinculados
  const { data: linkedStudents } = useQuery({
    queryKey: ['institution-students', userInstitutions],
    queryFn: async () => {
      if (!userInstitutions || userInstitutions.length === 0) return [];

      const institutionIds = userInstitutions.map(ui => ui.institution_id);

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
              data_nascimento
            )
          )
        `)
        .in('institution_id', institutionIds);

      if (error) throw error;
      return data;
    },
    enabled: !!userInstitutions && userInstitutions.length > 0,
  });

  return {
    userInstitutions: userInstitutions || [],
    linkedProfessionals: linkedProfessionals || [],
    linkedStudents: linkedStudents || [],
    isLoading,
  };
};
