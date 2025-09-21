import { useState, useCallback, useEffect } from 'react';
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
  insightId?: string;
  currentUsage: number;
  limit: number;
  isGuest: boolean;
  limitReached?: boolean;
  error?: string;
}

interface InsightHistory {
  id: string;
  insight_content: string;
  mood_data: any;
  created_at: string;
  feedback_rating?: boolean;
  feedback_comment?: string;
  feedback_submitted_at?: string;
}

export const useAIInsights = () => {
  const [insights, setInsights] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [currentUsage, setCurrentUsage] = useState(0);
  const [limit, setLimit] = useState(0);
  const [limitReached, setLimitReached] = useState(false);
  const [insightHistory, setInsightHistory] = useState<InsightHistory[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [usageLoading, setUsageLoading] = useState(true);
  
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

  // Fetch current usage count
  const fetchCurrentUsage = useCallback(async () => {
    setUsageLoading(true);
    try {
      const now = new Date();
      const monthYear = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      
      let whereClause: any = { month_year: monthYear };
      if (user) {
        whereClause.user_id = user.id;
      } else {
        whereClause.session_id = getSessionId();
        whereClause.user_id = null;
      }

      const { data, error } = await supabase
        .from('ai_insights_usage')
        .select('insights_count')
        .match(whereClause)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      setCurrentUsage(data?.insights_count || 0);
    } catch (err) {
      console.error('Error fetching current usage:', err);
    } finally {
      setUsageLoading(false);
    }
  }, [user, getSessionId]);

  // Fetch usage on component mount
  useEffect(() => {
    fetchCurrentUsage();
  }, [fetchCurrentUsage]);

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

  const fetchInsightHistory = useCallback(async () => {
    if (!user && !getSessionId()) return;
    
    setHistoryLoading(true);
    try {
      const { data, error } = await supabase
        .from('ai_insights_history')
        .select('*')
        .eq(user ? 'user_id' : 'session_id', user?.id || getSessionId())
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInsightHistory(data || []);
    } catch (err) {
      console.error('Error fetching insight history:', err);
    } finally {
      setHistoryLoading(false);
    }
  }, [user, getSessionId]);

  const submitFeedback = useCallback(async (insightId: string, rating: boolean, comment?: string) => {
    try {
      const { error } = await supabase
        .from('ai_insights_history')
        .update({
          feedback_rating: rating,
          feedback_comment: comment,
          feedback_submitted_at: new Date().toISOString()
        })
        .eq('id', insightId);

      if (error) throw error;
      
      // Update local state
      setInsightHistory(prev => 
        prev.map(insight => 
          insight.id === insightId 
            ? { 
                ...insight, 
                feedback_rating: rating, 
                feedback_comment: comment, 
                feedback_submitted_at: new Date().toISOString() 
              }
            : insight
        )
      );
    } catch (err) {
      console.error('Error submitting feedback:', err);
      throw err;
    }
  }, []);

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
    isGuest: !user,
    insightHistory,
    historyLoading,
    fetchInsightHistory,
    submitFeedback,
    usageLoading
  };
};