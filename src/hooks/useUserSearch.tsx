import { useState, useMemo } from 'react';
import { useDebounce } from './useDebounce';

export interface UserSearchFilters {
  searchTerm: string;
  userType: string[];
  roles: string[];
  hasInstitution: boolean | null;
  institutionName: string;
}

interface UserProfile {
  nome: string;
  email: string;
  tipo_usuario: string;
  roles?: string[];
  institutionLinks?: Array<{ name?: string }>;
}

export function useUserSearch<T extends UserProfile>(users: T[]) {
  const [filters, setFilters] = useState<UserSearchFilters>({
    searchTerm: '',
    userType: [],
    roles: [],
    hasInstitution: null,
    institutionName: ''
  });

  const debouncedSearchTerm = useDebounce(filters.searchTerm, 300);

  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      // 1. Busca textual (nome, email)
      if (debouncedSearchTerm) {
        const searchLower = debouncedSearchTerm.toLowerCase();
        const matchesName = user.nome?.toLowerCase().includes(searchLower);
        const matchesEmail = user.email?.toLowerCase().includes(searchLower);
        
        if (!matchesName && !matchesEmail) return false;
      }

      // 2. Filtro por tipo de usuário
      if (filters.userType.length > 0 && !filters.userType.includes(user.tipo_usuario)) {
        return false;
      }

      // 3. Filtro por roles
      if (filters.roles.length > 0) {
        const hasRole = user.roles?.some(role => filters.roles.includes(role));
        if (!hasRole) return false;
      }

      // 4. Filtro por instituição
      if (filters.hasInstitution !== null) {
        const hasInst = (user.institutionLinks?.length ?? 0) > 0;
        if (filters.hasInstitution && !hasInst) return false;
        if (!filters.hasInstitution && hasInst) return false;
      }

      // 5. Filtro por nome de instituição específico
      if (filters.institutionName) {
        const matchesInst = user.institutionLinks?.some(link =>
          link.name?.toLowerCase().includes(filters.institutionName.toLowerCase())
        );
        if (!matchesInst) return false;
      }

      return true;
    });
  }, [users, debouncedSearchTerm, filters]);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.searchTerm) count++;
    if (filters.userType.length > 0) count += filters.userType.length;
    if (filters.roles.length > 0) count += filters.roles.length;
    if (filters.hasInstitution !== null) count++;
    if (filters.institutionName) count++;
    return count;
  }, [filters]);

  return {
    filteredUsers,
    filters,
    setFilters,
    activeFiltersCount
  };
}
