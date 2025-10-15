import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState } from 'react';
import { HelpCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface CRPCRMInputProps {
  value: string;
  onChange: (value: string) => void;
  profession: string;
  required?: boolean;
}

const formatCRPCRM = (value: string, isPsiquiatra: boolean): string => {
  // Remover tudo que não é número
  const numbers = value.replace(/\D/g, '');
  
  if (numbers.length === 0) return '';
  
  if (isPsiquiatra) {
    // CRM: XX-XXXXX (estado + número)
    if (numbers.length <= 2) {
      return numbers;
    } else {
      return numbers.slice(0, 2) + '-' + numbers.slice(2, 7);
    }
  } else {
    // CRP: XX/XXXXX (região + número)
    if (numbers.length <= 2) {
      return numbers;
    } else {
      return numbers.slice(0, 2) + '/' + numbers.slice(2, 7);
    }
  }
};

export const CRPCRMInput = ({ value, onChange, profession, required = true }: CRPCRMInputProps) => {
  const isPsiquiatra = profession === 'Psiquiatra';
  const label = isPsiquiatra ? 'CRM' : 'CRP';
  const placeholder = isPsiquiatra ? 'XX-XXXXX (ex: 12-34567)' : 'XX/XXXXX (ex: 06/12345)';
  const tooltipText = isPsiquiatra 
    ? 'Número de registro no Conselho Regional de Medicina. Formato: UF-NÚMERO (ex: SP-123456)'
    : 'Número de registro no Conselho Regional de Psicologia. Formato: REGIÃO/NÚMERO (ex: 06/12345)';

  const handleChange = (newValue: string) => {
    const formatted = formatCRPCRM(newValue, isPsiquiatra);
    onChange(formatted);
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <Label htmlFor="crpCrm">
          {label} {required && <span className="text-red-500">*</span>}
        </Label>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p className="text-sm">{tooltipText}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      <Input
        id="crpCrm"
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={placeholder}
        maxLength={8}
        required={required}
      />
      <p className="text-xs text-muted-foreground mt-1">
        Formato: {isPsiquiatra ? 'UF-NÚMERO' : 'REGIÃO/NÚMERO'}
      </p>
    </div>
  );
};
