import { useTenant } from '@/hooks/useTenant';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'react-router-dom';

export const TenantBranding = () => {
  const { tenant, loading } = useTenant();

  if (loading) {
    return <Skeleton className="h-10 w-40" />;
  }

  if (!tenant) {
    return (
      <Link to="/" className="flex items-center space-x-2">
        <span className="text-xl font-bold">Alô, Psi!</span>
      </Link>
    );
  }

  return (
    <Link to={tenant.base_path || '/'} className="flex items-center space-x-2">
      {tenant.logo_url ? (
        <img 
          src={tenant.logo_url} 
          alt={tenant.name} 
          className="h-10 w-auto object-contain"
        />
      ) : (
        <>
          <div 
            className="w-8 h-8 rounded-full flex items-center justify-center relative overflow-hidden"
            style={{
              background: `linear-gradient(135deg, ${tenant.primary_color}, ${tenant.accent_color})`
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
