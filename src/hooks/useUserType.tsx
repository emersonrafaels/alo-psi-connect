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
  const { profile, refetch: refetchProfile } = useUserProfile();
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
          console.log('Professional found:', professionalData);
          setIsProfessional(true);
          setProfessionalId(professionalData.id.toString());
        } else {
          console.log('No professional profile found for user');
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

  // Force refresh when profile changes due to the data fix
  useEffect(() => {
    if (profile && profile.tipo_usuario === 'profissional' && !isProfessional && !loading) {
      console.log('Profile updated to professional, refreshing...');
      refetchProfile();
    }
  }, [profile, isProfessional, loading, refetchProfile]);

  return { isProfessional, professionalId, loading };
};