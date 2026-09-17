import { useTenant } from '@/hooks/useTenant';
import { Skeleton } from '@/components/ui/skeleton';
import { Link, useLocation } from 'react-router-dom';
import { buildTenantPath, getTenantSlugFromPath } from '@/utils/tenantHelpers';
import { useEffect, useMemo, useState } from 'react';
import { getLuminance, hexToHSL, isHexColor } from '@/utils/colorHelpers';

const REDE_BEM_ESTAR_LOGO_LIGHT_BG = 'https://alopsi-website.s3.us-east-1.amazonaws.com/rede_bem_estar/imagens/logos/logo_redebemestar_1.png';
const REDE_BEM_ESTAR_LOGO_DARK_BG = 'https://alopsi-website.s3.us-east-1.amazonaws.com/rede_bem_estar/imagens/logos/logo_redebemestar_2.png';
const MEDCOS_LOGO = 'https://alopsi-website.s3.us-east-1.amazonaws.com/imagens/logo/logo_medcos.png';

const getDefaultLogoUrl = (slug: string, isDarkBackground: boolean) => {
  if (slug === 'medcos') {
    return MEDCOS_LOGO;
  }

  return isDarkBackground ? REDE_BEM_ESTAR_LOGO_DARK_BG : REDE_BEM_ESTAR_LOGO_LIGHT_BG;
};

const getDefaultTenantName = (slug: string) => (slug === 'medcos' ? 'MEDCOS' : 'Rede Bem-Estar');

export const TenantBranding = () => {
  const { tenant, loading } = useTenant();
  const location = useLocation();
  const [imageError, setImageError] = useState(false);

  // Verificar se o tenant no estado é consistente com a URL
  const urlTenantSlug = getTenantSlugFromPath(location.pathname);
  const isConsistent = tenant && tenant.slug === urlTenantSlug;

  const currentSlug = tenant?.slug || urlTenantSlug;
  const currentName = tenant?.name || getDefaultTenantName(currentSlug);
  const headerBackgroundColor = tenant?.header_color || tenant?.primary_color || '280 63% 34%';
  const headerBackgroundHsl = isHexColor(headerBackgroundColor)
    ? hexToHSL(headerBackgroundColor)
    : headerBackgroundColor;
  const isHeaderBackgroundDark = getLuminance(headerBackgroundHsl) <= 0.5;

  const logoCandidates = useMemo(() => {
    const configuredLogos = tenant
      ? isHeaderBackgroundDark
        ? [tenant.logo_url_dark, tenant.logo_url]
        : [tenant.logo_url, tenant.logo_url_dark]
      : [];

    return [...configuredLogos, getDefaultLogoUrl(currentSlug, isHeaderBackgroundDark)]
      .filter((url): url is string => Boolean(url))
      .filter((url, index, urls) => urls.indexOf(url) === index);
  }, [currentSlug, isHeaderBackgroundDark, tenant]);

  const [logoCandidateIndex, setLogoCandidateIndex] = useState(0);
  const logoUrl = logoCandidates[logoCandidateIndex];

  useEffect(() => {
    setImageError(false);
    setLogoCandidateIndex(0);
  }, [tenant?.id, logoCandidates]);

  // Mostrar skeleton se loading OU se estado inconsistente com URL
  if (loading || (tenant && !isConsistent)) {
    return <Skeleton className="h-10 w-40" />;
  }

  if (!tenant) {
    return (
      <Link to="/" className="flex items-center space-x-2">
        {logoUrl && !imageError ? (
          <img
            src={logoUrl}
            alt={currentName}
            className="h-10 w-auto object-contain max-w-full"
            onError={() => {
              if (logoCandidateIndex + 1 < logoCandidates.length) {
                setLogoCandidateIndex(prev => prev + 1);
                return;
              }
              setImageError(true);
            }}
          />
        ) : (
          <span className="text-xl font-bold">{currentName}</span>
        )}
      </Link>
    );
  }

  const formatColor = (color: string) => {
    if (color.startsWith('#')) {
      return color;
    }
    return `hsl(${color})`;
  };

  return (
    <Link to={buildTenantPath(tenant.slug, '/')} className="flex items-center space-x-2 max-w-[200px]">
      {logoUrl && !imageError ? (
        <img 
          src={logoUrl} 
          alt={tenant.name} 
          style={{ 
            height: tenant.logo_size ? `${tenant.logo_size}px` : 'var(--logo-size, 40px)',
            width: 'auto'
          }}
          className="object-contain max-w-full"
          onError={() => {
            if (logoCandidateIndex + 1 < logoCandidates.length) {
              setLogoCandidateIndex(prev => prev + 1);
              return;
            }

            console.error('[TenantBranding] Failed to load logo:', logoUrl);
            setImageError(true);
          }}
        />
      ) : (
        <>
          <div 
            className="w-8 h-8 rounded-full flex items-center justify-center relative overflow-hidden"
            style={{
              backgroundColor: formatColor(tenant.primary_color)
            }}
          >
            <span className="text-primary-foreground font-bold text-sm relative z-10">
              {tenant.slug === 'alopsi' ? 'AP' : 'MC'}
            </span>
          </div>
          <span className="text-xl font-bold">{tenant.name}</span>
        </>
      )}
    </Link>
  );
};
