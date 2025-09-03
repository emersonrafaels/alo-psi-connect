import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface EmailValidationResult {
  isValid: boolean;
  isAvailable: boolean;
  isChecking: boolean;
  error?: string;
}

export const useEmailValidation = (email: string, debounceMs: number = 500) => {
  const [result, setResult] = useState<EmailValidationResult>({
    isValid: false,
    isAvailable: false,
    isChecking: false,
  });

  useEffect(() => {
    if (!email) {
      setResult({
        isValid: false,
        isAvailable: false,
        isChecking: false,
      });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValidFormat = emailRegex.test(email);

    if (!isValidFormat) {
      setResult({
        isValid: false,
        isAvailable: false,
        isChecking: false,
        error: 'Formato de email inválido',
      });
      return;
    }

    setResult(prev => ({ ...prev, isChecking: true, error: undefined }));

    const timeoutId = setTimeout(async () => {
      try {
        // Check if email is already registered
        const { data, error } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', email)
          .limit(1);

        if (error) {
          setResult({
            isValid: true,
            isAvailable: false,
            isChecking: false,
            error: 'Erro ao verificar email',
          });
          return;
        }

        const isAvailable = !data || data.length === 0;

        setResult({
          isValid: true,
          isAvailable,
          isChecking: false,
          error: isAvailable ? undefined : 'Este email já está em uso',
        });
      } catch (error) {
        setResult({
          isValid: true,
          isAvailable: false,
          isChecking: false,
          error: 'Erro ao verificar email',
        });
      }
    }, debounceMs);

    return () => clearTimeout(timeoutId);
  }, [email, debounceMs]);

  return result;
};