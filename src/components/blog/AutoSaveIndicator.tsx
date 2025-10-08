import { Cloud, CloudOff, Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AutoSaveIndicatorProps {
  status: 'idle' | 'saving' | 'saved' | 'error';
  lastSaved?: Date | null;
}

export const AutoSaveIndicator = ({ status, lastSaved }: AutoSaveIndicatorProps) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'saving':
        return {
          icon: Loader2,
          text: 'Salvando...',
          className: 'text-muted-foreground',
          animate: true
        };
      case 'saved':
        return {
          icon: Check,
          text: 'Salvo',
          className: 'text-green-600 dark:text-green-400',
          animate: false
        };
      case 'error':
        return {
          icon: CloudOff,
          text: 'Erro ao salvar',
          className: 'text-destructive',
          animate: false
        };
      default:
        return {
          icon: Cloud,
          text: '',
          className: 'text-muted-foreground',
          animate: false
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  const formatLastSaved = () => {
    if (!lastSaved) return '';
    
    const now = new Date();
    const diffMs = now.getTime() - lastSaved.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    
    if (diffSecs < 10) return 'agora mesmo';
    if (diffSecs < 60) return `há ${diffSecs}s`;
    if (diffMins < 60) return `há ${diffMins}min`;
    
    return lastSaved.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="flex items-center gap-2 text-sm">
      <Icon 
        className={cn(
          'h-4 w-4',
          config.className,
          config.animate && 'animate-spin'
        )} 
      />
      <div className="flex flex-col items-start">
        <span className={config.className}>
          {config.text}
        </span>
        {status === 'saved' && lastSaved && (
          <span className="text-xs text-muted-foreground">
            {formatLastSaved()}
          </span>
        )}
      </div>
    </div>
  );
};
