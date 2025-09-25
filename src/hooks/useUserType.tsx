import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useAuth } from './useAuth';
import { useUserProfile } from './useUserProfile';
import { supabase } from '@/integrations/supabase/client';
import { useLocalStorage } from './useLocalStorage';

interface UserTypeInfo {
  isProfessional: boolean;
  professionalId: string | null;
  loading: boolean;
}

export const useUserType = (): UserTypeInfo => {
  const { user } = useAuth();
  const { profile } = useUserProfile();
  const executingRef = useRef(false);
  const debounceRef = useRef<NodeJS.Timeout>();
  
  // Cache professional status in session storage for each user
  const cacheKey = `professional_status_${user?.id || 'anonymous'}`;
  const [cachedStatus, setCachedStatus] = useLocalStorage<{
    isProfessional: boolean;
    professionalId: string | null;
    profileId: string | null;
    timestamp: number;
  } | null>(cacheKey, null);

  const [isProfessional, setIsProfessional] = useState(() => {
    // Initialize from cache if available and recent (within 30 minutes)
    if (cachedStatus && profile?.id === cachedStatus.profileId) {
      const isRecent = Date.now() - cachedStatus.timestamp < 30 * 60 * 1000;
      return isRecent ? cachedStatus.isProfessional : false;
    }
    return false;
  });
  
  const [professionalId, setProfessionalId] = useState<string | null>(() => {
    if (cachedStatus && profile?.id === cachedStatus.profileId) {
      const isRecent = Date.now() - cachedStatus.timestamp < 30 * 60 * 1000;
      return isRecent ? cachedStatus.professionalId : null;
    }
    return null;
  });
  
  const [loading, setLoading] = useState(() => {
    // Don't show loading if we have recent cached data
    if (cachedStatus && profile?.id === cachedStatus.profileId) {
      const isRecent = Date.now() - cachedStatus.timestamp < 30 * 60 * 1000;
      return !isRecent;
    }
    return true;
  });

  // Update cache when status changes
  const updateCache = useCallback((professional: boolean, profId: string | null) => {
    if (profile?.id) {
      setCachedStatus({
        isProfessional: professional,
        professionalId: profId,
        profileId: profile.id,
        timestamp: Date.now()
      });
    }
  }, [profile?.id, setCachedStatus]);

  const checkProfessionalStatus = useCallback(async () => {
    // Prevenir execução simultânea
    if (executingRef.current) return;
    
    if (!user) {
      setIsProfessional(false);
      setProfessionalId(null);
      setLoading(false);
      return;
    }

    if (!profile) {
      setLoading(true);
      return; // Keep loading until profile loads
    }

    // Check if we have recent cached data for this profile
    if (cachedStatus && cachedStatus.profileId === profile.id) {
      const isRecent = Date.now() - cachedStatus.timestamp < 30 * 60 * 1000; // 30 minutes
      if (isRecent) {
        setIsProfessional(cachedStatus.isProfessional);
        setProfessionalId(cachedStatus.professionalId);
        setLoading(false);
        return;
      }
    }

    // Quick check: if profile type is not 'profissional', skip database query
    if (profile.tipo_usuario !== 'profissional') {
      setIsProfessional(false);
      setProfessionalId(null);
      updateCache(false, null);
      setLoading(false);
      return;
    }

    executingRef.current = true;

    try {
      // Check if user has a professional profile AND it's active
      const { data: professionalData, error } = await supabase
        .from('profissionais')
        .select('id, profile_id, ativo')
        .eq('profile_id', profile.id)
        .eq('ativo', true)  // Only get active professionals
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('❌ [useUserType] Error checking professional status:', error);
        setIsProfessional(false);
        setProfessionalId(null);
        updateCache(false, null);
      } else if (professionalData) {
        const profId = professionalData.id.toString();
        setIsProfessional(true);
        setProfessionalId(profId);
        updateCache(true, profId);
      } else {
        setIsProfessional(false);
        setProfessionalId(null);
        updateCache(false, null);
      }
    } catch (error) {
      console.error('❌ [useUserType] Error checking professional status:', error);
      setIsProfessional(false);
      setProfessionalId(null);
      updateCache(false, null);
    } finally {
      setLoading(false);
      executingRef.current = false;
    }
  }, [user?.id, profile?.id, profile?.tipo_usuario, cachedStatus, updateCache]);

  // Memoize the final result to prevent unnecessary re-renders
  const result = useMemo(() => ({
    isProfessional,
    professionalId,
    loading
  }), [isProfessional, professionalId, loading]);

  // Effect com debounce para verificar status
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    debounceRef.current = setTimeout(() => {
      checkProfessionalStatus();
    }, 100);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [checkProfessionalStatus]);

  // Clear cache when user changes
  useEffect(() => {
    if (user) {
      // Clear cache for different user
      const currentCacheKey = `professional_status_${user.id}`;
      if (cacheKey !== currentCacheKey) {
        setCachedStatus(null);
      }
    } else {
      // Clear all when no user
      setCachedStatus(null);
    }
  }, [user?.id, cacheKey, setCachedStatus]);

  return result;
};