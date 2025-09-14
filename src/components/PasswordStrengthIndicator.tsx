import React from 'react';
import { cn } from '@/lib/utils';

interface PasswordStrengthIndicatorProps {
  password: string;
  className?: string;
}

export const PasswordStrengthIndicator: React.FC<PasswordStrengthIndicatorProps> = ({ 
  password, 
  className 
}) => {
  const getPasswordStrength = (password: string) => {
    let score = 0;
    const checks = {
      length: password.length >= 6,
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasNumber: /\d/.test(password),
      hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };

    // Required: minimum 6 characters
    if (checks.length) score += 2;
    
    // Optional improvements
    if (checks.hasUppercase) score += 1;
    if (checks.hasLowercase) score += 1;
    if (checks.hasNumber) score += 1;
    if (checks.hasSpecial) score += 1;

    return { score, checks };
  };

  const { score, checks } = getPasswordStrength(password);

  const getStrengthText = () => {
    if (score === 0) return '';
    if (score < 2) return 'Muito fraca';
    if (score < 4) return 'Fraca';
    if (score < 5) return 'Média';
    if (score < 6) return 'Forte';
    return 'Muito forte';
  };

  const getStrengthColor = () => {
    if (score === 0) return '';
    if (score < 2) return 'text-red-500';
    if (score < 4) return 'text-orange-500';
    if (score < 5) return 'text-yellow-500';
    if (score < 6) return 'text-blue-500';
    return 'text-green-500';
  };

  const getProgressColor = () => {
    if (score === 0) return 'bg-gray-200';
    if (score < 2) return 'bg-red-500';
    if (score < 4) return 'bg-orange-500';
    if (score < 5) return 'bg-yellow-500';
    if (score < 6) return 'bg-blue-500';
    return 'bg-green-500';
  };

  if (!password) return null;

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">Força da senha:</span>
        <span className={cn("text-sm font-medium", getStrengthColor())}>
          {getStrengthText()}
        </span>
      </div>
      
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className={cn("h-2 rounded-full transition-all duration-300", getProgressColor())}
          style={{ width: `${(score / 6) * 100}%` }}
        />
      </div>

      <div className="space-y-1">
        <div className="text-xs text-muted-foreground">Requisitos:</div>
        <div className="grid grid-cols-1 gap-1 text-xs">
          <div className={cn("flex items-center gap-1", checks.length ? 'text-green-600' : 'text-gray-500')}>
            <span className={cn("w-3 h-3 rounded-full text-center text-[10px] leading-3", 
              checks.length ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'
            )}>
              {checks.length ? '✓' : '○'}
            </span>
            Mínimo 6 caracteres (obrigatório)
          </div>
          <div className={cn("flex items-center gap-1", checks.hasUppercase ? 'text-green-600' : 'text-gray-500')}>
            <span className={cn("w-3 h-3 rounded-full text-center text-[10px] leading-3", 
              checks.hasUppercase ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'
            )}>
              {checks.hasUppercase ? '✓' : '○'}
            </span>
            Uma letra maiúscula (recomendado)
          </div>
          <div className={cn("flex items-center gap-1", checks.hasLowercase ? 'text-green-600' : 'text-gray-500')}>
            <span className={cn("w-3 h-3 rounded-full text-center text-[10px] leading-3", 
              checks.hasLowercase ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'
            )}>
              {checks.hasLowercase ? '✓' : '○'}
            </span>
            Uma letra minúscula (recomendado)
          </div>
          <div className={cn("flex items-center gap-1", checks.hasNumber ? 'text-green-600' : 'text-gray-500')}>
            <span className={cn("w-3 h-3 rounded-full text-center text-[10px] leading-3", 
              checks.hasNumber ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'
            )}>
              {checks.hasNumber ? '✓' : '○'}
            </span>
            Um número (recomendado)
          </div>
          <div className={cn("flex items-center gap-1", checks.hasSpecial ? 'text-green-600' : 'text-gray-500')}>
            <span className={cn("w-3 h-3 rounded-full text-center text-[10px] leading-3", 
              checks.hasSpecial ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'
            )}>
              {checks.hasSpecial ? '✓' : '○'}
            </span>
            Um caractere especial (recomendado)
          </div>
        </div>
      </div>
    </div>
  );
};