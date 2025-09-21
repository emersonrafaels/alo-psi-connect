import { useEffect, useState, useMemo } from 'react';
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

        // Se há perfil, verificar se é profissional e buscar foto adicional
        if (data && data.tipo_usuario === 'profissional') {
          console.log('useUserProfile: User is professional, fetching photo from profissionais table');
          
          const { data: professionalData } = await supabase
            .from('profissionais')
            .select('foto_perfil_url')
            .eq('profile_id', data.id)
            .maybeSingle();

          if (professionalData?.foto_perfil_url && !data.foto_perfil_url) {
            // Se há foto no profissionais mas não no profiles, usar a do profissionais
            data.foto_perfil_url = professionalData.foto_perfil_url;
            console.log('useUserProfile: Using photo from profissionais table:', professionalData.foto_perfil_url);
          }
        }

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

  // Estabilizar objeto profile para evitar re-renders desnecessários
  const stableProfile = useMemo(() => profile, [profile]);
  const stableHasProfile = useMemo(() => !!profile, [profile]);

  return { 
    profile: stableProfile, 
    loading, 
    hasProfile: stableHasProfile, 
    refetch 
  };
};