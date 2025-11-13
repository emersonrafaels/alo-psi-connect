import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { InstitutionCoupon } from './useInstitutionCoupons';

interface AvailableCoupon extends InstitutionCoupon {
  potentialDiscount: number;
  finalAmount: number;
}

export const useAvailableCoupons = (
  professionalId: number | null,
  amount: number,
  tenantId: string | null
) => {
  return useQuery({
    queryKey: ['available-coupons', professionalId, amount, tenantId],
    queryFn: async (): Promise<AvailableCoupon[]> => {
      if (!professionalId || !tenantId) return [];

      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.user) return [];

      // Buscar todos os cupons ativos do tenant
      const { data: coupons, error } = await supabase
        .from('institution_coupons')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('is_active', true)
        .lte('valid_from', new Date().toISOString())
        .or(`valid_until.is.null,valid_until.gte.${new Date().toISOString()}`);

      if (error || !coupons) return [];

      // Validar cada cupom silenciosamente
      const validCoupons: AvailableCoupon[] = [];
      
      for (const coupon of coupons) {
        try {
          const { data: result } = await supabase.rpc('validate_coupon', {
            _code: coupon.code,
            _user_id: session.session.user.id,
            _professional_id: professionalId,
            _amount: amount,
            _tenant_id: tenantId,
          });

          if (result && result[0]?.is_valid) {
            validCoupons.push({
              ...(coupon as InstitutionCoupon),
              potentialDiscount: result[0].discount_amount,
              finalAmount: result[0].final_amount,
            });
          }
        } catch (err) {
          console.error('Error validating coupon:', err);
        }
      }

      return validCoupons;
    },
    enabled: !!professionalId && !!tenantId && amount > 0,
  });
};
