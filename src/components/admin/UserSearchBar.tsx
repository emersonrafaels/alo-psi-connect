import { useState } from 'react';
import { Search, X, SlidersHorizontal } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { UserSearchFilters } from '@/hooks/useUserSearch';

interface UserSearchBarProps {
  filters: UserSearchFilters;
  onFiltersChange: (filters: UserSearchFilters) => void;
  activeFiltersCount: number;
}

export function UserSearchBar({ filters, onFiltersChange, activeFiltersCount }: UserSearchBarProps) {
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const clearAllFilters = () => {
    onFiltersChange({
      searchTerm: '',
      userType: [],
      roles: [],
      hasInstitution: null,
      institutionName: ''
    });
  };

  const removeFilter = (filterType: keyof UserSearchFilters, value?: string) => {
    switch (filterType) {
      case 'userType':
        onFiltersChange({
          ...filters,
          userType: filters.userType.filter(t => t !== value)
        });
        break;
      case 'roles':
        onFiltersChange({
          ...filters,
          roles: filters.roles.filter(r => r !== value)
        });
        break;
      case 'hasInstitution':
        onFiltersChange({ ...filters, hasInstitution: null });
        break;
      case 'institutionName':
        onFiltersChange({ ...filters, institutionName: '' });
        break;
      case 'searchTerm':
        onFiltersChange({ ...filters, searchTerm: '' });
        break;
    }
  };

  return (
    <div className="space-y-4">
      {/* Barra de Pesquisa Principal */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Pesquisar por nome, email..."
            value={filters.searchTerm}
            onChange={(e) => onFiltersChange({ ...filters, searchTerm: e.target.value })}
            className="pl-10"
          />
          {filters.searchTerm && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
              onClick={() => onFiltersChange({ ...filters, searchTerm: '' })}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        <Button
          variant={activeFiltersCount > 0 ? "default" : "outline"}
          onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
          className="gap-2"
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filtros
          {activeFiltersCount > 0 && (
            <Badge variant="secondary" className="ml-1">
              {activeFiltersCount}
            </Badge>
          )}
        </Button>

        {activeFiltersCount > 0 && (
          <Button variant="ghost" onClick={clearAllFilters}>
            Limpar Filtros
          </Button>
        )}
      </div>

      {/* Painel de Filtros Avançados */}
      {showAdvancedFilters && (
        <Card className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Filtro: Tipo de Usuário */}
            <div>
              <Label className="mb-2 block font-semibold">Tipo de Usuário</Label>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="filter-paciente"
                    checked={filters.userType.includes('paciente')}
                    onCheckedChange={(checked) => {
                      const newTypes = checked
                        ? [...filters.userType, 'paciente']
                        : filters.userType.filter(t => t !== 'paciente');
                      onFiltersChange({ ...filters, userType: newTypes });
                    }}
                  />
                  <Label htmlFor="filter-paciente" className="cursor-pointer font-normal">
                    Pacientes
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="filter-profissional"
                    checked={filters.userType.includes('profissional')}
                    onCheckedChange={(checked) => {
                      const newTypes = checked
                        ? [...filters.userType, 'profissional']
                        : filters.userType.filter(t => t !== 'profissional');
                      onFiltersChange({ ...filters, userType: newTypes });
                    }}
                  />
                  <Label htmlFor="filter-profissional" className="cursor-pointer font-normal">
                    Profissionais
                  </Label>
                </div>
              </div>
            </div>

            {/* Filtro: Roles Admin */}
            <div>
              <Label className="mb-2 block font-semibold">Roles Administrativos</Label>
              <div className="space-y-2">
                {['super_admin', 'admin', 'moderator'].map(role => (
                  <div key={role} className="flex items-center gap-2">
                    <Checkbox
                      id={`filter-role-${role}`}
                      checked={filters.roles.includes(role)}
                      onCheckedChange={(checked) => {
                        const newRoles = checked
                          ? [...filters.roles, role]
                          : filters.roles.filter(r => r !== role);
                        onFiltersChange({ ...filters, roles: newRoles });
                      }}
                    />
                    <Label htmlFor={`filter-role-${role}`} className="cursor-pointer font-normal">
                      {role}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Filtro: Instituições */}
            <div>
              <Label className="mb-2 block font-semibold">Vínculo Institucional</Label>
              <RadioGroup
                value={filters.hasInstitution === null ? 'all' : filters.hasInstitution ? 'yes' : 'no'}
                onValueChange={(value) => {
                  const hasInst = value === 'all' ? null : value === 'yes';
                  onFiltersChange({ ...filters, hasInstitution: hasInst });
                }}
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="all" id="inst-all" />
                  <Label htmlFor="inst-all" className="cursor-pointer font-normal">Todos</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="yes" id="inst-yes" />
                  <Label htmlFor="inst-yes" className="cursor-pointer font-normal">Com instituição</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="no" id="inst-no" />
                  <Label htmlFor="inst-no" className="cursor-pointer font-normal">Sem instituição</Label>
                </div>
              </RadioGroup>
            </div>

            {/* Filtro: Nome da Instituição */}
            <div>
              <Label htmlFor="institution-name" className="mb-2 block font-semibold">
                Nome da Instituição
              </Label>
              <Input
                id="institution-name"
                placeholder="Buscar instituição..."
                value={filters.institutionName}
                onChange={(e) => onFiltersChange({ ...filters, institutionName: e.target.value })}
              />
            </div>
          </div>
        </Card>
      )}

      {/* Badges de Filtros Ativos */}
      {activeFiltersCount > 0 && (
        <div className="flex gap-2 flex-wrap items-center">
          <span className="text-sm text-muted-foreground">Filtros ativos:</span>

          {filters.userType.map(type => (
            <Badge key={type} variant="secondary" className="gap-1">
              {type === 'paciente' ? 'Pacientes' : 'Profissionais'}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => removeFilter('userType', type)}
              />
            </Badge>
          ))}

          {filters.roles.map(role => (
            <Badge key={role} variant="secondary" className="gap-1">
              {role}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => removeFilter('roles', role)}
              />
            </Badge>
          ))}

          {filters.hasInstitution !== null && (
            <Badge variant="secondary" className="gap-1">
              {filters.hasInstitution ? 'Com instituição' : 'Sem instituição'}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => removeFilter('hasInstitution')}
              />
            </Badge>
          )}

          {filters.institutionName && (
            <Badge variant="secondary" className="gap-1">
              Instituição: {filters.institutionName}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => removeFilter('institutionName')}
              />
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
