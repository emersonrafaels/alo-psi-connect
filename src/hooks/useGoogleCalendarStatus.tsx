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
      console.log('[useGoogleCalendarStatus] Checking status...', {
        hasUser: !!user,
        hasProfile: !!profile,
        userId: user?.id,
        refetchTrigger
      });
      
      if (!user || !profile) {
        console.log('[useGoogleCalendarStatus] No user or profile, setting disconnected');
        setIsConnected(false);
        setLoading(false);
        return;
      }

      // Add a small delay to allow database writes to complete
      if (refetchTrigger > 0) {
        console.log('[useGoogleCalendarStatus] Waiting for database sync...');
        await new Promise(resolve => setTimeout(resolve, 1500));
      }

      try {
        console.log('[useGoogleCalendarStatus] Fetching tokens from database...');
        
        // Verifica se o perfil tem tokens do Google Calendar salvos
        const { data, error } = await supabase
          .from('profiles')
          .select('google_calendar_token, google_calendar_refresh_token, google_calendar_scope')
          .eq('user_id', user.id)
          .maybeSingle();

        console.log('[useGoogleCalendarStatus] Database response:', {
          error,
          hasData: !!data,
          hasAccessToken: !!data?.google_calendar_token,
          hasRefreshToken: !!data?.google_calendar_refresh_token,
          tokenLength: data?.google_calendar_token?.length || 0,
          scope: data?.google_calendar_scope || 'none'
        });

        if (error) {
          console.error('[useGoogleCalendarStatus] Error checking status:', error);
          setIsConnected(false);
        } else if (data) {
          // Considera conectado se tem pelo menos o access token
          const connected = !!data.google_calendar_token;
          console.log('[useGoogleCalendarStatus] Setting connected status:', connected);
          setIsConnected(connected);
        } else {
          console.log('[useGoogleCalendarStatus] No data found, setting disconnected');
          setIsConnected(false);
        }
      } catch (error) {
        console.error('[useGoogleCalendarStatus] Exception checking status:', error);
        setIsConnected(false);
      } finally {
        setLoading(false);
      }
    };

    checkGoogleCalendarStatus();
  }, [user, profile, refetchTrigger]);

  const refetch = () => {
    console.log('[useGoogleCalendarStatus] Refetch solicitado, invalidando cache...');
    setIsConnected(false);
    setLoading(true);
    setRefetchTrigger(prev => prev + 1);
  };

  return { isConnected, loading, refetch };
};