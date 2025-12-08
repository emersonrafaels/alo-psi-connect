import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useAuth } from './useAuth';
import { useUserProfile } from './useUserProfile';
import { supabase } from '@/integrations/supabase/client';
import { useLocalStorage } from './useLocalStorage';

// Increment this when cache structure changes to invalidate old caches
const CACHE_VERSION = 2;

interface UserTypeInfo {
  isProfessional: boolean;           // Has a professional profile (active OR inactive)
  isActiveProfessional: boolean;     // Is actively visible on the site
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
    version: number;
    isProfessional: boolean;
    isActiveProfessional: boolean;
    professionalId: string | null;
    profileId: string | null;
    timestamp: number;
  } | null>(cacheKey, null);

  const isCacheValid = (cache: typeof cachedStatus) => {
    if (!cache || !profile?.id) return false;
    if (cache.version !== CACHE_VERSION) return false;
    if (cache.profileId !== profile.id) return false;
    return Date.now() - cache.timestamp < 30 * 60 * 1000;
  };

  const [isProfessional, setIsProfessional] = useState(() => {
    return isCacheValid(cachedStatus) ? cachedStatus!.isProfessional : false;
  });

  const [isActiveProfessional, setIsActiveProfessional] = useState(() => {
    return isCacheValid(cachedStatus) ? cachedStatus!.isActiveProfessional : false;
  });

  const [professionalId, setProfessionalId] = useState<string | null>(() => {
    return isCacheValid(cachedStatus) ? cachedStatus!.professionalId : null;
  });
  
  const [loading, setLoading] = useState(() => {
    return !isCacheValid(cachedStatus);
  });

  // Update cache when status changes
  const updateCache = useCallback((professional: boolean, activeProfessional: boolean, profId: string | null) => {
    if (profile?.id) {
      setCachedStatus({
        version: CACHE_VERSION,
        isProfessional: professional,
        isActiveProfessional: activeProfessional,
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
      setIsActiveProfessional(false);
      setProfessionalId(null);
      setLoading(false);
      return;
    }

    if (!profile) {
      setLoading(true);
      return; // Keep loading until profile loads
    }

    // Check if we have valid cached data for this profile
    if (isCacheValid(cachedStatus)) {
      setIsProfessional(cachedStatus!.isProfessional);
      setIsActiveProfessional(cachedStatus!.isActiveProfessional);
      setProfessionalId(cachedStatus!.professionalId);
      setLoading(false);
      return;
    }

    // Quick check: if profile type is not 'profissional', skip database query
    if (profile.tipo_usuario !== 'profissional') {
      setIsProfessional(false);
      setIsActiveProfessional(false);
      setProfessionalId(null);
      updateCache(false, false, null);
      setLoading(false);
      return;
    }

    executingRef.current = true;

    try {
      // Check if user has a professional profile (regardless of active status)
      const { data: professionalData, error } = await supabase
        .from('profissionais')
        .select('id, profile_id, ativo')
        .eq('profile_id', profile.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('❌ [useUserType] Error checking professional status:', error);
        setIsProfessional(false);
        setIsActiveProfessional(false);
        setProfessionalId(null);
        updateCache(false, false, null);
      } else if (professionalData) {
        const profId = professionalData.id.toString();
        setIsProfessional(true);
        setIsActiveProfessional(professionalData.ativo === true);
        setProfessionalId(profId);
        updateCache(true, professionalData.ativo === true, profId);
      } else {
        setIsProfessional(false);
        setIsActiveProfessional(false);
        setProfessionalId(null);
        updateCache(false, false, null);
      }
    } catch (error) {
      console.error('❌ [useUserType] Error checking professional status:', error);
      setIsProfessional(false);
      setIsActiveProfessional(false);
      setProfessionalId(null);
      updateCache(false, false, null);
    } finally {
      setLoading(false);
      executingRef.current = false;
    }
  }, [user?.id, profile?.id, profile?.tipo_usuario, cachedStatus, updateCache]);

  // Memoize the final result to prevent unnecessary re-renders
  const result = useMemo(() => ({
    isProfessional,
    isActiveProfessional,
    professionalId,
    loading
  }), [isProfessional, isActiveProfessional, professionalId, loading]);

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