import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface GrowthMetric {
  month: string;
  professionals_added: number;
  students_enrolled: number;
}

interface EngagementMetrics {
  top_professionals: Array<{ name: string; appointments: number }>;
  total_appointments: number;
  cancelled_appointments: number;
  cancellation_rate: number;
  active_rate: number;
}

interface Alert {
  severity: 'high' | 'medium' | 'low';
  message: string;
  count: number;
}

export const useInstitutionDashboard = (institutionId: string | undefined) => {
  // Query 1: Métricas de crescimento
  const { data: growthData, isLoading: isLoadingGrowth } = useQuery({
    queryKey: ['institution-growth', institutionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_institution_growth_metrics', { p_institution_id: institutionId });
      
      if (error) throw error;
      return data as GrowthMetric[];
    },
    enabled: !!institutionId,
  });

  // Query 2: Métricas de engajamento
  const { data: engagementData, isLoading: isLoadingEngagement } = useQuery({
    queryKey: ['institution-engagement', institutionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_institution_engagement_metrics', { p_institution_id: institutionId });
      
      if (error) throw error;
      return data as unknown as EngagementMetrics;
    },
    enabled: !!institutionId,
  });

  // Query 3: Alertas
  const { data: alerts, isLoading: isLoadingAlerts } = useQuery({
    queryKey: ['institution-alerts', institutionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_institution_alerts', { p_institution_id: institutionId });
      
      if (error) throw error;
      return data as Alert[];
    },
    enabled: !!institutionId,
  });

  return {
    growthData: growthData || [],
    engagementData: engagementData || null,
    alerts: alerts || [],
    isLoading: isLoadingGrowth || isLoadingEngagement || isLoadingAlerts,
  };
};
