import { useEffect, useState } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';

export const useUserProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) {
        console.log('useUserProfile: No user found');
        setProfile(null);
        setLoading(false);
        return;
      }

      console.log('useUserProfile: Fetching profile for user:', user.id, 'email:', user.email);

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) {
          console.error('useUserProfile: Error fetching profile:', error);
          throw error;
        }

        console.log('useUserProfile: Profile data fetched:', data);
        setProfile(data);

        // Se não há perfil, criar um automaticamente
        if (!data && user.email) {
          console.log('useUserProfile: No profile found, creating new profile');
          await createInitialProfile(user);
        }
      } catch (error) {
        console.error('useUserProfile: Error in fetchProfile:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user, refetchTrigger]);

  const createInitialProfile = async (user: any) => {
    try {
      console.log('useUserProfile: Creating initial profile for user:', user.id);
      
      const profileData = {
        user_id: user.id,
        email: user.email || '',
        nome: user.user_metadata?.full_name || user.user_metadata?.name || '',
        tipo_usuario: 'paciente',
        foto_perfil_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || null
      };

      const { data, error } = await supabase
        .from('profiles')
        .insert(profileData)
        .select()
        .single();

      if (error) {
        console.error('useUserProfile: Error creating profile:', error);
        return;
      }

      console.log('useUserProfile: Profile created successfully:', data);
      setProfile(data);
      
      // Se há uma foto do Google, salvar no S3
      if (user.user_metadata?.avatar_url || user.user_metadata?.picture) {
        const photoUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture;
        console.log('useUserProfile: Saving Google photo to S3:', photoUrl);
        // Aqui poderíamos chamar saveGooglePhoto, mas vamos deixar isso para o useProfileManager
      }
    } catch (error) {
      console.error('useUserProfile: Error in createInitialProfile:', error);
    }
  };

  const refetch = () => setRefetchTrigger(prev => prev + 1);

  return { profile, loading, hasProfile: !!profile, refetch };
};