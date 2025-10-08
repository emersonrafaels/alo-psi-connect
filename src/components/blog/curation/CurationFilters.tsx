import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, X } from 'lucide-react';
import { CurationFilters as FilterType } from '@/hooks/useCurationPosts';

interface CurationFiltersProps {
  filters: FilterType;
  onFiltersChange: (filters: FilterType) => void;
}

const EDITORIAL_BADGES = [
  { value: 'editors_choice', label: 'Escolha do Editor' },
  { value: 'trending', label: 'Em Alta' },
  { value: 'must_read', label: 'Leitura Obrigatória' },
  { value: 'community_favorite', label: 'Favorito da Comunidade' },
  { value: 'staff_pick', label: 'Escolha da Equipe' }
];

export const CurationFilters = ({ filters, onFiltersChange }: CurationFiltersProps) => {
  const [searchTerm, setSearchTerm] = useState(filters.searchTerm || '');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onFiltersChange({ ...filters, searchTerm: searchTerm || undefined });
  };

  const clearFilters = () => {
    setSearchTerm('');
    onFiltersChange({
      status: 'all',
      badge: 'all',
      featured: 'all',
      searchTerm: undefined,
      orderBy: 'created_at',
      orderDirection: 'desc'
    });
  };

  const hasActiveFilters = 
    filters.status !== 'all' || 
    filters.badge !== 'all' || 
    filters.featured !== 'all' || 
    filters.searchTerm;

  return (
    <div className="space-y-4">
      <form onSubmit={handleSearchSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por título ou conteúdo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button type="submit">Buscar</Button>
      </form>

      <div className="flex flex-wrap gap-3">
        <Select
          value={filters.status || 'all'}
          onValueChange={(value) => onFiltersChange({ ...filters, status: value as any })}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Status</SelectItem>
            <SelectItem value="published">Publicados</SelectItem>
            <SelectItem value="draft">Rascunhos</SelectItem>
            <SelectItem value="archived">Arquivados</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filters.badge || 'all'}
          onValueChange={(value) => onFiltersChange({ ...filters, badge: value })}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Badge Editorial" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Badges</SelectItem>
            {EDITORIAL_BADGES.map(badge => (
              <SelectItem key={badge.value} value={badge.value}>
                {badge.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.featured || 'all'}
          onValueChange={(value) => onFiltersChange({ ...filters, featured: value as any })}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Destaque" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="yes">Em Destaque</SelectItem>
            <SelectItem value="no">Não Destacados</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filters.orderBy || 'created_at'}
          onValueChange={(value) => onFiltersChange({ ...filters, orderBy: value as any })}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Ordenar por" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="created_at">Data de Criação</SelectItem>
            <SelectItem value="published_at">Data de Publicação</SelectItem>
            <SelectItem value="featured_order">Ordem de Destaque</SelectItem>
            <SelectItem value="views_count">Visualizações</SelectItem>
            <SelectItem value="average_rating">Avaliação</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filters.orderDirection || 'desc'}
          onValueChange={(value) => onFiltersChange({ ...filters, orderDirection: value as any })}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Direção" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="desc">Decrescente</SelectItem>
            <SelectItem value="asc">Crescente</SelectItem>
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <Button variant="outline" onClick={clearFilters} className="gap-2">
            <X className="h-4 w-4" />
            Limpar Filtros
          </Button>
        )}
      </div>

      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {filters.status !== 'all' && (
            <Badge variant="secondary" className="gap-1">
              Status: {filters.status}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => onFiltersChange({ ...filters, status: 'all' })}
              />
            </Badge>
          )}
          {filters.badge !== 'all' && (
            <Badge variant="secondary" className="gap-1">
              Badge: {EDITORIAL_BADGES.find(b => b.value === filters.badge)?.label}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => onFiltersChange({ ...filters, badge: 'all' })}
              />
            </Badge>
          )}
          {filters.featured !== 'all' && (
            <Badge variant="secondary" className="gap-1">
              {filters.featured === 'yes' ? 'Em Destaque' : 'Não Destacados'}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => onFiltersChange({ ...filters, featured: 'all' })}
              />
            </Badge>
          )}
          {filters.searchTerm && (
            <Badge variant="secondary" className="gap-1">
              Busca: "{filters.searchTerm}"
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => {
                  setSearchTerm('');
                  onFiltersChange({ ...filters, searchTerm: undefined });
                }}
              />
            </Badge>
          )}
        </div>
      )}
    </div>
  );
};
