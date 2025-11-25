import { Button } from '@/components/ui/button';
import { SessionTypeIcon, getSessionTypeLabel } from './SessionTypeIcon';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format, addMonths, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface GroupSessionFiltersProps {
  selectedType: string;
  selectedMonth: Date;
  onTypeChange: (type: string) => void;
  onMonthChange: (month: Date) => void;
}

export const GroupSessionFilters = ({
  selectedType,
  selectedMonth,
  onTypeChange,
  onMonthChange,
}: GroupSessionFiltersProps) => {
  const types = ['all', 'palestra', 'workshop', 'roda_conversa'];

  return (
    <div className="space-y-6">
      {/* Navegação de mês */}
      <div className="flex items-center justify-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => onMonthChange(subMonths(selectedMonth, 1))}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <div className="min-w-[200px] text-center">
          <span className="text-lg font-semibold capitalize">
            {format(selectedMonth, 'MMMM yyyy', { locale: ptBR })}
          </span>
        </div>

        <Button
          variant="outline"
          size="icon"
          onClick={() => onMonthChange(addMonths(selectedMonth, 1))}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Filtros de tipo */}
      <div className="flex flex-wrap justify-center gap-2">
        {types.map((type) => (
          <Button
            key={type}
            variant={selectedType === type ? 'default' : 'outline'}
            onClick={() => onTypeChange(type)}
            className="gap-2"
          >
            {type !== 'all' && (
              <SessionTypeIcon 
                type={type as 'palestra' | 'workshop' | 'roda_conversa'} 
                className="h-4 w-4" 
              />
            )}
            {type === 'all' ? 'Todos' : getSessionTypeLabel(type as any)}
          </Button>
        ))}
      </div>
    </div>
  );
};
