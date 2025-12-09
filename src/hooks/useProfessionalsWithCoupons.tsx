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
        // 1. Buscar perfil e paciente em uma query
        const { data: profileData } = await supabase
          .from('profiles')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (!profileData) {
          return couponMap;
        }

        const { data: patientData } = await supabase
          .from('pacientes')
          .select('id')
          .eq('profile_id', profileData.id)
          .maybeSingle();

        if (!patientData) {
          return couponMap;
        }

        // 2. Buscar instituições vinculadas ao paciente
        const { data: linkedInstitutions } = await supabase
          .from('patient_institutions')
          .select('institution_id, enrollment_status')
          .eq('patient_id', patientData.id);

        const enrolledInstitutionIds = (linkedInstitutions || [])
          .filter(link => link.enrollment_status === 'enrolled')
          .map(link => link.institution_id);

        // 3. Buscar cupons ativos do tenant
        const { data: coupons } = await supabase
          .from('institution_coupons')
          .select(`
            id,
            code,
            name,
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

        // 4. Buscar profissionais vinculados a instituições (batch)
        const institutionProfessionalIds = coupons
          .filter(c => c.professional_scope === 'institution_professionals')
          .map(c => c.institution_id);

        let profInstitutionMap = new Map<string, Set<number>>();
        
        if (institutionProfessionalIds.length > 0) {
          const { data: profInstitutions } = await supabase
            .from('professional_institutions')
            .select('professional_id, institution_id')
            .in('institution_id', institutionProfessionalIds)
            .eq('is_active', true);

          (profInstitutions || []).forEach(pi => {
            if (!profInstitutionMap.has(pi.institution_id)) {
              profInstitutionMap.set(pi.institution_id, new Set());
            }
            profInstitutionMap.get(pi.institution_id)!.add(pi.professional_id);
          });
        }

        // 5. Pré-filtrar cupons elegíveis para o usuário
        const eligibleCoupons = coupons.filter(coupon => {
          if (coupon.target_audience === 'all') return true;
          if (coupon.target_audience === 'institution_students') {
            return enrolledInstitutionIds.includes(coupon.institution_id);
          }
          if (coupon.target_audience === 'specific_users') {
            return coupon.target_audience_user_ids?.includes(user.id) || false;
          }
          if (coupon.target_audience === 'non_students') {
            return !enrolledInstitutionIds.includes(coupon.institution_id);
          }
          return true;
        });

        if (eligibleCoupons.length === 0) {
          return couponMap;
        }

        // 6. Para cada profissional, verificar cupons elegíveis (sem RPC individual)
        for (const professionalId of professionalIds) {
          for (const coupon of eligibleCoupons) {
            // Verificar escopo do profissional
            let isProfessionalInScope = false;

            if (coupon.professional_scope === 'all_tenant' || coupon.professional_scope === 'all' || !coupon.professional_scope) {
              isProfessionalInScope = true;
            } else if (coupon.professional_scope === 'institution_professionals') {
              const institutionProfs = profInstitutionMap.get(coupon.institution_id);
              isProfessionalInScope = institutionProfs?.has(professionalId) || false;
            } else if (coupon.professional_scope === 'specific_professionals') {
              isProfessionalInScope = coupon.professional_scope_ids?.includes(professionalId) || false;
            }

            if (!isProfessionalInScope) {
              continue;
            }

            // Calcular desconto localmente (evitar RPC para cada combo)
            let discountAmount: number;
            if (coupon.discount_type === 'percentage') {
              discountAmount = (amount * coupon.discount_value) / 100;
              if (coupon.max_discount_amount && discountAmount > coupon.max_discount_amount) {
                discountAmount = coupon.max_discount_amount;
              }
            } else {
              discountAmount = coupon.discount_value;
            }

            const finalAmount = Math.max(amount - discountAmount, 0);

            // Se já existe um cupom para este profissional, manter o de maior desconto
            const existingCoupon = couponMap.get(professionalId);

            if (!existingCoupon || discountAmount > existingCoupon.potentialDiscount) {
              couponMap.set(professionalId, {
                couponId: coupon.id,
                code: coupon.code,
                name: coupon.name,
                discountType: coupon.discount_type,
                discountValue: coupon.discount_value,
                potentialDiscount: discountAmount,
                finalAmount: finalAmount,
              });
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
