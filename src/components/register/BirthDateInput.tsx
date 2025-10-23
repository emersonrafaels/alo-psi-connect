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

const formatDateInput = (value: string): string => {
  // Remove tudo que não é número
  const numbers = value.replace(/\D/g, '');
  
  // Limita a 8 dígitos
  const limited = numbers.slice(0, 8);
  
  // Adiciona barras automaticamente
  let formatted = limited;
  if (limited.length >= 3) {
    formatted = `${limited.slice(0, 2)}/${limited.slice(2)}`;
  }
  if (limited.length >= 5) {
    formatted = `${limited.slice(0, 2)}/${limited.slice(2, 4)}/${limited.slice(4)}`;
  }
  
  return formatted;
};

const convertToISO = (dateStr: string): string | null => {
  // "23/10/1995" → "1995-10-23"
  if (dateStr.length !== 10) return null;
  
  const [day, month, year] = dateStr.split('/');
  if (!day || !month || !year || year.length !== 4) return null;
  
  const dayNum = parseInt(day, 10);
  const monthNum = parseInt(month, 10);
  const yearNum = parseInt(year, 10);
  
  // Validar ranges básicos
  if (dayNum < 1 || dayNum > 31 || monthNum < 1 || monthNum > 12) return null;
  
  // Verificar se é uma data válida
  const date = new Date(yearNum, monthNum - 1, dayNum);
  if (
    date.getDate() !== dayNum ||
    date.getMonth() !== monthNum - 1 ||
    date.getFullYear() !== yearNum
  ) {
    return null;
  }
  
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
};

const convertFromISO = (isoStr: string): string => {
  // "1995-10-23" → "23/10/1995"
  if (!isoStr || isoStr.length !== 10) return '';
  const [year, month, day] = isoStr.split('-');
  return `${day}/${month}/${year}`;
};

export const BirthDateInput = ({ value, onChange, required = true }: BirthDateInputProps) => {
  const { toast } = useToast();
  const [error, setError] = useState<string>('');
  const [displayValue, setDisplayValue] = useState<string>('');

  // Inicializar displayValue a partir do value ISO
  useEffect(() => {
    if (value) {
      setDisplayValue(convertFromISO(value));
    } else {
      setDisplayValue('');
    }
  }, [value]);

  const validateAndConvert = (formattedDate: string) => {
    if (formattedDate.length !== 10) {
      setError('');
      onChange('');
      return;
    }

    const isoDate = convertToISO(formattedDate);
    
    if (!isoDate) {
      setError('Data inválida');
      return;
    }

    setError('');
    const today = new Date();
    const selectedDate = new Date(isoDate);
    const minDate = new Date('1920-01-01');

    // Validar data futura
    if (selectedDate > today) {
      setError('Data de nascimento não pode ser no futuro');
      return;
    }

    // Validar data muito antiga
    if (selectedDate < minDate) {
      setError('Data de nascimento inválida');
      return;
    }

    // Validar idade mínima
    const age = calculateAge(isoDate);
    if (age < 18) {
      setError('É necessário ter pelo menos 18 anos');
      toast({
        title: "Idade mínima não atingida",
        description: "É necessário ter pelo menos 18 anos para se cadastrar.",
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

    onChange(isoDate);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatDateInput(e.target.value);
    setDisplayValue(formatted);
    validateAndConvert(formatted);
  };

  return (
    <div>
      <Label htmlFor="dataNascimento">
        Data de nascimento {required && <span className="text-red-500">*</span>}
      </Label>
      <Input
        id="dataNascimento"
        type="text"
        value={displayValue}
        onChange={handleChange}
        placeholder="dd/mm/aaaa"
        maxLength={10}
        required={required}
        className={error ? 'border-red-500' : ''}
        inputMode="numeric"
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
