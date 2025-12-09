import React from 'react';
import { Input } from '@/components/ui/input';
import { FieldWithTooltip } from './FieldWithTooltip';

interface DiscountValueInputProps {
  discountType: 'percentage' | 'fixed_amount';
  value: number;
  onChange: (value: number) => void;
}

export const DiscountValueInput = ({ discountType, value, onChange }: DiscountValueInputProps) => {
  const isPercentage = discountType === 'percentage';
  
  const label = isPercentage 
    ? "Percentual do Desconto *" 
    : "Valor do Desconto (R$) *";
  
  const tooltip = isPercentage
    ? "Digite o percentual de desconto entre 0 e 100"
    : "Digite o valor fixo em reais que será descontado";

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newValue = parseFloat(e.target.value) || 0;
    
    // Validação para percentual
    if (isPercentage) {
      newValue = Math.min(100, Math.max(0, newValue));
    }
    
    onChange(newValue);
  };

  return (
    <FieldWithTooltip label={label} tooltip={tooltip}>
      <div className="relative">
        {!isPercentage && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
            R$
          </span>
        )}
        <Input
          type="number"
          step={isPercentage ? '1' : '0.01'}
          min="0"
          max={isPercentage ? 100 : undefined}
          value={value}
          onChange={handleChange}
          className={!isPercentage ? 'pl-10' : 'pr-8'}
          placeholder={isPercentage ? 'Ex: 15' : 'Ex: 50.00'}
          required
        />
        {isPercentage && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
            %
          </span>
        )}
      </div>
    </FieldWithTooltip>
  );
};
