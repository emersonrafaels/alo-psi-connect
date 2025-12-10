import { useState, useCallback } from 'react';
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
  period_comparison: {
    change_percent: number;
  };
}

const CACHE_KEY = 'predictive-insights';
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

export const usePredictiveInsights = (
  institutionId: string | undefined,
  dailyEntries: DailyEntry[] = [],
  metrics: WellbeingMetrics | null = null
) => {
  const queryClient = useQueryClient();
  const [isGenerating, setIsGenerating] = useState(false);

  // Check local cache
  const getCachedData = useCallback((): PredictiveResponse | null => {
    if (!institutionId) return null;
    
    try {
      const cached = localStorage.getItem(`${CACHE_KEY}-${institutionId}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        const age = Date.now() - new Date(parsed.generated_at).getTime();
        if (age < CACHE_TTL_MS) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Error reading cache:', e);
    }
    return null;
  }, [institutionId]);

  // Save to local cache
  const setCachedData = useCallback((data: PredictiveResponse) => {
    if (!institutionId) return;
    try {
      localStorage.setItem(`${CACHE_KEY}-${institutionId}`, JSON.stringify(data));
    } catch (e) {
      console.error('Error saving cache:', e);
    }
  }, [institutionId]);

  // Query for cached data
  const query = useQuery({
    queryKey: ['predictive-insights', institutionId],
    queryFn: async () => {
      const cached = getCachedData();
      if (cached) return cached;
      return null;
    },
    enabled: !!institutionId,
    staleTime: CACHE_TTL_MS,
  });

  // Mutation to generate new predictions
  const generateMutation = useMutation({
    mutationFn: async (): Promise<PredictiveResponse> => {
      if (!institutionId || dailyEntries.length < 3) {
        throw new Error('Dados insuficientes para análise preditiva');
      }

      const { data, error } = await supabase.functions.invoke('generate-predictive-wellbeing-insights', {
        body: {
          institutionId,
          dailyEntries,
          metrics,
        },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      return data as PredictiveResponse;
    },
    onSuccess: (data) => {
      setCachedData(data);
      queryClient.setQueryData(['predictive-insights', institutionId], data);
      toast.success('Análise preditiva gerada com sucesso!');
    },
    onError: (error: Error) => {
      console.error('Error generating predictions:', error);
      if (error.message.includes('Rate limit')) {
        toast.error('Limite de requisições atingido. Tente novamente em alguns minutos.');
      } else if (error.message.includes('Payment required')) {
        toast.error('Créditos de IA insuficientes. Entre em contato com o suporte.');
      } else {
        toast.error('Erro ao gerar análise preditiva');
      }
    },
    onMutate: () => {
      setIsGenerating(true);
    },
    onSettled: () => {
      setIsGenerating(false);
    },
  });

  const generatePredictions = useCallback(() => {
    if (dailyEntries.length < 3) {
      toast.error('Necessário ao menos 3 dias de dados para análise preditiva');
      return;
    }
    generateMutation.mutate();
  }, [generateMutation, dailyEntries.length]);

  const clearCache = useCallback(() => {
    if (institutionId) {
      localStorage.removeItem(`${CACHE_KEY}-${institutionId}`);
      queryClient.invalidateQueries({ queryKey: ['predictive-insights', institutionId] });
    }
  }, [institutionId, queryClient]);

  return {
    data: query.data,
    predictions: query.data?.predictions || [],
    forecast: query.data?.forecast || [],
    generatedAt: query.data?.generated_at,
    isLoading: query.isLoading,
    isGenerating: isGenerating || generateMutation.isPending,
    error: generateMutation.error,
    generatePredictions,
    clearCache,
    hasCache: !!getCachedData(),
    hasSufficientData: dailyEntries.length >= 3,
  };
};
