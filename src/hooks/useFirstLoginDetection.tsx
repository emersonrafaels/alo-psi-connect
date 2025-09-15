import { useEffect, useState } from 'react';
import { useAuth } from './useAuth';
import { useUserProfile } from './useUserProfile';
import { supabase } from '@/integrations/supabase/client';

interface FirstLoginState {
  isFirstLogin: boolean;
  isProfessional: boolean;
  loading: boolean;
  markFirstLoginComplete: () => void;
}

export const useFirstLoginDetection = (): FirstLoginState => {
  const { user } = useAuth();
  const { profile } = useUserProfile();
  const [isFirstLogin, setIsFirstLogin] = useState(false);
  const [isProfessional, setIsProfessional] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkFirstLogin = async () => {
      if (!user || !profile) {
        setLoading(false);
        return;
      }

      try {
        // Verifica se é profissional
        const { data: professional } = await supabase
          .from('profissionais')
          .select('id, user_id')
          .eq('user_email', user.email)
          .maybeSingle();

        const userIsProfessional = !!professional;
        setIsProfessional(userIsProfessional);

        if (userIsProfessional) {
          // Para profissionais, verifica se ainda não viu o modal de boas-vindas
          // Usamos um campo ou a data de criação para determinar se é primeiro login
          const loginKey = `google_calendar_welcome_shown_${user.id}`;
          const hasSeenWelcome = localStorage.getItem(loginKey);
          
          // Se não viu o welcome e é profissional, é primeiro login
          setIsFirstLogin(!hasSeenWelcome);
        } else {
          setIsFirstLogin(false);
        }
      } catch (error) {
        console.error('Error checking first login:', error);
        setIsFirstLogin(false);
      } finally {
        setLoading(false);
      }
    };

    checkFirstLogin();
  }, [user, profile]);

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