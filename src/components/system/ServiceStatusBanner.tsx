import { useContext } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { TenantContext } from '@/contexts/TenantContext';
import { Button } from '@/components/ui/button';

/**
 * Aviso global exibido quando o serviço de dados está indisponível,
 * para o usuário entender que o problema não é a conexão dele.
 */
export const ServiceStatusBanner = () => {
  const ctx = useContext(TenantContext);

  if (!ctx?.error) return null;

  return (
    <div className="sticky top-0 z-[60] w-full bg-destructive/10 border-b border-destructive/30 px-4 py-2">
      <div className="container mx-auto flex flex-wrap items-center justify-center gap-2 text-center text-sm text-destructive">
        <AlertTriangle className="h-4 w-4 shrink-0" />
        <span>
          Estamos com instabilidade para carregar os dados. Algumas informações podem não aparecer.
        </span>
        <Button
          size="sm"
          variant="outline"
          className="h-7 border-destructive/40 text-destructive hover:bg-destructive/10"
          onClick={() => ctx.refreshTenant?.()}
        >
          <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
          Tentar de novo
        </Button>
      </div>
    </div>
  );
};

export default ServiceStatusBanner;
