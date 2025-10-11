import { useEffect, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';

interface UseFormPersistenceOptions<T> {
  key: string;
  data: T;
  enabled?: boolean;
  debounceMs?: number;
  onRestore?: (data: T) => void;
}

export const useFormPersistence = <T,>({
  key,
  data,
  enabled = true,
  debounceMs = 2000,
  onRestore
}: UseFormPersistenceOptions<T>) => {
  const { toast } = useToast();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isRestoredRef = useRef(false);

  // Restaurar dados ao montar componente
  useEffect(() => {
    if (!enabled || isRestoredRef.current) return;

    try {
      const savedData = localStorage.getItem(key);
      if (savedData) {
        const parsed = JSON.parse(savedData);
        const savedAt = new Date(parsed.timestamp);
        const now = new Date();
        const hoursDiff = (now.getTime() - savedAt.getTime()) / (1000 * 60 * 60);

        // Apenas restaurar se salvo nas últimas 24h
        if (hoursDiff < 24) {
          onRestore?.(parsed.data);
          isRestoredRef.current = true;

          toast({
            title: "Cadastro recuperado",
            description: `Seus dados foram recuperados automaticamente (salvos ${
              hoursDiff < 1 
                ? 'há menos de 1 hora' 
                : `há ${Math.floor(hoursDiff)} horas`
            }).`,
            duration: 5000,
          });
        } else {
          // Limpar dados antigos
          localStorage.removeItem(key);
        }
      }
    } catch (error) {
      console.error('[useFormPersistence] Erro ao restaurar:', error);
    }
  }, [enabled, key, onRestore, toast]);

  // Auto-save com debounce
  useEffect(() => {
    if (!enabled || isRestoredRef.current === false) {
      isRestoredRef.current = true;
      return;
    }

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      try {
        const dataToSave = {
          data,
          timestamp: new Date().toISOString()
        };
        localStorage.setItem(key, JSON.stringify(dataToSave));
        console.log('[useFormPersistence] Dados salvos automaticamente');
      } catch (error) {
        console.error('[useFormPersistence] Erro ao salvar:', error);
      }
    }, debounceMs);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [data, enabled, key, debounceMs]);

  // Limpar ao desmontar ou quando submeter
  const clearSaved = () => {
    try {
      localStorage.removeItem(key);
      console.log('[useFormPersistence] Dados limpos');
    } catch (error) {
      console.error('[useFormPersistence] Erro ao limpar:', error);
    }
  };

  return { clearSaved };
};
