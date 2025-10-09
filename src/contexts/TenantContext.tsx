import React, { createContext, useState, useEffect, useMemo, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Tenant, TenantContextType, DEFAULT_TENANT_SLUG } from '@/types/tenant';
import { getTenantSlugFromPath, clearTenantCache } from '@/utils/tenantHelpers';
import { hexToHSL, isHexColor, getContrastingTextColor } from '@/utils/colorHelpers';

export const TenantContext = createContext<TenantContextType | undefined>(undefined);

export const TenantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Detectar tenant baseado na URL
  const currentTenantSlug = useMemo(() => {
    const slug = getTenantSlugFromPath(location.pathname);
    console.log('[TenantContext] Detected slug:', slug, 'from path:', location.pathname);
    return slug;
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
            console.log('[TenantContext] Using cached tenant data for', slug);
            console.log('[TenantContext] Cached tenant:', data);
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

      console.log('[TenantContext] Fetched tenant from database:', data);

      // Validar se o tenant carregado é o correto
      if (data.slug !== slug) {
        console.error(`[TenantContext] Tenant mismatch: esperado ${slug}, recebido ${data.slug}`);
        localStorage.removeItem(`tenant_${slug}_cache`);
        localStorage.removeItem(`tenant_${data.slug}_cache`);
        // Recarregar sem cache
        window.location.reload();
        return;
      }

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

    // Aplicar cor específica do header (se existir)
    if (tenantData.header_color) {
      const headerColor = isHexColor(tenantData.header_color) 
        ? hexToHSL(tenantData.header_color)
        : tenantData.header_color;
      
      root.style.setProperty('--header-bg', headerColor);
      
      const headerTextColor = getContrastingTextColor(tenantData.header_color);
      root.style.setProperty('--header-fg', headerTextColor);
    } else {
      root.style.setProperty('--header-bg', 'var(--primary)');
      root.style.setProperty('--header-fg', 'var(--primary-foreground)');
    }

    // Aplicar cores dos textos do header (light/dark mode)
    if (tenantData.header_text_color_light) {
      const headerTextLight = isHexColor(tenantData.header_text_color_light)
        ? hexToHSL(tenantData.header_text_color_light)
        : tenantData.header_text_color_light;
      root.style.setProperty('--header-text-light', headerTextLight);
    }
    
    if (tenantData.header_text_color_dark) {
      const headerTextDark = isHexColor(tenantData.header_text_color_dark)
        ? hexToHSL(tenantData.header_text_color_dark)
        : tenantData.header_text_color_dark;
      root.style.setProperty('--header-text-dark', headerTextDark);
    }

    // Aplicar tamanho do logo
    if (tenantData.logo_size) {
      root.style.setProperty('--logo-size', `${tenantData.logo_size}px`);
    }

    // Aplicar cores dos botões (light mode)
    if (tenantData.button_bg_color_light) {
      const btnBgLight = isHexColor(tenantData.button_bg_color_light)
        ? hexToHSL(tenantData.button_bg_color_light)
        : tenantData.button_bg_color_light;
      root.style.setProperty('--btn-primary-bg-light', btnBgLight);
    }
    
    if (tenantData.button_text_color_light) {
      const btnTextLight = isHexColor(tenantData.button_text_color_light)
        ? hexToHSL(tenantData.button_text_color_light)
        : tenantData.button_text_color_light;
      root.style.setProperty('--btn-primary-text-light', btnTextLight);
    }

    // Aplicar cores dos botões (dark mode)
    if (tenantData.button_bg_color_dark) {
      const btnBgDark = isHexColor(tenantData.button_bg_color_dark)
        ? hexToHSL(tenantData.button_bg_color_dark)
        : tenantData.button_bg_color_dark;
      root.style.setProperty('--btn-primary-bg-dark', btnBgDark);
    }
    
    if (tenantData.button_text_color_dark) {
      const btnTextDark = isHexColor(tenantData.button_text_color_dark)
        ? hexToHSL(tenantData.button_text_color_dark)
        : tenantData.button_text_color_dark;
      root.style.setProperty('--btn-primary-text-dark', btnTextDark);
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
    // Limpar cache de profissionais
    clearTenantCache();
    
    // Limpar cache do tenant anterior se houver mudança
    const oldTenantSlug = localStorage.getItem('current_tenant_slug');
    if (oldTenantSlug && oldTenantSlug !== currentTenantSlug) {
      console.log('[TenantContext] Clearing cache for old tenant:', oldTenantSlug);
      localStorage.removeItem(`tenant_${oldTenantSlug}_cache`);
    }
    localStorage.setItem('current_tenant_slug', currentTenantSlug);
    
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
