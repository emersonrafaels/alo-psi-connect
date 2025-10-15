import { useEffect } from 'react';
import { useEmailValidation } from '@/hooks/useEmailValidation';
import { Loader2, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmailValidationFeedbackProps {
  email: string;
  onValidationChange?: (isValid: boolean, exists: boolean) => void;
}

export const EmailValidationFeedback = ({ email, onValidationChange }: EmailValidationFeedbackProps) => {
  const validation = useEmailValidation(email);

  useEffect(() => {
    if (onValidationChange) {
      onValidationChange(
        validation.isAvailable && !validation.error,
        !validation.isAvailable && !validation.error
      );
    }
  }, [validation.isAvailable, validation.error, onValidationChange]);

  if (!email || email.length < 3) return null;

  return (
    <div className="flex items-center gap-2 text-sm mt-2">
      {validation.isChecking && (
        <>
          <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
          <span className="text-muted-foreground">Verificando email...</span>
        </>
      )}
      
      {!validation.isChecking && validation.error && (
        <>
          <X className="h-4 w-4 text-red-500" />
          <span className="text-red-500">Erro ao verificar email</span>
        </>
      )}
      
      {!validation.isChecking && !validation.error && validation.isAvailable && (
        <>
          <Check className="h-4 w-4 text-green-500" />
          <span className="text-green-600">Email disponível</span>
        </>
      )}
      
      {!validation.isChecking && !validation.error && !validation.isAvailable && (
        <>
          <X className="h-4 w-4 text-orange-500" />
          <span className="text-orange-600">Este email já está cadastrado</span>
        </>
      )}
    </div>
  );
};
