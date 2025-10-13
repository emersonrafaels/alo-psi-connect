import { useEffect, useState, useMemo, useRef } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useProfessionalRegistration } from '@/contexts/ProfessionalRegistrationContext';

export const useUserProfile = () => {
  const { user } = useAuth();
  const { isRegistering } = useProfessionalRegistration();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refetchTrigger, setRefetchTrigger] = useState(0);
  const executingRef = useRef(false);
  const debounceRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    // Guard para prevenir execução simultânea
    if (executingRef.current) return;

    // Debounce para evitar múltiplas chamadas
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(async () => {
      if (executingRef.current) return;
      executingRef.current = true;

      try {
        if (!user) {
          setProfile(null);
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) {
          console.error('useUserProfile: Error fetching profile:', error);
          throw error;
        }

        // Se há perfil, verificar se é profissional e buscar foto adicional
        if (data && data.tipo_usuario === 'profissional') {
          const { data: professionalData } = await supabase
            .from('profissionais')
            .select('foto_perfil_url')
            .eq('profile_id', data.id)
            .maybeSingle();

          if (professionalData?.foto_perfil_url && !data.foto_perfil_url) {
            // Se há foto no profissionais mas não no profiles, usar a do profissionais
            data.foto_perfil_url = professionalData.foto_perfil_url;
          }
        }

        setProfile(data);

        // Se não há perfil, verificar se usuário ainda existe antes de criar
        if (!data && user.email) {
          // 🛡️ Verificar se o usuário ainda existe no auth
          const { error: authError } = await supabase.auth.getUser();
          
          if (authError?.status === 403 || authError?.message?.includes('not found')) {
            console.log('🔒 [useUserProfile] User deleted - will not create profile');
            setProfile(null);
            return;
          }
          
          await createInitialProfile(user);
        }
      } catch (error) {
        console.error('useUserProfile: Error in fetchProfile:', error);
      } finally {
        setLoading(false);
        executingRef.current = false;
      }
    }, 150);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [user?.id, refetchTrigger]);

  const createInitialProfile = async (user: any) => {
    try {
      // 🛡️ SEGURANÇA: Não criar perfil automático se for cadastro profissional
      if (isRegistering) {
        console.log('🛡️ [useUserProfile] Skipping automatic profile creation - professional registration in progress via Context');
        console.log('🛡️ [useUserProfile] Context state:', { isRegistering });
        return;
      }
      
      console.log('✅ [useUserProfile] Creating automatic patient profile - Context state:', { isRegistering });
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
        // Se erro é foreign key (usuário não existe mais)
        if (error.code === '23503') {
          console.log('🔒 [useUserProfile] Cannot create profile - user deleted from auth');
          setProfile(null);
          return;
        }
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