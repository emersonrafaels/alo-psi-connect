import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export const useUserRegistrations = () => {
  const { user } = useAuth();

  const { data: registrations, isLoading } = useQuery({
    queryKey: ['user-registrations', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('group_session_registrations')
        .select('session_id, status')
        .eq('user_id', user.id)
        .eq('status', 'confirmed');

      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  const registeredSessionIds = new Set(
    registrations?.map(r => r.session_id) || []
  );

  return {
    registrations: registrations || [],
    registeredSessionIds,
    isLoading,
  };
};