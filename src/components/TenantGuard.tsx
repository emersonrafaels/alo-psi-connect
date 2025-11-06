import { ReactNode, useContext } from 'react';
import { TenantContext } from '@/contexts/TenantContext';

interface TenantGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Componente que só renderiza children quando o tenant context está disponível
 * Evita erros de contexto durante a inicialização
 */
export const TenantGuard = ({ children, fallback = null }: TenantGuardProps) => {
  const context = useContext(TenantContext);
  
  // Se o contexto não existe ou está carregando, não renderizar os children
  if (!context || context.loading) {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
};
