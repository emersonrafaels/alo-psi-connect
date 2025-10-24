import { useState, useMemo } from 'react';
import { Combobox, ComboboxOption } from '@/components/ui/combobox';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useInstitutions } from '@/hooks/useInstitutions';
import { Building2, GraduationCap, Star, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InstitutionSelectorProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function InstitutionSelector({ value, onChange, className }: InstitutionSelectorProps) {
  const { institutions, isLoading } = useInstitutions();
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customValue, setCustomValue] = useState('');

  // Show all active institutions, sorted (partnership first, then alphabetically)
  const filteredInstitutions = useMemo(() => {
    return institutions
      .filter(inst => inst.is_active)
      .sort((a, b) => {
        if (a.has_partnership && !b.has_partnership) return -1;
        if (!a.has_partnership && b.has_partnership) return 1;
        return a.name.localeCompare(b.name);
      });
  }, [institutions]);

  // Convert to combobox options with badges (use NAME as value)
  const options: ComboboxOption[] = useMemo(() => {
    return filteredInstitutions.map(inst => ({
      value: inst.name, // Use name instead of id
      label: inst.name,
      badge: (
        <div className="flex items-center gap-1">
          {inst.has_partnership && (
            <Badge variant="default" className="text-xs">
              <Star className="h-3 w-3 mr-1" />
              Parceria
            </Badge>
          )}
          <Badge 
            variant={inst.type === 'public' ? 'secondary' : 'outline'} 
            className="text-xs"
          >
            {inst.type === 'public' ? (
              <>
                <GraduationCap className="h-3 w-3 mr-1" />
                Pública
              </>
            ) : (
              <>
                <Building2 className="h-3 w-3 mr-1" />
                Privada
              </>
            )}
          </Badge>
        </div>
      ),
    }));
  }, [filteredInstitutions]);

  // Check if current value is a custom institution (not in the list)
  const isCustomInstitution = value && !institutions.find(inst => inst.name === value);
  const selectedInstitution = institutions.find(inst => inst.name === value);

  const handleCustomSubmit = () => {
    if (customValue.trim()) {
      onChange(customValue.trim());
      setShowCustomInput(false);
      setCustomValue('');
    }
  };

  if (showCustomInput) {
    return (
      <div className={cn("space-y-2", className)}>
        <Label>Outra Instituição</Label>
        <div className="flex gap-2">
          <Input
            value={customValue}
            onChange={(e) => setCustomValue(e.target.value)}
            placeholder="Digite o nome da sua instituição..."
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleCustomSubmit();
              }
            }}
          />
          <Button
            type="button"
            onClick={handleCustomSubmit}
            disabled={!customValue.trim()}
          >
            Confirmar
          </Button>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            setShowCustomInput(false);
            setCustomValue('');
          }}
        >
          Voltar para lista
        </Button>
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      <Label>Instituição de Ensino</Label>
      
      {/* Combobox */}
      <Combobox
        options={options}
        value={value}
        onValueChange={onChange}
        placeholder={
          value
            ? selectedInstitution 
              ? value
              : `✓ ${value}` 
            : "Busque ou selecione sua instituição..."
        }
        searchPlaceholder="Digite para buscar..."
        emptyText="Nenhuma instituição encontrada."
        disabled={isLoading}
      />

      {/* Custom Institution Button */}
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-full"
        onClick={() => setShowCustomInput(true)}
      >
        <Plus className="h-4 w-4 mr-2" />
        Minha instituição não está na lista
      </Button>

      {isCustomInstitution && (
        <p className="text-sm text-muted-foreground">
          Instituição selecionada: <strong>{value}</strong>
        </p>
      )}
    </div>
  );
}
