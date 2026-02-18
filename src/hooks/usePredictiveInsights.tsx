import { useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface PredictiveInsight {
  type: 'trend' | 'alert' | 'pattern' | 'recommendation' | 'correlation';
  severity: 'low' | 'medium' | 'high';
  metric: string;
  prediction_value?: number;
  confidence: number;
  timeframe_days?: number;
  title: string;
  description: string;
  action_items?: string[];
}

export interface ForecastPoint {
  date: string;
  predicted_mood?: number;
  predicted_anxiety?: number;
  confidence_low?: number;
  confidence_high?: number;
}

interface PredictiveResponse {
  predictions: PredictiveInsight[];
  forecast: ForecastPoint[];
  generated_at: string;
  error?: string;
}

interface DailyEntry {
  date: string;
  avg_mood: number | null;
  avg_anxiety: number | null;
  avg_sleep: number | null;
  avg_energy: number | null;
  entries_count: number;
}

interface WellbeingMetrics {
  avg_mood_score: number | null;
  avg_anxiety_level: number | null;
  avg_sleep_quality: number | null;
  avg_energy_level: number | null;
  students_with_entries: number;
  students_with_low_mood: number;
  mood_trend: 'up' | 'down' | 'stable';
  period_comparison: { current_avg: number; previous_avg: number; change_percent: number; };
}

const CACHE_KEY = 'predictive-insights';
const CACHE_TTL = 60 * 60 * 1000;
const COOLDOWN_MS = 15 * 60 * 1000;
const CACHE_VERSION = 3;

interface CachedData {
  data: PredictiveResponse;
  timestamp: number;
  dataHash: string;
  version: number;
}

const generateDataHash = (entries: DailyEntry[], notes: InstitutionalNote[] = []): string => {
  if (!entries?.length) return 'empty';
  const src = entries.map(e => `${e.date}:${e.avg_mood}:${e.avg_anxiety}:${e.avg_sleep}:${e.avg_energy}:${e.entries_count}`).join('|');
  const notesSrc = notes.map(n => `${n.title}:${n.note_type}:${n.start_date}:${n.end_date}`).join('|');
  const combined = src + '||' + notesSrc;
  let hash = 0;
  for (let i = 0; i < combined.length; i++) { hash = ((hash << 5) - hash) + combined.charCodeAt(i); hash = hash & hash; }
  return hash.toString(36);
};

const countNewEntriesSince = (entries: DailyEntry[], sinceDate: string): number => {
  const since = new Date(sinceDate);
  return entries.filter(e => new Date(e.date) > since).reduce((sum, e) => sum + e.entries_count, 0);
};

interface InstitutionalNote {
  title: string;
  content: string | null;
  note_type: string;
  start_date: string | null;
  end_date: string | null;
}

export const usePredictiveInsights = (institutionId: string | null, dailyEntries: DailyEntry[], metrics: WellbeingMetrics | null, institutionalNotes: InstitutionalNote[] = []) => {
  const queryClient = useQueryClient();
  const cacheKey = `${CACHE_KEY}-${institutionId}`;

  const getCachedData = useCallback((): CachedData | null => {
    try {
      const cached = localStorage.getItem(cacheKey);
      if (!cached) return null;
      const parsed = JSON.parse(cached) as CachedData;
      if (parsed.version !== CACHE_VERSION) { localStorage.removeItem(cacheKey); return null; }
      return parsed;
    } catch { return null; }
  }, [cacheKey]);

  const setCachedData = useCallback((data: PredictiveResponse, dataHash: string) => {
    try { localStorage.setItem(cacheKey, JSON.stringify({ data, timestamp: Date.now(), dataHash, version: CACHE_VERSION })); } catch {}
  }, [cacheKey]);

  const currentDataHash = useMemo(() => generateDataHash(dailyEntries, institutionalNotes), [dailyEntries, institutionalNotes]);
  const hasSufficientData = useMemo(() => dailyEntries.length >= 7 && metrics !== null, [dailyEntries, metrics]);

  const { data: cachedResult } = useQuery({
    queryKey: ['predictive-insights', institutionId],
    queryFn: () => getCachedData(),
    staleTime: CACHE_TTL,
    enabled: !!institutionId,
  });

  const cacheStatus = useMemo(() => {
    const cached = cachedResult;
    if (!cached || !cached.data) return { hasCache: false, isCacheValid: false, hasNewData: false, isCooldownActive: false, cooldownRemainingMs: 0, newEntriesCount: 0, lastGeneratedAt: null as string | null };
    const now = Date.now();
    const timeSince = now - cached.timestamp;
    const generatedAt = cached.data?.generated_at || null;
    return {
      hasCache: true,
      isCacheValid: timeSince < CACHE_TTL,
      hasNewData: cached.dataHash !== currentDataHash,
      isCooldownActive: timeSince < COOLDOWN_MS,
      cooldownRemainingMs: Math.max(0, COOLDOWN_MS - timeSince),
      newEntriesCount: generatedAt ? countNewEntriesSince(dailyEntries, generatedAt) : 0,
      lastGeneratedAt: generatedAt,
    };
  }, [cachedResult, currentDataHash, dailyEntries]);

  const canUpdate = useMemo(() => {
    if (!cacheStatus.hasCache) return true;
    if (cacheStatus.hasNewData) return true;
    if (cacheStatus.isCooldownActive) return false;
    return true;
  }, [cacheStatus]);

  const generateMutation = useMutation({
    mutationFn: async () => {
      if (!institutionId || !hasSufficientData) throw new Error('Dados insuficientes');
      const { data, error } = await supabase.functions.invoke('generate-predictive-wellbeing-insights', { body: { institutionId, dailyEntries, metrics, institutionalNotes } });
      if (error) throw error;
      return data as PredictiveResponse;
    },
    onSuccess: (data) => {
      setCachedData(data, currentDataHash);
      queryClient.setQueryData(['predictive-insights', institutionId], { data, timestamp: Date.now(), dataHash: currentDataHash, version: CACHE_VERSION });
      toast.success('Análise gerada com sucesso!');
    },
    onError: (err: any) => toast.error(err.message || 'Erro ao gerar análise'),
  });

  const generatePredictions = useCallback(async () => {
    if (!hasSufficientData) throw new Error('Necessário pelo menos 7 dias de registros.');
    if (!canUpdate) throw new Error('Aguarde o cooldown.');
    return generateMutation.mutateAsync();
  }, [hasSufficientData, canUpdate, generateMutation]);

  const clearCache = useCallback(() => { localStorage.removeItem(cacheKey); queryClient.invalidateQueries({ queryKey: ['predictive-insights', institutionId] }); }, [cacheKey, queryClient, institutionId]);

  return {
    data: cachedResult?.data || null,
    predictions: cachedResult?.data?.predictions || [],
    forecast: cachedResult?.data?.forecast || [],
    isLoading: generateMutation.isPending,
    isGenerating: generateMutation.isPending,
    error: generateMutation.error,
    generatePredictions,
    clearCache,
    hasCache: cacheStatus.hasCache,
    hasSufficientData,
    generatedAt: cachedResult?.data?.generated_at || null,
    canUpdate,
    hasNewData: cacheStatus.hasNewData,
    isCooldownActive: cacheStatus.isCooldownActive,
    cooldownRemainingMs: cacheStatus.cooldownRemainingMs,
    newEntriesCount: cacheStatus.newEntriesCount,
  };
};
