import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { useTenant } from '@/hooks/useTenant';
import { buildTenantPath } from '@/utils/tenantHelpers';
import { LogoLoader } from '@/components/ui/logo-loader';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: string;
}

export const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();
  const { hasRole, loading: roleLoading } = useUserRole(requiredRole);
  const { tenant } = useTenant();

  if (loading || roleLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LogoLoader />
      </div>
    );
  }

  if (!user) {
    const authPath = buildTenantPath(tenant?.slug || 'alopsi', '/auth');
    return <Navigate to={authPath} />;
  }

  if (requiredRole && !hasRole) {
    const homePath = buildTenantPath(tenant?.slug || 'alopsi', '/');
    return <Navigate to={homePath} />;
  }

  return <>{children}</>;
};
