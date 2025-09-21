import { useEffect, useRef, useState } from 'react';
import { useCallback } from 'react';

interface UseAutoSaveOptions {
  delay?: number; // Delay em ms para debounce (padrão: 2000ms)
  enabled?: boolean; // Se o auto-save está habilitado
  onSave?: (data: any) => Promise<any>; // Função para salvar
  onSuccess?: () => void; // Callback de sucesso
  onError?: (error: any) => void; // Callback de erro
}

export const useAutoSave = <T,>(
  data: T,
  options: UseAutoSaveOptions = {}
) => {
  const {
    delay = 1000, // Reduzido para 1 segundo
    enabled = true,
    onSave,
    onSuccess,
    onError
  } = options;

  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastDataRef = useRef<T>(data);
  const hasUnsavedChanges = useRef(false);

  const performSave = useCallback(async () => {
    if (!onSave || !hasUnsavedChanges.current) {
      return;
    }

    setIsSaving(true);
    setSaveStatus('saving');

    try {
      await onSave(data);
      setLastSaved(new Date());
      setSaveStatus('saved');
      hasUnsavedChanges.current = false;
      onSuccess?.();
      
      // Reset para idle após 3 segundos
      setTimeout(() => {
        setSaveStatus('idle');
      }, 3000);
    } catch (error) {
      console.error('Auto-save error:', error);
      setSaveStatus('error');
      onError?.(error);
      
      // Reset para idle após 5 segundos
      setTimeout(() => {
        setSaveStatus('idle');
      }, 5000);
    } finally {
      setIsSaving(false);
    }
  }, [data, onSave, onSuccess, onError]);

  // Debounced save effect
  useEffect(() => {
    // Verificar se os dados mudaram
    const hasChanged = JSON.stringify(data) !== JSON.stringify(lastDataRef.current);
    
    if (hasChanged) {
      hasUnsavedChanges.current = true;
      lastDataRef.current = data;

      // Limpar timeout anterior
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Auto-save no banco apenas se habilitado
      if (enabled && onSave) {
        timeoutRef.current = setTimeout(() => {
          performSave();
        }, delay);
      }
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [data, enabled, delay, performSave]);

  // Função para forçar salvamento imediato
  const forceSave = useCallback(async () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    hasUnsavedChanges.current = true;
    await performSave();
  }, [performSave]);

  // Auto-save apenas antes de sair da página (proteção crítica)
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (hasUnsavedChanges.current) {
        forceSave();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [forceSave]);

  // Função para verificar se há mudanças não salvas
  const hasUnsaved = useCallback(() => {
    return hasUnsavedChanges.current;
  }, []);

  return {
    isSaving,
    lastSaved,
    saveStatus,
    forceSave,
    hasUnsavedChanges: hasUnsaved
  };
};