import { useEffect, useState } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';

interface FirstLoginState {
  isFirstLogin: boolean;
  isProfessional: boolean;
  loading: boolean;
  markFirstLoginComplete: () => void;
}

export const useFirstLoginDetection = (): FirstLoginState => {
  const { user, loading: authLoading } = useAuth();
  const [isFirstLogin, setIsFirstLogin] = useState(false);
  const [isProfessional, setIsProfessional] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkFirstLogin = async () => {
      if (authLoading) {
        return; // Wait for auth to load
      }
      
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        console.log('🔍 [useFirstLoginDetection] Checking first login for user:', user.email);
        
        // Verifica se é profissional
        const { data: professional, error: profError } = await supabase
          .from('profissionais')
          .select('id, user_id')
          .eq('user_email', user.email)
          .maybeSingle();

        console.log('🔍 [useFirstLoginDetection] Professional check result:', { professional, profError });

        const userIsProfessional = !!professional;
        setIsProfessional(userIsProfessional);

        if (userIsProfessional) {
          // Verifica se já tem Google Calendar conectado
          const { data: profile } = await supabase
            .from('profiles')
            .select('google_calendar_token')
            .eq('user_id', user.id)
            .maybeSingle();
          
          const hasGoogleCalendar = !!profile?.google_calendar_token;
          
          console.log('🔍 [useFirstLoginDetection] Professional user - Google Calendar status:', hasGoogleCalendar);
          
          // Para profissionais, verifica se ainda não viu o modal de boas-vindas
          const loginKey = `google_calendar_welcome_shown_${user.id}`;
          const hasSeenWelcome = localStorage.getItem(loginKey);
          
          console.log('🔍 [useFirstLoginDetection] Professional user - localStorage key:', loginKey);
          console.log('🔍 [useFirstLoginDetection] Has seen welcome before:', hasSeenWelcome);
          
          // Só é primeiro login se não viu o welcome E não tem Google Calendar conectado
          const isFirst = !hasSeenWelcome && !hasGoogleCalendar;
          setIsFirstLogin(isFirst);
          
          console.log('🔍 [useFirstLoginDetection] Final result - isFirstLogin:', isFirst, 'isProfessional:', userIsProfessional);
        } else {
          console.log('🔍 [useFirstLoginDetection] Not a professional user');
          setIsFirstLogin(false);
        }
      } catch (error) {
        console.error('❌ [useFirstLoginDetection] Error checking first login:', error);
        setIsFirstLogin(false);
      } finally {
        setLoading(false);
      }
    };

    checkFirstLogin();
  }, [user, authLoading]);

  const markFirstLoginComplete = () => {
    if (user) {
      const loginKey = `google_calendar_welcome_shown_${user.id}`;
      localStorage.setItem(loginKey, 'true');
      setIsFirstLogin(false);
    }
  };

  return {
    isFirstLogin,
    isProfessional,
    loading,
    markFirstLoginComplete
  };
};