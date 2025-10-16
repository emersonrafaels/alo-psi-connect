import { useEffect } from 'react';
import { useAuth } from './useAuth';
import { useNavigate } from 'react-router-dom';
import { useTenant } from './useTenant';
import { buildTenantPath } from '@/utils/tenantHelpers';

export const useAuthRedirect = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { tenant } = useTenant();
  const tenantSlug = tenant?.slug || 'alopsi';

  const saveCurrentLocationAndRedirect = () => {
    // Salvar a URL atual (incluindo query params) antes de redirecionar
    const currentUrl = window.location.pathname + window.location.search;
    sessionStorage.setItem('authReturnTo', currentUrl);
    navigate(buildTenantPath(tenantSlug, '/auth'));
  };

  const redirectToAuth = () => {
    if (!user) {
      saveCurrentLocationAndRedirect();
    }
  };

  return {
    redirectToAuth,
    saveCurrentLocationAndRedirect,
    isAuthenticated: !!user
  };
};