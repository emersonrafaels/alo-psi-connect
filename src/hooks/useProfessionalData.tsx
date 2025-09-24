import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ProfessionalData {
  id: number;
  user_id: number;
  display_name: string;
  foto_perfil_url: string | null;
  profissao: string | null;
  crp_crm: string | null;
  resumo_profissional: string | null;
  preco_consulta: number | null;
  tempo_consulta: number | null;
  servicos_raw: string | null;
  telefone: string | null;
  email_secundario: string | null;
  ativo: boolean;
}

export const useProfessionalData = (profileId?: string, isProfessional?: boolean) => {
  const [professionalData, setProfessionalData] = useState<ProfessionalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Memoize the key dependencies to prevent unnecessary re-renders
  const cacheKey = useMemo(() => 
    profileId && isProfessional ? `professional_${profileId}` : null, 
    [profileId, isProfessional]
  );

  const loadProfessionalData = useCallback(async () => {
    if (!profileId || !isProfessional) {
      setLoading(false);
      return;
    }

    // Check local cache first
    const cached = localStorage.getItem(cacheKey || '');
    if (cached) {
      try {
        const cachedData = JSON.parse(cached);
        // Only use cache if it's less than 5 minutes old
        if (Date.now() - cachedData.timestamp < 5 * 60 * 1000) {
          setProfessionalData(cachedData.data);
          setLoading(false);
          return;
        }
      } catch (e) {
        console.warn('Failed to parse cached professional data');
      }
    }

    setError(null);
    try {
      const { data, error } = await supabase
        .from('profissionais')
        .select('*')
        .eq('profile_id', profileId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Erro ao carregar dados do profissional:', error);
        setError('Não foi possível carregar os dados profissionais.');
        return;
      }

      setProfessionalData(data);
      
      // Cache the data
      if (cacheKey && data) {
        localStorage.setItem(cacheKey, JSON.stringify({
          data,
          timestamp: Date.now()
        }));
      }
    } catch (error) {
      console.error('Erro ao carregar dados do profissional:', error);
      setError('Erro interno ao carregar dados.');
    } finally {
      setLoading(false);
    }
  }, [profileId, isProfessional, cacheKey]); // Removed toast from dependencies

  // Load data only once or when key dependencies change
  useEffect(() => {
    let mounted = true;
    
    const loadData = async () => {
      if (mounted) {
        await loadProfessionalData();
      }
    };
    
    loadData();
    
    return () => {
      mounted = false;
    };
  }, [loadProfessionalData]);

  const updateProfessionalData = useCallback((updates: Partial<ProfessionalData>) => {
    setProfessionalData(prev => {
      if (!prev) return null;
      const updated = { ...prev, ...updates };
      
      // Update cache
      if (cacheKey) {
        localStorage.setItem(cacheKey, JSON.stringify({
          data: updated,
          timestamp: Date.now()
        }));
      }
      
      return updated;
    });
  }, [cacheKey]);

  const refreshData = useCallback(() => {
    // Clear cache and reload
    if (cacheKey) {
      localStorage.removeItem(cacheKey);
    }
    loadProfessionalData();
  }, [cacheKey, loadProfessionalData]);

  return {
    professionalData,
    loading,
    error,
    updateProfessionalData,
    refreshData
  };
};