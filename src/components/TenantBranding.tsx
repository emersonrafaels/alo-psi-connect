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
          <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center">
            <span className="text-accent-foreground font-bold text-sm">
              {tenant.slug === 'alopsi' ? 'AP' : 'MC'}
            </span>
          </div>
          <span className="text-xl font-bold">{tenant.name}</span>
        </>
      )}
    </Link>
  );
};
