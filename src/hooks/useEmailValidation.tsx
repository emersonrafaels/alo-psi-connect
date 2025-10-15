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
        // Check if email exists in auth.users via edge function
        const { data, error } = await supabase.functions.invoke('check-email-exists', {
          body: { email }
        });

        if (error) {
          console.error('Erro ao verificar email:', error);
          setResult({
            isValid: true,
            isAvailable: false,
            isChecking: false,
            error: 'Erro ao verificar email',
          });
          return;
        }

        const isAvailable = !data?.exists;

        setResult({
          isValid: true,
          isAvailable,
          isChecking: false,
          error: isAvailable ? undefined : 'Este email já está cadastrado',
        });
      } catch (error) {
        console.error('Exceção ao verificar email:', error);
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