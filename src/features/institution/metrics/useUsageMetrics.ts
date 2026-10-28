import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { UsageMetrics } from './usageMetrics';

export function useUsageMetrics(institutionId: string, days: number, unit: string | null, course: string | null) {
  return useQuery({
    queryKey: ['institution-usage-metrics', institutionId, days, unit, course],
    enabled: !!institutionId,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data, error } = await (supabase.rpc as any)('get_institution_usage_metrics', {
        p_institution_id: institutionId, p_days: days, p_unit: unit, p_course: course,
      });
      if (error) throw error;
      return data as UsageMetrics;
    },
  });
}

export function useAcademicFilters(institutionId: string) {
  return useQuery({
    queryKey: ['institution-academic-filters', institutionId],
    enabled: !!institutionId,
    staleTime: 30 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('institution_academic_units')
        .select('id, name, level, parent_id')
        .eq('institution_id', institutionId)
        .in('level', ['unit', 'course'])
        .order('name');
      if (error) throw error;
      return data ?? [];
    },
  });
}
