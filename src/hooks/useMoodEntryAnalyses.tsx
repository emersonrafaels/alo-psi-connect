import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type MoodAnalysisRiskLevel = 'healthy' | 'attention' | 'alert' | 'critical';

export interface MoodEntryAnalysis {
  id: string;
  mood_entry_id: string;
  user_id: string;
  risk_level: MoodAnalysisRiskLevel | null;
  buddy_message: string | null;
  source: string;
  raw_payload: Record<string, any> | null;
  created_at: string;
  updated_at: string;
}

/**
 * Busca análises de IA para uma lista de mood entries.
 * Retorna um Map indexado por mood_entry_id para lookup O(1).
 */
export function useMoodEntryAnalyses(moodEntryIds: string[] | undefined, enabled: boolean = true) {
  const ids = (moodEntryIds || []).filter(Boolean);
  const cacheKey = [...ids].sort().join(',');

  return useQuery({
    queryKey: ['mood-entry-analyses', cacheKey],
    queryFn: async (): Promise<Map<string, MoodEntryAnalysis>> => {
      if (ids.length === 0) return new Map();
      const { data, error } = await supabase
        .from('mood_entry_analyses' as any)
        .select('*')
        .in('mood_entry_id', ids);
      if (error) {
        console.error('[useMoodEntryAnalyses] error:', error);
        return new Map();
      }
      const map = new Map<string, MoodEntryAnalysis>();
      (data || []).forEach((a: any) => map.set(a.mood_entry_id, a as MoodEntryAnalysis));
      return map;
    },
    enabled: enabled && ids.length > 0,
    staleTime: 30_000,
  });
}

export const RISK_LEVEL_META: Record<MoodAnalysisRiskLevel, { label: string; badgeClass: string; emoji: string }> = {
  healthy:   { label: 'Saudável',  badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-200 dark:border-emerald-800', emoji: '🟢' },
  attention: { label: 'Atenção',   badgeClass: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-950 dark:text-yellow-200 dark:border-yellow-800',     emoji: '🟡' },
  alert:     { label: 'Alerta',    badgeClass: 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-950 dark:text-orange-200 dark:border-orange-800',     emoji: '🟠' },
  critical:  { label: 'Crítico',   badgeClass: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-950 dark:text-red-200 dark:border-red-800',                       emoji: '🔴' },
};
