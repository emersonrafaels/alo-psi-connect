import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';
import { AlertCircle } from 'lucide-react';

interface BirthDateInputProps {
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}

const calculateAge = (birthDate: string): number => {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  
  return age;
};

export const BirthDateInput = ({ value, onChange, required = true }: BirthDateInputProps) => {
  const { toast } = useToast();
  const [error, setError] = useState<string>('');

  const today = new Date().toISOString().split('T')[0];
  const minDate = '1920-01-01';

  const handleChange = (newValue: string) => {
    setError('');
    
    if (!newValue) {
      onChange(newValue);
      return;
    }

    const selectedDate = new Date(newValue);
    const todayDate = new Date(today);

    // Validar data futura
    if (selectedDate > todayDate) {
      setError('Data de nascimento não pode ser no futuro');
      return;
    }

    // Validar data muito antiga
    if (selectedDate < new Date(minDate)) {
      setError('Data de nascimento inválida');
      return;
    }

    // Validar idade mínima
    const age = calculateAge(newValue);
    if (age < 18) {
      setError('É necessário ter pelo menos 18 anos');
      toast({
        title: "Idade mínima não atingida",
        description: "É necessário ter pelo menos 18 anos para se cadastrar como profissional.",
        variant: "destructive",
      });
      return;
    }

    // Alertar se idade muito alta (mas permitir)
    if (age > 100) {
      toast({
        title: "Verifique a data",
        description: "A data inserida parece estar incorreta. Por favor, verifique.",
        variant: "default",
      });
    }

    onChange(newValue);
  };

  return (
    <div>
      <Label htmlFor="dataNascimento">
        Data de nascimento {required && <span className="text-red-500">*</span>}
      </Label>
      <Input
        id="dataNascimento"
        type="date"
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        max={today}
        min={minDate}
        required={required}
        className={error ? 'border-red-500' : ''}
      />
      {error && (
        <div className="flex items-center gap-2 text-sm text-red-500 mt-2">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}
      {value && !error && (
        <p className="text-xs text-muted-foreground mt-1">
          Idade: {calculateAge(value)} anos
        </p>
      )}
    </div>
  );
};
