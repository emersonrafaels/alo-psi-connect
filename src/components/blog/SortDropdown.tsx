import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ArrowUpDown, Calendar, Eye, Clock, Star, Flame } from "lucide-react";

export type SortOption = 'recent' | 'views' | 'read-time' | 'rating' | 'relevance';

interface SortDropdownProps {
  value: SortOption;
  onChange: (value: SortOption) => void;
  hasSearchTerm?: boolean;
}

const sortOptions = [
  { value: 'recent' as SortOption, label: 'Mais Recentes', icon: Calendar },
  { value: 'views' as SortOption, label: 'Mais Vistos', icon: Eye },
  { value: 'read-time' as SortOption, label: 'Leitura Rápida', icon: Clock },
  { value: 'rating' as SortOption, label: 'Melhor Avaliados', icon: Star },
  { value: 'relevance' as SortOption, label: 'Relevância', icon: Flame },
];

export const SortDropdown = ({ value, onChange, hasSearchTerm }: SortDropdownProps) => {
  const currentSort = sortOptions.find(opt => opt.value === value);
  const CurrentIcon = currentSort?.icon || ArrowUpDown;
  
  // Filtrar opções - relevância só aparece quando há busca
  const availableOptions = sortOptions.filter(opt => 
    opt.value !== 'relevance' || hasSearchTerm
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <CurrentIcon className="h-4 w-4" />
          {currentSort?.label || 'Ordenar'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48 bg-background z-50">
        {availableOptions.map((option) => {
          const Icon = option.icon;
          return (
            <DropdownMenuItem
              key={option.value}
              onClick={() => onChange(option.value)}
              className={value === option.value ? 'bg-accent' : ''}
            >
              <Icon className="h-4 w-4 mr-2" />
              {option.label}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
