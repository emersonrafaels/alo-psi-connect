import { useEffect, useState } from 'react';
import { useAuth } from './useAuth';
import { useUserProfile } from './useUserProfile';
import { supabase } from '@/integrations/supabase/client';

interface UserTypeInfo {
  isProfessional: boolean;
  professionalId: string | null;
  loading: boolean;
}

export const useUserType = (): UserTypeInfo => {
  const { user } = useAuth();
  const { profile } = useUserProfile();
  const [isProfessional, setIsProfessional] = useState(false);
  const [professionalId, setProfessionalId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkProfessionalStatus = async () => {
      if (!user || !profile) {
        setIsProfessional(false);
        setProfessionalId(null);
        setLoading(false);
        return;
      }

      try {
        // Check if user has a professional profile
        const { data: professionalData, error } = await supabase
          .from('profissionais')
          .select('id, profile_id')
          .eq('profile_id', profile.id)
          .maybeSingle();

        if (error && error.code !== 'PGRST116') {
          console.error('Error checking professional status:', error);
          setIsProfessional(false);
          setProfessionalId(null);
        } else if (professionalData) {
          setIsProfessional(true);
          setProfessionalId(professionalData.id.toString());
        } else {
          setIsProfessional(false);
          setProfessionalId(null);
        }
      } catch (error) {
        console.error('Error checking professional status:', error);
        setIsProfessional(false);
        setProfessionalId(null);
      } finally {
        setLoading(false);
      }
    };

    checkProfessionalStatus();
  }, [user, profile]);

  return { isProfessional, professionalId, loading };
};