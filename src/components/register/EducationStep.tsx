import { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { GraduationCap, Plus, Trash2, Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

export interface EducationEntry {
  institution: string;
  course: string;
  year: number;
}

interface EducationStepProps {
  value: EducationEntry[];
  onChange: (entries: EducationEntry[]) => void;
}

const INSTITUTIONS = [
  'Universidade de São Paulo (USP)',
  'Universidade Estadual de Campinas (UNICAMP)',
  'Universidade Federal do Rio de Janeiro (UFRJ)',
  'Universidade Federal de Minas Gerais (UFMG)',
  'Universidade Federal de São Paulo (UNIFESP)',
  'Universidade Estadual Paulista (UNESP)',
  'Universidade do Estado do Rio de Janeiro (UERJ)',
  'Universidade Federal da Bahia (UFBA)',
  'Universidade Federal do Paraná (UFPR)',
  'Universidade Federal do Rio Grande do Sul (UFRGS)',
  'Universidade de Brasília (UnB)',
  'Universidade Federal do Ceará (UFC)',
  'Universidade Federal de Pernambuco (UFPE)',
  'Universidade Federal de Santa Catarina (UFSC)',
  'Universidade Federal de Goiás (UFG)',
  'Universidade Federal Fluminense (UFF)',
  'Universidade Federal do Espírito Santo (UFES)',
  'Universidade Federal do Rio Grande do Norte (UFRN)',
  'Universidade Federal do Pará (UFPA)',
  'Universidade Federal do Maranhão (UFMA)',
  'Pontifícia Universidade Católica de São Paulo (PUC-SP)',
  'Pontifícia Universidade Católica do Rio de Janeiro (PUC-Rio)',
  'Pontifícia Universidade Católica de Minas Gerais (PUC Minas)',
  'Pontifícia Universidade Católica do Paraná (PUC-PR)',
  'Pontifícia Universidade Católica do Rio Grande do Sul (PUC-RS)',
  'Universidade Presbiteriana Mackenzie',
  'Faculdade Israelita de Ciências da Saúde Albert Einstein',
  'Faculdade de Ciências Médicas da Santa Casa de São Paulo',
  'Instituto Sírio-Libanês de Ensino e Pesquisa',
  'Universidade Federal de Ciências da Saúde de Porto Alegre (UFCSPA)',
  'Universidade Anhembi Morumbi',
  'Universidade São Judas Tadeu',
  'Universidade Metodista de São Paulo',
  'Universidade Cruzeiro do Sul',
  'Centro Universitário São Camilo',
];

const COURSES = [
  'Psicologia',
  'Medicina',
  'Enfermagem',
  'Fisioterapia',
  'Nutrição',
  'Fonoaudiologia',
  'Terapia Ocupacional',
  'Farmácia',
  'Biomedicina',
  'Serviço Social',
  'Educação Física',
  'Odontologia',
  'Musicoterapia',
  'Arteterapia',
  'Neuropsicologia',
  'Psicopedagogia',
  'Gerontologia',
  'Saúde Coletiva',
  'Gestão em Saúde',
];

const currentYear = new Date().getFullYear();
const years = Array.from({ length: currentYear - 1979 }, (_, i) => currentYear - i);

interface CreatableComboboxProps {
  options: string[];
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  searchPlaceholder: string;
  emptyText: string;
  label: string;
  required?: boolean;
}

function CreatableCombobox({
  options,
  value,
  onChange,
  placeholder,
  searchPlaceholder,
  emptyText,
  label,
  required,
}: CreatableComboboxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [isCustom, setIsCustom] = useState(false);

  const filtered = useMemo(() => {
    if (!search) return options;
    const lower = search.toLowerCase();
    return options.filter((o) => o.toLowerCase().includes(lower));
  }, [options, search]);

  if (isCustom) {
    return (
      <div>
        <Label>{label} {required && <span className="text-destructive">*</span>}</Label>
        <div className="flex gap-2">
          <Input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={`Digite o nome...`}
            className="flex-1"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="shrink-0 text-xs"
            onClick={() => {
              onChange('');
              setIsCustom(false);
            }}
          >
            Voltar para lista
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Label>{label} {required && <span className="text-destructive">*</span>}</Label>
      <Popover open={open} onOpenChange={setOpen} modal={true}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between font-normal"
          >
            <span className="truncate">
              {value || placeholder}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="p-0"
          align="start"
          sideOffset={4}
          style={{
            width: 'var(--radix-popover-trigger-width)',
            minWidth: '300px',
            maxWidth: '500px',
          }}
        >
          <Command shouldFilter={false}>
            <CommandInput
              placeholder={searchPlaceholder}
              value={search}
              onValueChange={setSearch}
            />
            <CommandList>
              {filtered.length === 0 && !search && (
                <CommandEmpty>{emptyText}</CommandEmpty>
              )}
              <CommandGroup>
                {filtered.map((option) => (
                  <CommandItem
                    key={option}
                    value={option}
                    onSelect={() => {
                      onChange(option);
                      setOpen(false);
                      setSearch('');
                    }}
                    className="cursor-pointer"
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        value === option ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    {option}
                  </CommandItem>
                ))}
                <CommandItem
                  value="__outros__"
                  onSelect={() => {
                    onChange('');
                    setOpen(false);
                    setSearch('');
                    setIsCustom(true);
                  }}
                  className="cursor-pointer border-t mt-1 pt-2"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Outros
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}

export const EducationStep = ({ value, onChange }: EducationStepProps) => {
  const [institution, setInstitution] = useState('');
  const [course, setCourse] = useState('');
  const [year, setYear] = useState('');

  const canAdd = institution.trim() && course.trim() && year;

  const handleAdd = () => {
    if (!canAdd) return;
    onChange([...value, { institution: institution.trim(), course: course.trim(), year: parseInt(year) }]);
    setInstitution('');
    setCourse('');
    setYear('');
  };

  const handleRemove = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <p className="text-sm text-muted-foreground">
          Informe sua(s) formação(ões) acadêmica(s). É obrigatório adicionar pelo menos uma. <span className="text-destructive font-medium">*</span>
        </p>
      </div>

      {value.length > 0 && (
        <div className="space-y-3">
          {value.map((entry, index) => (
            <Card key={index} className="border">
              <CardContent className="py-3 px-4 flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <GraduationCap className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{entry.course}</p>
                    <p className="text-sm text-muted-foreground truncate">{entry.institution}</p>
                    <p className="text-xs text-muted-foreground">Conclusão: {entry.year}</p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="shrink-0 h-8 w-8 text-destructive hover:text-destructive"
                  onClick={() => handleRemove(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card className="border-dashed">
        <CardContent className="pt-4 pb-4 space-y-4">
          <p className="text-sm font-medium">Adicionar formação</p>

          <CreatableCombobox
            options={INSTITUTIONS}
            value={institution}
            onChange={setInstitution}
            placeholder="Busque ou selecione sua instituição..."
            searchPlaceholder="Digite para buscar instituição..."
            emptyText="Nenhuma instituição encontrada."
            label="Instituição"
            required
          />

          <CreatableCombobox
            options={COURSES}
            value={course}
            onChange={setCourse}
            placeholder="Busque ou selecione o curso..."
            searchPlaceholder="Digite para buscar curso..."
            emptyText="Nenhum curso encontrado."
            label="Curso"
            required
          />

          <div>
            <Label htmlFor="edu-year">Ano de Conclusão <span className="text-destructive">*</span></Label>
            <Select value={year} onValueChange={setYear}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o ano" />
              </SelectTrigger>
              <SelectContent>
                {years.map((y) => (
                  <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={handleAdd}
            disabled={!canAdd}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Adicionar formação
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
