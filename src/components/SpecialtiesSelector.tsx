import React from 'react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { X, Plus, Search } from 'lucide-react';

interface SpecialtiesSelectorProps {
  value: string[];
  onChange: (specialties: string[]) => void;
}

const COMMON_SPECIALTIES = [
  'Ansiedade',
  'Depressão',
  'Relacionamentos',
  'Terapia de Casal',
  'Terapia Familiar',
  'Autoestima',
  'Estresse',
  'Síndrome do Pânico',
  'TOC (Transtorno Obsessivo Compulsivo)',
  'Borderline',
  'Bipolaridade',
  'Luto',
  'Trauma',
  'PTSD (Transtorno de Estresse Pós-Traumático)',
  'Terapia Cognitivo-Comportamental',
  'Psicanálise',
  'Gestalt-terapia',
  'Terapia Humanística',
  'Neuropsicologia',
  'Psicologia Infantil',
  'Psicologia do Adolescente',
  'Psicologia do Idoso',
  'Sexualidade',
  'Dependência Química',
  'Transtornos Alimentares',
  'TDAH',
  'Autismo',
  'Psicologia Organizacional'
];

export const SpecialtiesSelector: React.FC<SpecialtiesSelectorProps> = ({ value, onChange }) => {
  const [customSpecialty, setCustomSpecialty] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const handleSpecialtyToggle = (specialty: string) => {
    if (value.includes(specialty)) {
      onChange(value.filter(s => s !== specialty));
    } else {
      onChange([...value, specialty]);
    }
  };

  const addCustomSpecialty = () => {
    if (customSpecialty.trim() && !value.includes(customSpecialty.trim())) {
      onChange([...value, customSpecialty.trim()]);
      setCustomSpecialty('');
    }
  };

  const removeSpecialty = (specialty: string) => {
    onChange(value.filter(s => s !== specialty));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addCustomSpecialty();
    }
  };

  // Filtrar especialidades com base na busca
  const filteredSpecialties = COMMON_SPECIALTIES.filter(specialty =>
    specialty.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <Label className="text-base font-medium mb-4 block">
          Especialidades <span className="text-red-500">*</span>
        </Label>
        <p className="text-sm text-muted-foreground mb-4">
          Selecione suas áreas de especialização. Isso ajudará os pacientes a encontrar o profissional ideal.
        </p>

        {/* Especialidades selecionadas */}
        {value.length > 0 && (
          <div className="mb-6">
            <Label className="text-sm font-medium mb-2 block">Especialidades selecionadas:</Label>
            <div className="flex flex-wrap gap-2">
              {value.map((specialty) => (
                <Badge 
                  key={specialty} 
                  variant="default" 
                  className="flex items-center gap-1 px-3 py-1"
                >
                  {specialty}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeSpecialty(specialty)}
                    className="h-4 w-4 p-0 hover:bg-transparent"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Campo de busca */}
        <div className="space-y-2 mb-4">
          <Label className="text-sm font-medium">Buscar especialidade:</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Digite para buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Especialidades comuns */}
        <div className="space-y-4">
          <Label className="text-sm font-medium">
            Especialidades comuns 
            {searchTerm && ` (${filteredSpecialties.length} encontradas)`}:
          </Label>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredSpecialties.length > 0 ? (
              filteredSpecialties.map((specialty) => (
                <div key={specialty} className="flex items-center space-x-2">
                  <Checkbox
                    id={specialty}
                    checked={value.includes(specialty)}
                    onCheckedChange={() => handleSpecialtyToggle(specialty)}
                  />
                  <Label 
                    htmlFor={specialty} 
                    className="text-sm cursor-pointer leading-tight"
                  >
                    {specialty}
                  </Label>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground col-span-3">
                Nenhuma especialidade encontrada com "{searchTerm}"
              </p>
            )}
          </div>
        </div>

        {/* Adicionar especialidade personalizada */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Adicionar especialidade personalizada:</Label>
          <div className="flex gap-2">
            <Input
              placeholder="Digite uma especialidade não listada"
              value={customSpecialty}
              onChange={(e) => setCustomSpecialty(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1"
            />
            <Button
              type="button"
              variant="outline"
              onClick={addCustomSpecialty}
              disabled={!customSpecialty.trim() || value.includes(customSpecialty.trim())}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {value.length === 0 && (
          <p className="text-sm text-muted-foreground mt-2">
            Selecione pelo menos uma especialidade.
          </p>
        )}
      </div>
    </div>
  );
};