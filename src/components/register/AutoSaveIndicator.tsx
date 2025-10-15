import { Loader2, Check, Save } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AutoSaveIndicatorProps {
  isSaving: boolean;
  lastSaved: Date | null;
}

export const AutoSaveIndicator = ({ isSaving, lastSaved }: AutoSaveIndicatorProps) => {
  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      {isSaving && (
        <>
          <Loader2 className="h-3 w-3 animate-spin text-blue-500" />
          <span>Salvando rascunho...</span>
        </>
      )}
      {!isSaving && lastSaved && (
        <>
          <Check className="h-3 w-3 text-green-500" />
          <span>
            Salvo {formatDistanceToNow(lastSaved, { locale: ptBR, addSuffix: true })}
          </span>
        </>
      )}
      {!isSaving && !lastSaved && (
        <>
          <Save className="h-3 w-3" />
          <span>Auto-salvamento ativo</span>
        </>
      )}
    </div>
  );
};
