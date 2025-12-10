import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Shield, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const LGPDNotice = () => {
  return (
    <Alert className="mb-6 border-blue-500/30 bg-blue-50/50 dark:bg-blue-950/20">
      <Shield className="h-4 w-4 text-blue-600" />
      <AlertTitle className="text-blue-700 dark:text-blue-400">
        Dados Agregados e Anônimos
      </AlertTitle>
      <AlertDescription className="text-blue-600/80 dark:text-blue-300/80">
        <p className="mb-2">
          Em conformidade com a LGPD, os dados exibidos são <strong>agregados e anonimizados</strong>. 
          Nenhuma informação individual identificável é apresentada.
        </p>
        <p className="text-sm">
          Os alunos consentiram em compartilhar estatísticas anônimas de bem-estar com sua instituição.
        </p>
        <Button variant="link" size="sm" className="p-0 h-auto mt-2 text-blue-600">
          <ExternalLink className="h-3 w-3 mr-1" />
          Ver Política de Privacidade
        </Button>
      </AlertDescription>
    </Alert>
  );
};
