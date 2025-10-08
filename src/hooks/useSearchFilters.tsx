import { useNavigate, useSearchParams } from 'react-router-dom';
import { useCallback } from 'react';
import { useTenant } from '@/hooks/useTenant';
import { buildTenantPath } from '@/utils/tenantHelpers';

export interface SearchFilters {
  especialidades: string[];
  servicos: string[];
  nome: string;
}

export const useSearchFilters = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { tenant } = useTenant();

  // Função para obter filtros da URL
  const getFiltersFromURL = useCallback((): SearchFilters => {
    const especialidades = searchParams.get('especialidades')?.split(',').filter(Boolean) || [];
    const servicos = searchParams.get('servicos')?.split(',').filter(Boolean) || [];
    const nome = searchParams.get('nome') || '';

    return {
      especialidades,
      servicos,
      nome
    };
  }, [searchParams]);

  // Função para navegar para profissionais com filtros
  const searchProfessionals = useCallback((filters: SearchFilters) => {
    const params = new URLSearchParams();
    
    if (filters.especialidades.length > 0) {
      params.set('especialidades', filters.especialidades.join(','));
    }
    
    if (filters.servicos.length > 0) {
      params.set('servicos', filters.servicos.join(','));
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