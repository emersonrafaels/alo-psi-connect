import { useTenant } from '@/hooks/useTenant';
import { Skeleton } from '@/components/ui/skeleton';
import { Link, useLocation } from 'react-router-dom';
import { buildTenantPath, getTenantSlugFromPath } from '@/utils/tenantHelpers';
import { useEffect, useMemo, useState } from 'react';
import { getLuminance, hexToHSL, isHexColor } from '@/utils/colorHelpers';

export const TenantBranding = () => {
  const { tenant, loading } = useTenant();
  const location = useLocation();
  const [imageError, setImageError] = useState(false);

  // Verificar se o tenant no estado é consistente com a URL
  const urlTenantSlug = getTenantSlugFromPath(location.pathname);
  const isConsistent = tenant && tenant.slug === urlTenantSlug;

  const headerBackgroundColor = tenant?.header_color || tenant?.primary_color || '0 0% 100%';
  const headerBackgroundHsl = isHexColor(headerBackgroundColor)
    ? hexToHSL(headerBackgroundColor)
    : headerBackgroundColor;
  const isHeaderBackgroundDark = getLuminance(headerBackgroundHsl) <= 0.5;

  const logoUrl = useMemo(() => {
    if (!tenant) return null;

    if (isHeaderBackgroundDark) {
      return tenant.logo_url_dark || tenant.logo_url;
    }

    return tenant.logo_url || tenant.logo_url_dark;
  }, [isHeaderBackgroundDark, tenant]);

  useEffect(() => {
    setImageError(false);
  }, [tenant?.id, logoUrl]);

  // Mostrar skeleton se loading OU se estado inconsistente com URL
  if (loading || !isConsistent) {
    return <Skeleton className="h-10 w-40" />;
  }

  if (!tenant) {
    return (
      <Link to="/" className="flex items-center space-x-2">
        <span className="text-xl font-bold">Rede Bem-Estar</span>
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
          onError={(e) => {
            console.error('[TenantBranding] Failed to load logo:', logoUrl, e);
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
