import React, { createContext, useState, useEffect, useMemo, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Tenant, TenantContextType, DEFAULT_TENANT_SLUG } from '@/types/tenant';
import { getTenantSlugFromPath, clearTenantCache } from '@/utils/tenantHelpers';
import { hexToHSL, isHexColor, getContrastingTextColor } from '@/utils/colorHelpers';

// Versão do cache local de tenants. Incremente ao alterar configurações
// que precisam chegar imediatamente a todos os visitantes.
const TENANT_CACHE_VERSION = 2;
const TENANT_CACHE_TTL = 5 * 60 * 1000; // 5 minutos

export const TenantContext = createContext<TenantContextType | undefined>(undefined);

export const TenantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [userTenantSlug, setUserTenantSlug] = useState<string | null>(null);

  // Detectar se estamos em rota institucional
  const isInstitutionalRoute = useMemo(() => {
    return location.pathname.startsWith('/portal-institucional');
  }, [location.pathname]);

  // Buscar tenant do usuário logado (para rotas institucionais)
  useEffect(() => {
    const fetchUserTenant = async () => {
      if (!isInstitutionalRoute) {
        setUserTenantSlug(null);
        return;
      }

      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          console.log('[TenantContext] No user logged in for institutional route');
          setUserTenantSlug(null);
          return;
        }

        // Buscar o tenant do usuário através da tabela institution_users
        const { data: institutionUsers, error: fetchError } = await supabase
          .from('institution_users')
          .select(`
            tenant_id,
            tenants!inner(slug)
          `)
          .eq('user_id', user.id)
          .eq('is_active', true)
          .limit(1)
          .single();

        if (fetchError || !institutionUsers) {
          console.log('[TenantContext] No institution found for user:', user.id);
          setUserTenantSlug(null);
          return;
        }

        const tenantSlug = (institutionUsers.tenants as any).slug;
        console.log('[TenantContext] User tenant detected for institutional route:', tenantSlug);
        setUserTenantSlug(tenantSlug);
      } catch (err) {
        console.error('[TenantContext] Error fetching user tenant:', err);
        setUserTenantSlug(null);
      }
    };

    fetchUserTenant();
  }, [isInstitutionalRoute, location.pathname]);

  // Detectar tenant baseado na URL ou no usuário (para rotas institucionais)
  const currentTenantSlug = useMemo(() => {
    // Se estamos em rota institucional e temos o tenant do usuário, usar esse
    if (isInstitutionalRoute && userTenantSlug) {
      console.log('[TenantContext] Using user tenant for institutional route:', userTenantSlug);
      return userTenantSlug;
    }

    // Caso contrário, usar detecção baseada na URL
    const slug = getTenantSlugFromPath(location.pathname);
    console.log('[TenantContext] Detected slug:', slug, 'from path:', location.pathname);
    return slug;
  }, [location.pathname, isInstitutionalRoute, userTenantSlug]);

  // Função para buscar dados do tenant
  const fetchTenant = useCallback(async (slug: string) => {
    const cacheKey = `tenant_${slug}_cache`;
    let servedFromCache = false;

    try {
      setError(null);

      // Cache local (curto, versionado)
      const cached = localStorage.getItem(cacheKey);

      if (cached) {
        try {
          const { data, timestamp, version } = JSON.parse(cached);

          if (version !== TENANT_CACHE_VERSION || data?.slug !== slug) {
            console.log('[TenantContext] Cache inválido/desatualizado, removendo:', cacheKey);
            localStorage.removeItem(cacheKey);
          } else if (Date.now() - timestamp < TENANT_CACHE_TTL) {
            // Render imediato com cache, revalidação em segundo plano abaixo
            servedFromCache = true;
            setTenant(data as Tenant);
            applyTenantTheme(data as Tenant);
            setLoading(false);
          }
        } catch (e) {
          console.error('[TenantContext] ❌ Invalid cache format, removing:', e);
          localStorage.removeItem(cacheKey);
        }
      }

      if (!servedFromCache) {
        setLoading(true);
      }

      const { data, error: fetchError } = await supabase
        .from('tenants')
        .select('*')
        .eq('slug', slug)
        .eq('is_active', true)
        .single();

      if (fetchError) throw fetchError;
      if (!data) throw new Error(`Tenant '${slug}' não encontrado`);

      // Validar se o tenant carregado é o correto
      if (data.slug !== slug) {
        console.error(`[TenantContext] ❌ CRITICAL: Tenant mismatch após fetch! Esperado: ${slug}, Recebido: ${data.slug}`);

        const tenantKeys = Object.keys(localStorage).filter(k => k.startsWith('tenant_'));
        tenantKeys.forEach(k => localStorage.removeItem(k));

        window.location.reload();
        return;
      }

      // Atualizar cache versionado
      localStorage.setItem(cacheKey, JSON.stringify({
        data,
        timestamp: Date.now(),
        version: TENANT_CACHE_VERSION,
      }));

      setTenant(data as unknown as Tenant);
      applyTenantTheme(data as unknown as Tenant);
    } catch (err) {
      console.error('Erro ao buscar tenant:', err);

      // Se já mostramos o cache, mantemos a tela funcionando
      if (!servedFromCache) {
        setError(err as Error);

        // Fallback para tenant padrão em caso de erro
        if (slug !== DEFAULT_TENANT_SLUG) {
          fetchTenant(DEFAULT_TENANT_SLUG);
        }
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

    // Aplicar cores das tags de especialidades (light mode)
    if (tenantData.specialty_tag_bg_light) {
      const tagBgLight = isHexColor(tenantData.specialty_tag_bg_light)
        ? hexToHSL(tenantData.specialty_tag_bg_light)
        : tenantData.specialty_tag_bg_light;
      root.style.setProperty('--specialty-tag-bg-light', tagBgLight);
    }
    
    if (tenantData.specialty_tag_text_light) {
      const tagTextLight = isHexColor(tenantData.specialty_tag_text_light)
        ? hexToHSL(tenantData.specialty_tag_text_light)
        : tenantData.specialty_tag_text_light;
      root.style.setProperty('--specialty-tag-text-light', tagTextLight);
    }

    // Aplicar cores das tags de especialidades (dark mode)
    if (tenantData.specialty_tag_bg_dark) {
      const tagBgDark = isHexColor(tenantData.specialty_tag_bg_dark)
        ? hexToHSL(tenantData.specialty_tag_bg_dark)
        : tenantData.specialty_tag_bg_dark;
      root.style.setProperty('--specialty-tag-bg-dark', tagBgDark);
    }
    
    if (tenantData.specialty_tag_text_dark) {
      const tagTextDark = isHexColor(tenantData.specialty_tag_text_dark)
        ? hexToHSL(tenantData.specialty_tag_text_dark)
        : tenantData.specialty_tag_text_dark;
      root.style.setProperty('--specialty-tag-text-dark', tagTextDark);
    }

    // FASE 1: Aplicar cores do footer (light mode)
    if (tenantData.footer_bg_color_light) {
      const footerBgLight = isHexColor(tenantData.footer_bg_color_light)
        ? hexToHSL(tenantData.footer_bg_color_light)
        : tenantData.footer_bg_color_light;
      root.style.setProperty('--footer-bg-light', footerBgLight);
    }
    
    if (tenantData.footer_text_color_light) {
      const footerTextLight = isHexColor(tenantData.footer_text_color_light)
        ? hexToHSL(tenantData.footer_text_color_light)
        : tenantData.footer_text_color_light;
      root.style.setProperty('--footer-text-light', footerTextLight);
    }

    // Aplicar cores do footer (dark mode)
    if (tenantData.footer_bg_color_dark) {
      const footerBgDark = isHexColor(tenantData.footer_bg_color_dark)
        ? hexToHSL(tenantData.footer_bg_color_dark)
        : tenantData.footer_bg_color_dark;
      root.style.setProperty('--footer-bg-dark', footerBgDark);
    }
    
    if (tenantData.footer_text_color_dark) {
      const footerTextDark = isHexColor(tenantData.footer_text_color_dark)
        ? hexToHSL(tenantData.footer_text_color_dark)
        : tenantData.footer_text_color_dark;
      root.style.setProperty('--footer-text-dark', footerTextDark);
    }

    // FASE 2: Aplicar tipografia customizada
    if (tenantData.font_family_headings) {
      root.style.setProperty('--font-headings', tenantData.font_family_headings);
    }
    
    if (tenantData.font_family_body) {
      root.style.setProperty('--font-body', tenantData.font_family_body);
    }

    // FASE 3: Aplicar Google Analytics
    if (tenantData.google_analytics_id && !document.querySelector(`script[src*="${tenantData.google_analytics_id}"]`)) {
      const gaScript = document.createElement('script');
      gaScript.async = true;
      gaScript.src = `https://www.googletagmanager.com/gtag/js?id=${tenantData.google_analytics_id}`;
      document.head.appendChild(gaScript);
      
      const gaConfig = document.createElement('script');
      gaConfig.innerHTML = `
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '${tenantData.google_analytics_id}');
      `;
      document.head.appendChild(gaConfig);
    }

    // Aplicar Google Tag Manager
    if (tenantData.google_tag_manager_id && !document.querySelector(`script[src*="${tenantData.google_tag_manager_id}"]`)) {
      const gtmScript = document.createElement('script');
      gtmScript.innerHTML = `
        (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
        new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
        j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
        'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
        })(window,document,'script','dataLayer','${tenantData.google_tag_manager_id}');
      `;
      document.head.appendChild(gtmScript);
    }

    // Atualizar meta tags
    document.title = tenantData.meta_config.title;
    
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', tenantData.meta_config.description);
    }

    // Atualizar favicon (prioriza favicon_url, depois meta_config.favicon)
    const faviconUrl = tenantData.favicon_url || tenantData.meta_config.favicon;
    if (faviconUrl) {
      // Remover TODAS as tags de favicon existentes
      const existingFavicons = document.querySelectorAll('link[rel="icon"], link[rel="shortcut icon"]');
      existingFavicons.forEach(el => el.remove());
      console.log(`[TenantContext] Removed ${existingFavicons.length} existing favicon(s)`);

      // Criar nova tag com cache-buster
      const favicon = document.createElement('link');
      favicon.setAttribute('rel', 'icon');
      const cacheBuster = `?v=${Date.now()}`;
      const finalUrl = faviconUrl.includes('?') 
        ? `${faviconUrl}&v=${Date.now()}`
        : `${faviconUrl}${cacheBuster}`;
      favicon.setAttribute('href', finalUrl);
      document.head.appendChild(favicon);
      console.log('[TenantContext] Favicon updated:', finalUrl);
    }
  }, []);

  // Buscar tenant quando a URL mudar
  useEffect(() => {
    // Limpar cache de profissionais
    clearTenantCache();
    
    // Limpar cache do tenant anterior se houver mudança
    const oldTenantSlug = localStorage.getItem('current_tenant_slug');
    if (oldTenantSlug && oldTenantSlug !== currentTenantSlug) {
      console.log('[TenantContext] Tenant changed from', oldTenantSlug, 'to', currentTenantSlug);
      console.log('[TenantContext] Clearing old tenant state immediately');
      localStorage.removeItem(`tenant_${oldTenantSlug}_cache`);
      
      // CRÍTICO: Limpar tenant e forçar loading ANTES do fetch para evitar flash de tenant incorreto
      setTenant(null);
      setLoading(true);
    }
    localStorage.setItem('current_tenant_slug', currentTenantSlug);
    
    fetchTenant(currentTenantSlug);
  }, [currentTenantSlug, fetchTenant]);

  // Escutar evento de atualização de tenant
  useEffect(() => {
    const handleTenantUpdate = (event: CustomEvent) => {
      const { slug } = event.detail;
      
      console.log('[TenantContext] Tenant update event received:', slug);
      
      // SEMPRE limpar cache do tenant editado
      localStorage.removeItem(`tenant_${slug}_cache`);
      console.log(`[TenantContext] Cache cleared for tenant: ${slug}`);
      
      // Se for o tenant atual, recarregar
      if (slug === currentTenantSlug) {
        console.log('[TenantContext] Reloading current tenant...');
        fetchTenant(currentTenantSlug);
      }
    };

    window.addEventListener('tenant-updated', handleTenantUpdate as EventListener);
    
    return () => {
      window.removeEventListener('tenant-updated', handleTenantUpdate as EventListener);
    };
  }, [currentTenantSlug, fetchTenant]);

  const contextValue = useMemo<TenantContextType>(() => ({
    tenant,
    loading,
    error,
    refreshTenant: () => fetchTenant(currentTenantSlug),
  }), [tenant, loading, error, currentTenantSlug, fetchTenant]);

  // Sempre fornecer o contexto, mesmo durante o loading inicial
  return (
    <TenantContext.Provider value={contextValue}>
      {children}
    </TenantContext.Provider>
  );
};
