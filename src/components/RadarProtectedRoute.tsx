import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useRadarAccess } from '@/hooks/useRadarAccess';
import { useTenant } from '@/hooks/useTenant';
import { buildTenantPath } from '@/utils/tenantHelpers';

/**
 * Protege as rotas do Radar Institucional.
 * Libera admins do site, admins de instituição, facilitadores e usuários
 * autorizados manualmente pelo painel admin.
 */
export const RadarProtectedRoute = ({ children }: { children: ReactNode }) => {
  const { user, loading } = useAuth();
  const { hasAccess, loading: accessLoading } = useRadarAccess();
  const { tenant } = useTenant();

  if (loading || accessLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to={buildTenantPath(tenant?.slug || 'alopsi', '/auth')} />;
  }

  if (!hasAccess) {
    return <Navigate to={buildTenantPath(tenant?.slug || 'alopsi', '/')} />;
  }

  return <>{children}</>;
};
