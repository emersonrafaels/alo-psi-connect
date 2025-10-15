import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Info } from 'lucide-react';

interface PriceInputProps {
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}

export const PriceInput = ({ value, onChange, required = true }: PriceInputProps) => {
  const priceValue = parseFloat(value) || 0;
  
  const getPriceCategory = () => {
    if (!priceValue) return null;
    if (priceValue < 80) return { label: 'Abaixo da média', color: 'text-orange-600' };
    if (priceValue <= 120) return { label: 'Iniciante', color: 'text-blue-600' };
    if (priceValue <= 180) return { label: 'Intermediário', color: 'text-green-600' };
    if (priceValue <= 300) return { label: 'Experiente', color: 'text-purple-600' };
    return { label: 'Premium', color: 'text-purple-700' };
  };

  const category = getPriceCategory();

  return (
    <div>
      <Label htmlFor="precoConsulta">
        Preço da consulta (R$) {required && <span className="text-red-500">*</span>}
      </Label>
      
      <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg mb-3 mt-2">
        <div className="flex items-start gap-2 mb-3">
          <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
              Referência de mercado:
            </p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3 text-sm">
          <div className="bg-white dark:bg-gray-800 p-3 rounded border border-blue-200 dark:border-blue-800">
            <p className="font-medium text-gray-900 dark:text-gray-100 mb-1">Iniciante</p>
            <p className="text-blue-700 dark:text-blue-400 font-semibold">R$ 80-120</p>
            <p className="text-xs text-muted-foreground mt-1">0-3 anos exp.</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-3 rounded border border-blue-200 dark:border-blue-800">
            <p className="font-medium text-gray-900 dark:text-gray-100 mb-1">Intermediário</p>
            <p className="text-green-700 dark:text-green-400 font-semibold">R$ 120-180</p>
            <p className="text-xs text-muted-foreground mt-1">3-7 anos exp.</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-3 rounded border border-blue-200 dark:border-blue-800">
            <p className="font-medium text-gray-900 dark:text-gray-100 mb-1">Experiente</p>
            <p className="text-purple-700 dark:text-purple-400 font-semibold">R$ 180-300</p>
            <p className="text-xs text-muted-foreground mt-1">7+ anos exp.</p>
          </div>
        </div>
      </div>

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
      
      {category && (
        <p className={`text-sm mt-2 font-medium ${category.color}`}>
          Categoria: {category.label}
        </p>
      )}
    </div>
  );
};
