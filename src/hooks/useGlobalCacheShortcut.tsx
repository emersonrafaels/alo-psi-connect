import { useEffect } from 'react';
import { clearAllCache } from '@/utils/configCache';
import { useToast } from '@/hooks/use-toast';

export const useGlobalCacheShortcut = () => {
  const { toast } = useToast();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl+Shift+R ou Ctrl+Shift+C para limpar cache
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && (event.key === 'R' || event.key === 'r' || event.key === 'C' || event.key === 'c')) {
        event.preventDefault();
        
        // Mostrar confirmação rápida
        const shouldClear = window.confirm(
          'Deseja limpar o cache da aplicação?\n\nEsta ação irá:\n- Limpar configurações em cache\n- Preservar seu login e tema\n- Recarregar a página'
        );

        if (shouldClear) {
          const result = clearAllCache({
            preserveTheme: true,
            preserveAuth: true,
            preserveLanguage: true
          });

          if (result.success) {
            toast({
              title: "Cache limpo!",
              description: `${result.itemsCleared} itens removidos. Recarregando...`,
              variant: "default"
            });
            
            // Recarregar após mostrar o toast
            setTimeout(() => {
              window.location.reload();
            }, 1000);
          } else {
            toast({
              title: "Erro",
              description: "Falha ao limpar o cache. Tente novamente.",
              variant: "destructive"
            });
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toast]);
};