import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

// Hierarquia: super_admin > admin > moderator
const ROLE_HIERARCHY: Record<string, string[]> = {
  moderator: ['moderator', 'admin', 'super_admin'],
  admin: ['admin', 'super_admin'],
  super_admin: ['super_admin'],
};

export const useUserRole = (roleName?: string) => {
  const { user } = useAuth();

  const { data: hasRole, isLoading } = useQuery({
    queryKey: ['user-role', user?.id, roleName],
    queryFn: async () => {
      if (!user || !roleName) return false;

      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);

      if (error) throw error;

      const roles = (data || []).map((r) => String(r.role));
      const accepted = ROLE_HIERARCHY[roleName] ?? [roleName];
      return roles.some((r) => accepted.includes(r));
    },
    enabled: !!user && !!roleName,
  });

  return { hasRole, loading: isLoading };
};
