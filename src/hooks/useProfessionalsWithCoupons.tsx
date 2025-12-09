import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useTenant } from './useTenant';

export interface CouponInfo {
  couponId: string;
  code: string;
  name: string;
  discountType: string;
  discountValue: number;
  potentialDiscount: number;
  finalAmount: number;
}

export interface ProfessionalCouponData {
  bestCoupon: CouponInfo;
  allCoupons: CouponInfo[];
}

export const useProfessionalsWithCoupons = (professionals: { id: number; price: number }[]) => {
  const professionalIds = professionals.map(p => p.id);
  const priceMap = new Map(professionals.map(p => [p.id, p.price]));
  const { user } = useAuth();
  const { tenant } = useTenant();

  // Criar hash único que inclui IDs e preços para detectar mudanças
  const pricesHash = professionals.map(p => `${p.id}:${p.price}`).join(',');
  const hasValidPrices = professionals.some(p => p.price > 0);

  return useQuery({
    queryKey: ['professionals-with-coupons', pricesHash, tenant?.id, user?.id],
    queryFn: async (): Promise<Map<number, ProfessionalCouponData>> => {
      const couponMap = new Map<number, ProfessionalCouponData>();

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

        // 6. Para cada profissional, coletar TODOS os cupons elegíveis
        for (const professionalId of professionalIds) {
          const professionalCoupons: CouponInfo[] = [];

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

            // Calcular desconto localmente usando o preço real do profissional
            const professionalPrice = priceMap.get(professionalId) || 0;
            let discountAmount: number;
            if (coupon.discount_type === 'percentage') {
              discountAmount = (professionalPrice * coupon.discount_value) / 100;
              if (coupon.max_discount_amount && discountAmount > coupon.max_discount_amount) {
                discountAmount = coupon.max_discount_amount;
              }
            } else {
              discountAmount = coupon.discount_value;
            }

            const finalAmount = Math.max(professionalPrice - discountAmount, 0);

            // Adicionar cupom à lista
            professionalCoupons.push({
              couponId: coupon.id,
              code: coupon.code,
              name: coupon.name,
              discountType: coupon.discount_type,
              discountValue: coupon.discount_value,
              potentialDiscount: discountAmount,
              finalAmount: finalAmount,
            });
          }

          // Se há cupons, ordenar por desconto (maior primeiro) e salvar
          if (professionalCoupons.length > 0) {
            professionalCoupons.sort((a, b) => b.potentialDiscount - a.potentialDiscount);
            
            couponMap.set(professionalId, {
              bestCoupon: professionalCoupons[0],
              allCoupons: professionalCoupons,
            });
          }
        }

        return couponMap;
      } catch (error) {
        console.error('Error fetching professionals with coupons:', error);
        return couponMap;
      }
    },
    enabled: !!user && !!tenant && professionalIds.length > 0 && hasValidPrices,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};
