import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface AuthorUser {
  id: string;
  user_id: string;
  nome: string;
  email: string;
  foto_perfil_url: string | null;
}

export const useAuthorUsers = (searchTerm?: string) => {
  return useQuery({
    queryKey: ['author-users', searchTerm],
    queryFn: async () => {
      // Buscar usuários que possuem roles de autor
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id')
        .in('role', ['author', 'super_author', 'admin', 'super_admin']);

      if (rolesError) throw rolesError;

      const userIds = [...new Set(userRoles?.map(r => r.user_id) || [])];

      if (userIds.length === 0) return [];

      // Buscar perfis dos usuários
      let query = supabase
        .from('profiles')
        .select('id, user_id, nome, email, foto_perfil_url')
        .in('user_id', userIds);

      if (searchTerm) {
        query = query.or(`nome.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query.order('nome');

      if (error) throw error;

      return (data || []) as AuthorUser[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
};
