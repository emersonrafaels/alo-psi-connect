import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { usePublicConfig } from './usePublicConfig';
import { useAuth } from './useAuth';

interface MoodEntry {
  date: string;
  mood_score: number;
  energy_level: number;
  anxiety_level: number;
  sleep_hours: number;
  sleep_quality: number;
  journal_text?: string;
  tags?: string[];
}

interface InsightResponse {
  insights?: string;
  currentUsage: number;
  limit: number;
  isGuest: boolean;
  limitReached?: boolean;
  error?: string;
}

export const useAIInsights = () => {
  const [insights, setInsights] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [currentUsage, setCurrentUsage] = useState(0);
  const [limit, setLimit] = useState(0);
  const [limitReached, setLimitReached] = useState(false);
  
  const { user } = useAuth();
  const { getConfig } = usePublicConfig(['system']);

  // Generate a session ID for guest users
  const getSessionId = useCallback(() => {
    let sessionId = localStorage.getItem('mood_session_id');
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      localStorage.setItem('mood_session_id', sessionId);
    }
    return sessionId;
  }, []);

  const generateInsights = useCallback(async (moodEntries: MoodEntry[]) => {
    if (!moodEntries || moodEntries.length === 0) {
      setError('Nenhum dado do diário emocional disponível');
      return;
    }

    setLoading(true);
    setError('');
    setInsights('');

    try {
      // Prepare request data
      const requestData = {
        moodEntries: moodEntries.map(entry => ({
          date: entry.date,
          mood_score: entry.mood_score || 0,
          energy_level: entry.energy_level || 0,
          anxiety_level: entry.anxiety_level || 0,
          sleep_hours: entry.sleep_hours || 0,
          sleep_quality: entry.sleep_quality || 0,
          journal_text: entry.journal_text,
          tags: entry.tags
        })),
        sessionId: user ? undefined : getSessionId()
      };

      // Call the edge function
      const { data, error: functionError } = await supabase.functions.invoke(
        'generate-mood-insights',
        {
          body: requestData
        }
      );

      if (functionError) {
        throw new Error(functionError.message || 'Erro ao gerar insights');
      }

      const response = data as InsightResponse;

      if (response.error || response.limitReached) {
        setError(response.error || 'Limite de insights atingido');
        setLimitReached(true);
        setCurrentUsage(response.currentUsage || 0);
        setLimit(response.limit || 0);
        return;
      }

      setInsights(response.insights || '');
      setCurrentUsage(response.currentUsage);
      setLimit(response.limit);
      setLimitReached(false);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      console.error('Error generating insights:', err);
    } finally {
      setLoading(false);
    }
  }, [user, getSessionId]);

  const clearInsights = useCallback(() => {
    setInsights('');
    setError('');
    setLimitReached(false);
  }, []);

  // Get current limits from config
  const guestLimit = getConfig('system', 'guest_insights_limit', 3);
  const userLimit = getConfig('system', 'user_insights_limit', 6);
  const maxLimit = user ? userLimit : guestLimit;

  return {
    insights,
    loading,
    error,
    currentUsage,
    limit: limit || maxLimit,
    limitReached,
    generateInsights,
    clearInsights,
    isGuest: !user
  };
};