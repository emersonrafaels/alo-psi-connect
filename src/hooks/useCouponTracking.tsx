import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface RecordCouponUsageParams {
  couponId: string;
  appointmentId: string;
  originalAmount: number;
  discountAmount: number;
  finalAmount: number;
}

export const useCouponTracking = () => {
  const { toast } = useToast();

  const recordCouponUsage = useMutation({
    mutationFn: async (params: RecordCouponUsageParams) => {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.user) {
        throw new Error('Usuário não autenticado');
      }

      // Registrar uso do cupom
      const { error: usageError } = await supabase
        .from('coupon_usage')
        .insert({
          coupon_id: params.couponId,
          user_id: session.session.user.id,
          appointment_id: params.appointmentId,
          original_amount: params.originalAmount,
          discount_amount: params.discountAmount,
          final_amount: params.finalAmount,
        });

      if (usageError) throw usageError;

      // Incrementar contador de uso do cupom
      const { data: coupon } = await supabase
        .from('institution_coupons')
        .select('current_usage_count')
        .eq('id', params.couponId)
        .single();

      if (coupon) {
        await supabase
          .from('institution_coupons')
          .update({ 
            current_usage_count: coupon.current_usage_count + 1
          })
          .eq('id', params.couponId);
      }
    },
    onError: (error: any) => {
      console.error('Error recording coupon usage:', error);
      toast({
        title: 'Aviso',
        description: 'Cupom aplicado mas houve erro ao registrar uso',
        variant: 'destructive',
      });
    },
  });

  return {
    recordCouponUsage: recordCouponUsage.mutate,
    isRecording: recordCouponUsage.isPending,
  };
};
