import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export const useUserRole = (roleName?: string) => {
  const { user } = useAuth();

  const { data: hasRole, isLoading } = useQuery({
    queryKey: ['user-role', user?.id, roleName],
    queryFn: async () => {
      if (!user || !roleName) return false;

      const { data, error } = await supabase
        .rpc('has_role', { 
          _user_id: user.id, 
          _role: roleName as any
        });

      if (error) throw error;
      return data;
    },
    enabled: !!user && !!roleName,
  });

  return { hasRole, loading: isLoading };
};
