import { useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Shield, ExternalLink, ChevronDown, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export const LGPDNotice = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Alert className="border-blue-500/30 bg-blue-50/50 dark:bg-blue-950/20 p-0">
        <CollapsibleTrigger className="flex items-center gap-2 w-full text-left p-4 hover:bg-blue-100/50 dark:hover:bg-blue-900/30 transition-colors rounded-lg">
          <Shield className="h-4 w-4 text-blue-600 flex-shrink-0" />
          <span className="text-blue-700 dark:text-blue-400 font-medium text-sm">
            Dados Agregados e Anônimos
          </span>
          {isOpen ? (
            <ChevronDown className="h-4 w-4 ml-auto text-blue-600" />
          ) : (
            <ChevronRight className="h-4 w-4 ml-auto text-blue-600" />
          )}
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <AlertDescription className="text-blue-600/80 dark:text-blue-300/80 px-4 pb-4 pt-0">
            <p className="mb-2">
              Em conformidade com a LGPD, os dados exibidos são <strong>agregados e anonimizados</strong>. 
              Nenhuma informação individual identificável é apresentada.
            </p>
            <p className="text-sm">
              Os alunos consentiram em compartilhar estatísticas anônimas de bem-estar com sua instituição.
            </p>
            <Link 
              to="/politica-de-privacidade" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline mt-2"
            >
              <ExternalLink className="h-3 w-3" />
              Ver Política de Privacidade
            </Link>
          </AlertDescription>
        </CollapsibleContent>
      </Alert>
    </Collapsible>
  );
};
