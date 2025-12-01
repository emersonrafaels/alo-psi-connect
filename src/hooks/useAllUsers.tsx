import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface SystemUser {
  id: string;
  user_id: string;
  nome: string;
  email: string;
  foto_perfil_url: string | null;
}

export const useAllUsers = (searchTerm?: string) => {
  return useQuery({
    queryKey: ['all-users', searchTerm],
    queryFn: async () => {
      // Buscar TODOS os perfis do sistema
      let query = supabase
        .from('profiles')
        .select('id, user_id, nome, email, foto_perfil_url')
        .not('nome', 'is', null); // Excluir perfis sem nome

      if (searchTerm) {
        query = query.or(`nome.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query.order('nome').limit(50);

      if (error) throw error;

      return (data || []) as SystemUser[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
};
