import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface DataLoadErrorProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
}

/**
 * Estado de erro reutilizável para quando os dados não carregam.
 * Substitui o "carregando infinito" por uma mensagem clara e opção de tentar de novo.
 */
export const DataLoadError = ({
  title = 'Não conseguimos carregar agora',
  description = 'O serviço de dados está instável neste momento. Isso não é um problema da sua conexão.',
  onRetry,
  className = '',
}: DataLoadErrorProps) => (
  <Card className={`p-8 text-center border-dashed ${className}`}>
    <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-destructive/10">
      <AlertTriangle className="h-5 w-5 text-destructive" />
    </div>
    <p className="font-semibold">{title}</p>
    <p className="mt-1 text-sm text-muted-foreground max-w-md mx-auto">{description}</p>
    {onRetry && (
      <Button variant="outline" className="mt-4" onClick={onRetry}>
        <RefreshCw className="h-4 w-4 mr-2" />
        Tentar de novo
      </Button>
    )}
  </Card>
);

export default DataLoadError;
