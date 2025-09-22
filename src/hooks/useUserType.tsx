import { useEffect, useState, useCallback } from 'react';
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

  const checkProfessionalStatus = useCallback(async () => {
    console.log('🔍 [useUserType] Checking professional status...', { 
      user: !!user, 
      userId: user?.id,
      profile: !!profile, 
      profileId: profile?.id,
      profileType: profile?.tipo_usuario,
      userEmail: user?.email || profile?.email
    });
    
    if (!user) {
      console.log('🔍 [useUserType] No user, setting as non-professional');
      setIsProfessional(false);
      setProfessionalId(null);
      setLoading(false);
      return;
    }

    if (!profile) {
      console.log('🔍 [useUserType] No profile yet, keeping loading state');
      return; // Keep loading until profile loads
    }

    // Quick check: if profile type is not 'profissional', skip database query
    if (profile.tipo_usuario !== 'profissional') {
      console.log('🔍 [useUserType] Profile type is not professional:', profile.tipo_usuario);
      setIsProfessional(false);
      setProfessionalId(null);
      setLoading(false);
      return;
    }

    try {
      // Check if user has a professional profile AND it's active
      const { data: professionalData, error } = await supabase
        .from('profissionais')
        .select('id, profile_id, ativo')
        .eq('profile_id', profile.id)
        .eq('ativo', true)  // Only get active professionals
        .maybeSingle();

      console.log('🔍 [useUserType] Professional query result:', { professionalData, error, profileId: profile.id });

      if (error && error.code !== 'PGRST116') {
        console.error('❌ [useUserType] Error checking professional status:', error);
        setIsProfessional(false);
        setProfessionalId(null);
      } else if (professionalData) {
        console.log('✅ [useUserType] Active professional found:', professionalData);
        setIsProfessional(true);
        setProfessionalId(professionalData.id.toString());
      } else {
        console.log('❌ [useUserType] No active professional profile found for user');
        setIsProfessional(false);
        setProfessionalId(null);
      }
    } catch (error) {
      console.error('❌ [useUserType] Error checking professional status:', error);
      setIsProfessional(false);
      setProfessionalId(null);
    } finally {
      setLoading(false);
    }
  }, [user?.id, profile?.id, profile?.tipo_usuario]);

  useEffect(() => {
    checkProfessionalStatus();
  }, [checkProfessionalStatus]);

  // Force refresh when profile changes due to the data fix
  useEffect(() => {
    if (profile && profile.tipo_usuario === 'profissional' && !isProfessional && !loading) {
      console.log('🔄 [useUserType] Profile updated to professional, refreshing...');
      refetchProfile();
    }
  }, [profile, isProfessional, loading, refetchProfile]);

  // Reset loading when user changes
  useEffect(() => {
    if (user) {
      setLoading(true);
    }
  }, [user]);

  console.log('🔍 [useUserType] Final state:', { isProfessional, professionalId, loading, profileType: profile?.tipo_usuario });

  return { isProfessional, professionalId, loading };
};