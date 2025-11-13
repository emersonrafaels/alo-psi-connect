import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface InstitutionCoupon {
  id: string;
  institution_id: string;
  tenant_id: string | null;
  code: string;
  name: string;
  description: string | null;
  discount_type: 'percentage' | 'fixed_amount';
  discount_value: number;
  max_discount_amount: number | null;
  minimum_purchase_amount: number;
  maximum_uses: number | null;
  uses_per_user: number;
  current_usage_count: number;
  valid_from: string;
  valid_until: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  target_audience: 'all' | 'institution_students' | 'other_patients';
  target_audience_user_ids: string[] | null;
  professional_scope: 'all_tenant' | 'institution_professionals';
  professional_scope_ids: number[] | null;
}

export const useInstitutionCoupons = (institutionId?: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Buscar cupons de uma instituição
  const { data: coupons, isLoading } = useQuery({
    queryKey: ['institution-coupons', institutionId],
    queryFn: async () => {
      if (!institutionId) return [];

      const { data, error } = await supabase
        .from('institution_coupons')
        .select(`
          id,
          institution_id,
          tenant_id,
          code,
          name,
          description,
          discount_type,
          discount_value,
          max_discount_amount,
          minimum_purchase_amount,
          maximum_uses,
          uses_per_user,
          current_usage_count,
          valid_from,
          valid_until,
          is_active,
          created_at,
          updated_at,
          target_audience,
          target_audience_user_ids,
          professional_scope,
          professional_scope_ids
        `)
        .eq('institution_id', institutionId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as InstitutionCoupon[];
    },
    enabled: !!institutionId,
  });

  // Buscar uso de cupons
  const { data: couponUsage } = useQuery({
    queryKey: ['coupon-usage', institutionId],
    queryFn: async () => {
      if (!institutionId) return [];

      const { data, error } = await supabase
        .from('coupon_usage')
        .select(`
          *,
          institution_coupons!inner(institution_id)
        `)
        .eq('institution_coupons.institution_id', institutionId);

      if (error) throw error;
      return data;
    },
    enabled: !!institutionId,
  });

  // Criar cupom
  const createCoupon = useMutation({
    mutationFn: async (coupon: Omit<InstitutionCoupon, 'id' | 'created_at' | 'updated_at' | 'current_usage_count'>) => {
      const { data, error } = await supabase
        .from('institution_coupons')
        .insert(coupon)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['institution-coupons'] });
      toast({ title: 'Cupom criado com sucesso!' });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao criar cupom',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Atualizar cupom
  const updateCoupon = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<InstitutionCoupon> & { id: string }) => {
      const { data, error } = await supabase
        .from('institution_coupons')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['institution-coupons'] });
      toast({ title: 'Cupom atualizado com sucesso!' });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao atualizar cupom',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Deletar cupom
  const deleteCoupon = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('institution_coupons')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['institution-coupons'] });
      toast({ title: 'Cupom removido com sucesso!' });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao remover cupom',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Validar cupom
  const validateCoupon = async (
    code: string,
    professionalId: number,
    amount: number,
    tenantId: string
  ) => {
    const { data: session } = await supabase.auth.getSession();
    if (!session.session?.user) {
      throw new Error('Usuário não autenticado');
    }

    const { data, error } = await supabase.rpc('validate_coupon', {
      _code: code,
      _user_id: session.session.user.id,
      _professional_id: professionalId,
      _amount: amount,
      _tenant_id: tenantId,
    });

    if (error) throw error;
    return data[0];
  };

  return {
    coupons: coupons || [],
    couponUsage: couponUsage || [],
    isLoading,
    createCoupon: createCoupon.mutate,
    updateCoupon: updateCoupon.mutate,
    deleteCoupon: deleteCoupon.mutate,
    validateCoupon,
    isCreating: createCoupon.isPending,
    isUpdating: updateCoupon.isPending,
    isDeleting: deleteCoupon.isPending,
  };
};
