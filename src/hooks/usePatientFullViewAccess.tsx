import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

/**
 * Returns true if the current user can access the Patients Full View page.
 * Uses a SECURITY DEFINER function so non-admin allow-listed users can also verify access
 * (the system_configurations table is admin-only via RLS).
 */
export const usePatientFullViewAccess = () => {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['patient-full-view-access', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      if (!user?.id) return false;
      const { data, error } = await supabase.rpc('has_patient_full_view_access', {
        _user_id: user.id,
      });
      if (error) {
        console.error('[usePatientFullViewAccess] RPC error:', error);
        return false;
      }
      return !!data;
    },
    staleTime: 60_000,
  });

  return { hasAccess: !!data, loading: isLoading };
};
