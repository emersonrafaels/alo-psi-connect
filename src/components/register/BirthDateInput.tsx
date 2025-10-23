import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { AlertCircle, CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

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
  const [open, setOpen] = useState(false);

  // Converter string para Date (se existir)
  const selectedDate = value ? new Date(value) : undefined;

  const handleSelect = (date: Date | undefined) => {
    if (!date) {
      setError('');
      onChange('');
      setOpen(false);
      return;
    }

    setError('');
    const today = new Date();
    const minDate = new Date('1920-01-01');

    // Validar data futura
    if (date > today) {
      setError('Data de nascimento não pode ser no futuro');
      return;
    }

    // Validar data muito antiga
    if (date < minDate) {
      setError('Data de nascimento inválida');
      return;
    }

    // Converter para formato ISO (YYYY-MM-DD)
    const isoDate = format(date, 'yyyy-MM-dd');

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
    setOpen(false);
  };

  return (
    <div>
      <Label htmlFor="dataNascimento">
        Data de nascimento {required && <span className="text-red-500">*</span>}
      </Label>
      
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal",
              !value && "text-muted-foreground",
              error && "border-red-500"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {value ? format(new Date(value), "dd 'de' MMMM 'de' yyyy", { locale: ptBR }) : "Selecione a data"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleSelect}
            disabled={(date) =>
              date > new Date() || date < new Date("1920-01-01")
            }
            initialFocus
            defaultMonth={selectedDate || new Date(2000, 0)}
            captionLayout="dropdown-buttons"
            fromYear={1920}
            toYear={new Date().getFullYear()}
            className="pointer-events-auto"
          />
        </PopoverContent>
      </Popover>

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
