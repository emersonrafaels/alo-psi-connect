import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useRadarAccess } from '@/hooks/useRadarAccess';
import { useTenant } from '@/hooks/useTenant';
import { buildTenantPath } from '@/utils/tenantHelpers';
import { LogoLoader } from '@/components/ui/logo-loader';

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
        <LogoLoader />
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
