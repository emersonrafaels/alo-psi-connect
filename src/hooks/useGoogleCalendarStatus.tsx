import { useEffect, useState } from 'react';
import { useAuth } from './useAuth';
import { useUserProfile } from './useUserProfile';
import { supabase } from '@/integrations/supabase/client';

interface GoogleCalendarStatus {
  isConnected: boolean;
  loading: boolean;
  refetch: () => void;
}

export const useGoogleCalendarStatus = (): GoogleCalendarStatus => {
  const { user } = useAuth();
  const { profile } = useUserProfile();
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  useEffect(() => {
    const checkGoogleCalendarStatus = async () => {
      if (!user || !profile) {
        setIsConnected(false);
        setLoading(false);
        return;
      }

      try {
        // Verifica se o perfil tem tokens do Google Calendar salvos
        const { data, error } = await supabase
          .from('profiles')
          .select('google_calendar_token, google_calendar_refresh_token')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) {
          console.error('Error checking Google Calendar status:', error);
          setIsConnected(false);
        } else if (data) {
          // Considera conectado se tem pelo menos o access token
          setIsConnected(!!data.google_calendar_token);
        } else {
          setIsConnected(false);
        }
      } catch (error) {
        console.error('Error checking Google Calendar status:', error);
        setIsConnected(false);
      } finally {
        setLoading(false);
      }
    };

    checkGoogleCalendarStatus();
  }, [user, profile, refetchTrigger]);

  const refetch = () => {
    // Add debounce to prevent multiple rapid calls
    setTimeout(() => {
      console.log('Refetch Google Calendar status triggered');
      setRefetchTrigger(prev => prev + 1);
      setLoading(true);
    }, 1000); // 1 segundo de delay para garantir que tokens foram salvos
  };

  return { isConnected, loading, refetch };
};