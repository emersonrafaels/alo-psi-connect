import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface InstitutionMetrics {
  id: string;
  name: string;
  type: 'public' | 'private';
  is_active: boolean;
  has_partnership: boolean;
  total_users: number;
  total_professionals: number;
  total_active_coupons: number;
  total_coupon_uses: number;
  total_discount_given: number;
  last_user_added: string | null;
  last_professional_added: string | null;
  institution_created_at: string;
}

export interface AggregatedStats {
  totalActiveInstitutions: number;
  totalInactiveInstitutions: number;
  totalUsers: number;
  totalProfessionals: number;
  totalActiveCoupons: number;
  totalCouponUses: number;
  totalDiscountsGiven: number;
  publicInstitutions: number;
  privateInstitutions: number;
  withPartnership: number;
  withoutPartnership: number;
}

export const useInstitutionMetrics = () => {
  const queryClient = useQueryClient();

  const { data: metrics = [], isLoading, error, refetch } = useQuery({
    queryKey: ['institution-metrics'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_institution_metrics');
      
      if (error) {
        console.error('Error fetching institution metrics:', error);
        throw error;
      }
      
      return (data || []) as InstitutionMetrics[];
    },
  });

  // Mutation para refresh da materialized view
  const refreshMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc('refresh_institution_metrics');
      
      if (error) {
        console.error('Error refreshing metrics:', error);
        throw error;
      }
      
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['institution-metrics'] });
      toast.success('Métricas atualizadas com sucesso!');
    },
    onError: (error: any) => {
      console.error('Error refreshing metrics:', error);
      toast.error('Erro ao atualizar métricas');
    },
  });

  // Calcular estatísticas agregadas
  const aggregatedStats: AggregatedStats = {
    totalActiveInstitutions: metrics.filter(m => m.is_active).length,
    totalInactiveInstitutions: metrics.filter(m => !m.is_active).length,
    totalUsers: metrics.reduce((sum, m) => sum + m.total_users, 0),
    totalProfessionals: metrics.reduce((sum, m) => sum + m.total_professionals, 0),
    totalActiveCoupons: metrics.reduce((sum, m) => sum + m.total_active_coupons, 0),
    totalCouponUses: metrics.reduce((sum, m) => sum + m.total_coupon_uses, 0),
    totalDiscountsGiven: metrics.reduce((sum, m) => sum + m.total_discount_given, 0),
    publicInstitutions: metrics.filter(m => m.type === 'public').length,
    privateInstitutions: metrics.filter(m => m.type === 'private').length,
    withPartnership: metrics.filter(m => m.has_partnership).length,
    withoutPartnership: metrics.filter(m => !m.has_partnership).length,
  };

  // Dados para gráficos
  const typeDistribution = [
    { name: 'Pública', value: aggregatedStats.publicInstitutions },
    { name: 'Privada', value: aggregatedStats.privateInstitutions },
  ];

  const partnershipDistribution = [
    { name: 'Com Parceria', value: aggregatedStats.withPartnership },
    { name: 'Sem Parceria', value: aggregatedStats.withoutPartnership },
  ];

  // Top 10 por usuários
  const topByUsers = [...metrics]
    .sort((a, b) => b.total_users - a.total_users)
    .slice(0, 10)
    .map(m => ({
      name: m.name.length > 20 ? m.name.substring(0, 20) + '...' : m.name,
      value: m.total_users,
    }));

  // Top 10 por profissionais
  const topByProfessionals = [...metrics]
    .sort((a, b) => b.total_professionals - a.total_professionals)
    .slice(0, 10)
    .map(m => ({
      name: m.name.length > 20 ? m.name.substring(0, 20) + '...' : m.name,
      value: m.total_professionals,
    }));

  // Top 10 por cupons ativos
  const topByCoupons = [...metrics]
    .sort((a, b) => b.total_active_coupons - a.total_active_coupons)
    .slice(0, 10)
    .map(m => ({
      name: m.name.length > 20 ? m.name.substring(0, 20) + '...' : m.name,
      value: m.total_active_coupons,
    }));

  // Taxa de uso de cupons
  const couponUsageRate = metrics
    .filter(m => m.total_active_coupons > 0)
    .map(m => ({
      name: m.name.length > 20 ? m.name.substring(0, 20) + '...' : m.name,
      rate: m.total_active_coupons > 0 
        ? Math.round((m.total_coupon_uses / m.total_active_coupons) * 100) 
        : 0,
    }))
    .sort((a, b) => b.rate - a.rate)
    .slice(0, 10);

  return {
    metrics,
    isLoading,
    error,
    refetch,
    aggregatedStats,
    typeDistribution,
    partnershipDistribution,
    topByUsers,
    topByProfessionals,
    topByCoupons,
    couponUsageRate,
    refreshMetrics: refreshMutation.mutate,
    isRefreshing: refreshMutation.isPending,
  };
};
