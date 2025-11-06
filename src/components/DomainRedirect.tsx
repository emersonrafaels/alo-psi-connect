import { useEffect } from 'react';
import { useTenant } from '@/hooks/useTenant';

export const DomainRedirect = () => {
  const { tenant } = useTenant();

  useEffect(() => {
    // Aguardar tenant carregar
    if (!tenant) return;

    // Verificar se redirecionamento está habilitado
    if (!tenant.domain_redirect_enabled) return;

    // Verificar se há configurações válidas
    if (!tenant.domain_redirect_from?.length || !tenant.domain_redirect_to) return;

    const currentHostname = window.location.hostname;
    
    // Verificar se o hostname atual está na lista de domínios para redirecionar
    const shouldRedirect = tenant.domain_redirect_from.some(
      domain => currentHostname === domain || currentHostname === `www.${domain}`
    );

    if (shouldRedirect) {
      const protocol = window.location.protocol;
      const targetUrl = `${protocol}//${tenant.domain_redirect_to}${window.location.pathname}${window.location.search}${window.location.hash}`;
      
      console.log('[DomainRedirect] Redirecting from', currentHostname, 'to', targetUrl);
      console.log('[DomainRedirect] Config:', {
        enabled: tenant.domain_redirect_enabled,
        from: tenant.domain_redirect_from,
        to: tenant.domain_redirect_to
      });
      
      // Usar replace para não adicionar ao histórico
      window.location.replace(targetUrl);
    }
  }, [tenant]);

  return null;
};
