import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useTenant } from './useTenant';

interface CouponInfo {
  couponId: string;
  code: string;
  name: string;
  discountType: string;
  discountValue: number;
  potentialDiscount: number;
  finalAmount: number;
}

export const useProfessionalsWithCoupons = (professionalIds: number[], amount: number = 150) => {
  const { user } = useAuth();
  const { tenant } = useTenant();

  return useQuery({
    queryKey: ['professionals-with-coupons', professionalIds, amount, tenant?.id, user?.id],
    queryFn: async (): Promise<Map<number, CouponInfo>> => {
      const couponMap = new Map<number, CouponInfo>();

      if (!user || !tenant || professionalIds.length === 0) {
        return couponMap;
      }

      try {
        // 1. Buscar instituições vinculadas ao paciente
        const { data: patientData } = await supabase
          .from('pacientes')
          .select('id')
          .eq('profile_id', (await supabase
            .from('profiles')
            .select('id')
            .eq('user_id', user.id)
            .single()).data?.id)
          .single();

        if (!patientData) {
          return couponMap;
        }

        const { data: linkedInstitutions } = await supabase
          .from('patient_institutions')
          .select('institution_id, enrollment_status')
          .eq('patient_id', patientData.id);

        const enrolledInstitutionIds = (linkedInstitutions || [])
          .filter(link => link.enrollment_status === 'enrolled')
          .map(link => link.institution_id);

        // 2. Buscar cupons ativos do tenant
        const { data: coupons } = await supabase
          .from('institution_coupons')
          .select(`
            id,
            code,
            name,
            description,
            discount_type,
            discount_value,
            max_discount_amount,
            minimum_purchase_amount,
            target_audience,
            target_audience_user_ids,
            professional_scope,
            professional_scope_ids,
            institution_id
          `)
          .eq('tenant_id', tenant.id)
          .eq('is_active', true)
          .lte('valid_from', new Date().toISOString())
          .or(`valid_until.is.null,valid_until.gte.${new Date().toISOString()}`);

        if (!coupons || coupons.length === 0) {
          return couponMap;
        }

        // 3. Para cada profissional, verificar se há cupons aplicáveis
        for (const professionalId of professionalIds) {
          for (const coupon of coupons) {
            // Verificar elegibilidade do paciente (target_audience)
            let isEligible = false;

            if (coupon.target_audience === 'all') {
              isEligible = true;
            } else if (coupon.target_audience === 'institution_students') {
              // Paciente deve estar matriculado na instituição do cupom
              isEligible = enrolledInstitutionIds.includes(coupon.institution_id);
            } else if (coupon.target_audience === 'specific_users') {
              isEligible = coupon.target_audience_user_ids?.includes(user.id) || false;
            } else if (coupon.target_audience === 'non_students') {
              // Paciente NÃO deve estar matriculado na instituição
              isEligible = !enrolledInstitutionIds.includes(coupon.institution_id);
            }

            if (!isEligible) {
              continue;
            }

            // Verificar se o profissional está no escopo (professional_scope)
            let isProfessionalInScope = false;

            // 'all_tenant' = todos profissionais do tenant, 'all' (legado) = mesma coisa
            if (coupon.professional_scope === 'all_tenant' || coupon.professional_scope === 'all') {
              isProfessionalInScope = true;
            } else if (coupon.professional_scope === 'institution_professionals') {
              // Verificar se o profissional está vinculado à instituição do cupom
              const { data: profInstitution } = await supabase
                .from('professional_institutions')
                .select('professional_id')
                .eq('professional_id', professionalId)
                .eq('institution_id', coupon.institution_id)
                .eq('is_active', true)
                .single();

              isProfessionalInScope = !!profInstitution;
            } else if (coupon.professional_scope === 'specific_professionals') {
              isProfessionalInScope = coupon.professional_scope_ids?.includes(professionalId) || false;
            }

            if (!isProfessionalInScope) {
              continue;
            }

            // Validar cupom usando a RPC function
            try {
              const { data: validationResult } = await supabase.rpc('validate_coupon', {
                _code: coupon.code,
                _user_id: user.id,
                _professional_id: professionalId,
                _amount: amount,
                _tenant_id: tenant.id,
              });

              if (validationResult && validationResult[0]?.is_valid) {
                // Se já existe um cupom para este profissional, manter o de maior desconto
                const existingCoupon = couponMap.get(professionalId);
                const currentDiscount = validationResult[0].discount_amount;

                if (!existingCoupon || currentDiscount > existingCoupon.potentialDiscount) {
                  couponMap.set(professionalId, {
                    couponId: coupon.id,
                    code: coupon.code,
                    name: coupon.name,
                    discountType: coupon.discount_type,
                    discountValue: coupon.discount_value,
                    potentialDiscount: currentDiscount,
                    finalAmount: validationResult[0].final_amount,
                  });
                }
              }
            } catch (err) {
              console.error('Error validating coupon:', err);
            }
          }
        }

        return couponMap;
      } catch (error) {
        console.error('Error fetching professionals with coupons:', error);
        return couponMap;
      }
    },
    enabled: !!user && !!tenant && professionalIds.length > 0,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};
