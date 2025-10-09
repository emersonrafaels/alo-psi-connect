import React, { createContext, useState, useEffect, useMemo, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Tenant, TenantContextType, DEFAULT_TENANT_SLUG } from '@/types/tenant';
import { getTenantSlugFromPath, clearTenantCache } from '@/utils/tenantHelpers';

export const TenantContext = createContext<TenantContextType | undefined>(undefined);

export const TenantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Detectar tenant baseado na URL
  const currentTenantSlug = useMemo(() => {
    return getTenantSlugFromPath(location.pathname);
  }, [location.pathname]);

  // Função para buscar dados do tenant
  const fetchTenant = useCallback(async (slug: string) => {
    try {
      setLoading(true);
      setError(null);

      // Check cache first (1 hour TTL)
      const cacheKey = `tenant_${slug}_cache`;
      const cached = localStorage.getItem(cacheKey);
      
      if (cached) {
        try {
          const { data, timestamp } = JSON.parse(cached);
          const oneHour = 60 * 60 * 1000;
          
          if (Date.now() - timestamp < oneHour) {
            console.log('Using cached tenant data for', slug);
            setTenant(data as Tenant);
            applyTenantTheme(data as Tenant);
            setLoading(false);
            return;
          }
        } catch (e) {
          // Invalid cache, proceed with fetch
          localStorage.removeItem(cacheKey);
        }
      }

      const { data, error: fetchError } = await supabase
        .from('tenants')
        .select('*')
        .eq('slug', slug)
        .eq('is_active', true)
        .single();

      if (fetchError) throw fetchError;
      if (!data) throw new Error(`Tenant '${slug}' não encontrado`);

      // Cache the result
      localStorage.setItem(cacheKey, JSON.stringify({
        data,
        timestamp: Date.now()
      }));

      setTenant(data as unknown as Tenant);

      // Aplicar CSS variables dinamicamente
      applyTenantTheme(data as unknown as Tenant);
    } catch (err) {
      console.error('Erro ao buscar tenant:', err);
      setError(err as Error);
      
      // Fallback para tenant padrão em caso de erro
      if (slug !== DEFAULT_TENANT_SLUG) {
        fetchTenant(DEFAULT_TENANT_SLUG);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Aplicar tema do tenant
  const applyTenantTheme = useCallback((tenantData: Tenant) => {
    const root = document.documentElement;
    
    // Import color helpers
    const { hexToHSL, isHexColor, getContrastingTextColor } = require('@/utils/colorHelpers');
    
    // Aplicar cores principais (converter hex para HSL se necessário)
    const primaryColor = isHexColor(tenantData.primary_color) 
      ? hexToHSL(tenantData.primary_color)
      : tenantData.primary_color;
    
    const accentColor = isHexColor(tenantData.accent_color)
      ? hexToHSL(tenantData.accent_color)
      : tenantData.accent_color;
    
    root.style.setProperty('--primary', primaryColor);
    root.style.setProperty('--accent', accentColor);
    
    // Calcular cor de texto com contraste adequado
    const primaryForeground = getContrastingTextColor(primaryColor);
    const accentForeground = getContrastingTextColor(accentColor);
    
    root.style.setProperty('--primary-foreground', primaryForeground);
    root.style.setProperty('--accent-foreground', accentForeground);
    
    // Aplicar cores do theme_config se existirem
    if (tenantData.theme_config.secondary_color) {
      const secondaryColor = isHexColor(tenantData.theme_config.secondary_color)
        ? hexToHSL(tenantData.theme_config.secondary_color)
        : tenantData.theme_config.secondary_color;
      root.style.setProperty('--secondary', secondaryColor);
      root.style.setProperty('--secondary-foreground', getContrastingTextColor(secondaryColor));
    }
    if (tenantData.theme_config.muted_color) {
      const mutedColor = isHexColor(tenantData.theme_config.muted_color)
        ? hexToHSL(tenantData.theme_config.muted_color)
        : tenantData.theme_config.muted_color;
      root.style.setProperty('--muted', mutedColor);
    }

    // Atualizar meta tags
    document.title = tenantData.meta_config.title;
    
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', tenantData.meta_config.description);
    }

    // Atualizar favicon
    const favicon = document.querySelector('link[rel="icon"]');
    if (favicon && tenantData.meta_config.favicon) {
      favicon.setAttribute('href', tenantData.meta_config.favicon);
    }
  }, []);

  // Buscar tenant quando a URL mudar
  useEffect(() => {
    clearTenantCache(); // Limpar cache ao mudar tenant
    fetchTenant(currentTenantSlug);
  }, [currentTenantSlug, fetchTenant]);

  const contextValue = useMemo<TenantContextType>(() => ({
    tenant,
    loading,
    error,
    refreshTenant: () => fetchTenant(currentTenantSlug),
  }), [tenant, loading, error, currentTenantSlug, fetchTenant]);

  return (
    <TenantContext.Provider value={contextValue}>
      {children}
    </TenantContext.Provider>
  );
};
