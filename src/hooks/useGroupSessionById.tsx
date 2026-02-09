import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { GroupSession } from './useGroupSessions';

export const useGroupSessionById = (sessionId: string | undefined) => {
  const { data: session, isLoading, error } = useQuery({
    queryKey: ['group-session', sessionId],
    queryFn: async () => {
      if (!sessionId) return null;

      const { data, error } = await supabase
        .from('group_sessions')
        .select(`
          *,
          professional:profissionais!group_sessions_professional_id_fkey(display_name, crp_crm, foto_perfil_url),
          institution:educational_institutions!group_sessions_institution_id_fkey(name)
        `)
        .eq('id', sessionId)
        .single();

      if (error) throw error;
      return data as GroupSession;
    },
    enabled: !!sessionId,
  });

  return { session, isLoading, error };
};
