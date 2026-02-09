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
        .select(`
          id,
          session_id,
          status,
          payment_status,
          registered_at,
          cancelled_at,
          attended_at,
          group_sessions (
            id,
            title,
            description,
            session_date,
            start_time,
            duration_minutes,
            meeting_link,
            whatsapp_group_link,
            session_type,
            organizer_type,
            professional_id,
            institution_id,
            tenant_id,
            featured_image_url,
            profissionais (
              id,
              display_name,
              foto_perfil_url
            )
          )
        `)
        .eq('user_id', user.id)
        .order('registered_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  const registeredSessionIds = new Set(
    registrations?.filter(r => r.status === 'confirmed').map(r => r.session_id) || []
  );

  return {
    registrations: registrations || [],
    registeredSessionIds,
    isLoading,
  };
};