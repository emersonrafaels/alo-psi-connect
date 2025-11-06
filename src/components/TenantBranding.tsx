import { useTenant } from '@/hooks/useTenant';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'react-router-dom';
import { buildTenantPath } from '@/utils/tenantHelpers';
import { useState } from 'react';

export const TenantBranding = () => {
  const { tenant, loading } = useTenant();
  const [imageError, setImageError] = useState(false);

  if (loading) {
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
      {tenant.logo_url && !imageError ? (
        <img 
          src={tenant.logo_url} 
          alt={tenant.name} 
          style={{ 
            height: tenant.logo_size ? `${tenant.logo_size}px` : 'var(--logo-size, 40px)',
            width: 'auto'
          }}
          className="object-contain max-w-full"
          onError={(e) => {
            console.error('[TenantBranding] Failed to load logo:', tenant.logo_url, e);
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
            <span className="text-white font-bold text-sm relative z-10">
              {tenant.slug === 'alopsi' ? 'AP' : 'MC'}
            </span>
          </div>
          <span className="text-xl font-bold">{tenant.name}</span>
        </>
      )}
    </Link>
  );
};
