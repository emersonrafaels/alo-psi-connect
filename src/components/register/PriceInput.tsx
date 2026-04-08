import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Info } from 'lucide-react';

interface PriceInputProps {
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}

export const PriceInput = ({ value, onChange, required = true }: PriceInputProps) => {
  return (
    <div>
      <Label htmlFor="precoConsulta">
        Preço da consulta (R$) {required && <span className="text-red-500">*</span>}
      </Label>
      

      <Input
        id="precoConsulta"
        type="number"
        min="0"
        step="10"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="150.00"
        required={required}
      />
    </div>
  );
};
