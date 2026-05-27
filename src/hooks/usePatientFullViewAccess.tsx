import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

/**
 * Returns true if the current user can access the Patients Full View page.
 * Source of truth: system_configurations (admin_access / patient_full_view_allowed_users)
 * + super_admin/admin roles.
 */
export const usePatientFullViewAccess = () => {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['patient-full-view-access', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      if (!user?.id) return false;

      // 1. role check
      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .in('role', ['admin', 'super_admin']);
      if ((roles || []).length > 0) return true;

      // 2. allow-list check
      const { data: cfg } = await supabase
        .from('system_configurations')
        .select('value')
        .eq('category', 'admin_access')
        .eq('key', 'patient_full_view_allowed_users')
        .is('tenant_id', null)
        .maybeSingle();

      if (!cfg) return false;
      let list: string[] = [];
      try {
        list = typeof cfg.value === 'string' ? JSON.parse(cfg.value as string) : (cfg.value as any);
      } catch {
        list = [];
      }
      return Array.isArray(list) && list.includes(user.id);
    },
    staleTime: 60_000,
  });

  return { hasAccess: !!data, loading: isLoading };
};
