import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useTenant } from "./useTenant";
import { usePatientInstitutions } from "./usePatientInstitutions";
import type { InstitutionCoupon } from "./useInstitutionCoupons";

export interface PatientCoupon extends InstitutionCoupon {
  institution_name: string;
  institution_type: string;
}

export function usePatientInstitutionCoupons() {
  const { user } = useAuth();
  const { tenant } = useTenant();
  const { linkedInstitutions } = usePatientInstitutions();

  const { data: coupons, isLoading, error, refetch } = useQuery({
    queryKey: ['patient-institution-coupons', user?.id, tenant?.id, linkedInstitutions?.map(i => i.institution_id).join(',')],
    queryFn: async () => {
      if (!user?.id || !tenant?.id || !linkedInstitutions.length) return [];

      // IDs das instituições do paciente
      const institutionIds = linkedInstitutions.map(i => i.institution_id);

      // Buscar cupons ativos para essas instituições
      const { data, error } = await supabase
        .from('institution_coupons')
        .select(`
          *,
          educational_institutions!inner (
            id,
            name,
            type
          )
        `)
        .eq('tenant_id', tenant.id)
        .eq('is_active', true)
        .in('institution_id', institutionIds)
        .lte('valid_from', new Date().toISOString())
        .or(`valid_until.is.null,valid_until.gte.${new Date().toISOString()}`);

      if (error) {
        console.error('Error fetching patient institution coupons:', error);
        throw error;
      }

      // Mapear dados e filtrar por target_audience
      const mappedCoupons = (data || [])
        .map((item: any) => ({
          ...item,
          institution_name: item.educational_institutions?.name || '',
          institution_type: item.educational_institutions?.type || '',
        }))
        .filter((coupon: any) => {
          // Filtrar por target_audience
          if (coupon.target_audience === 'all') return true;
          if (coupon.target_audience === 'institution_students') {
            // Verificar se paciente está matriculado na instituição do cupom
            const isEnrolled = linkedInstitutions.some(
              inst => inst.institution_id === coupon.institution_id && 
                     inst.enrollment_status === 'enrolled'
            );
            return isEnrolled;
          }
          if (coupon.target_audience === 'specific_users' && 
              coupon.target_audience_user_ids?.includes(user.id)) return true;
          return false;
        }) as PatientCoupon[];

      return mappedCoupons;
    },
    enabled: !!user?.id && !!tenant?.id && linkedInstitutions.length > 0,
  });

  return {
    coupons: coupons || [],
    isLoading,
    error,
    refetch,
  };
}
