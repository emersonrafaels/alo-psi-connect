import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

type AnalyticsEvent = 'view' | 'register_click' | 'share' | 'calendar_add' | 'waitlist_join';

export const useSessionAnalytics = () => {
  const { user } = useAuth();

  const trackEvent = async (
    sessionId: string,
    eventType: AnalyticsEvent,
    metadata?: Record<string, any>
  ) => {
    try {
      await supabase.from('group_session_analytics').insert({
        session_id: sessionId,
        event_type: eventType,
        user_id: user?.id || null,
        metadata: metadata || {},
      });
    } catch (error) {
      console.error('Error tracking analytics:', error);
    }
  };

  return { trackEvent };
};