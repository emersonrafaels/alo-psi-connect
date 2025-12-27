import { useNavigate, useSearchParams } from 'react-router-dom';
import { useCallback } from 'react';
import { useTenant } from '@/hooks/useTenant';
import { buildTenantPath } from '@/utils/tenantHelpers';

export interface SearchFilters {
  profissoes: string[];
  especialidades: string[];
  nome: string;
}

export const useSearchFilters = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { tenant } = useTenant();

  // Função para obter filtros da URL
  const getFiltersFromURL = useCallback((): SearchFilters => {
    const profissoes = searchParams.get('profissoes')?.split(',').filter(Boolean) || [];
    const especialidades = searchParams.get('especialidades')?.split(',').filter(Boolean) || [];
    const nome = searchParams.get('nome') || '';

    return {
      profissoes,
      especialidades,
      nome
    };
  }, [searchParams]);

  // Função para navegar para profissionais com filtros
  const searchProfessionals = useCallback((filters: SearchFilters) => {
    const params = new URLSearchParams();
    
    if (filters.profissoes.length > 0) {
      params.set('profissoes', filters.profissoes.join(','));
    }
    
    if (filters.especialidades.length > 0) {
      params.set('especialidades', filters.especialidades.join(','));
    }
    
    if (filters.nome.trim()) {
      params.set('nome', filters.nome.trim());
    }

    const query = params.toString();
    const basePath = buildTenantPath(tenant?.slug || 'alopsi', '/profissionais');
    navigate(`${basePath}${query ? `?${query}` : ''}`);
  }, [navigate, tenant]);

  // Função para limpar filtros
  const clearFilters = useCallback(() => {
    const basePath = buildTenantPath(tenant?.slug || 'alopsi', '/profissionais');
    navigate(basePath);
  }, [navigate, tenant]);

  return {
    getFiltersFromURL,
    searchProfessionals,
    clearFilters
  };
};
