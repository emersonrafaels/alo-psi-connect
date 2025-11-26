import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface SessionRegistrant {
  id: string;
  user_id: string;
  session_id: string;
  status: 'confirmed' | 'cancelled' | 'attended';
  payment_status: string | null;
  registered_at: string;
  cancelled_at: string | null;
  attended_at: string | null;
  user_name: string;
  user_email: string;
  user_photo?: string;
}

export const useSessionRegistrants = (sessionId: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: registrants, isLoading } = useQuery({
    queryKey: ['session-registrants', sessionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('group_session_registrations')
        .select('*')
        .eq('session_id', sessionId)
        .order('registered_at', { ascending: false });

      if (error) throw error;

      // Buscar dados dos usuários separadamente
      const userIds = data?.map(r => r.user_id) || [];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, nome, email, foto_perfil_url')
        .in('user_id', userIds);

      const profilesMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      return (data || []).map(reg => {
        const profile = profilesMap.get(reg.user_id);
        return {
          id: reg.id,
          user_id: reg.user_id,
          session_id: reg.session_id,
          status: reg.status,
          payment_status: reg.payment_status,
          registered_at: reg.registered_at,
          cancelled_at: reg.cancelled_at,
          attended_at: reg.attended_at,
          user_name: profile?.nome || 'Usuário',
          user_email: profile?.email || '',
          user_photo: profile?.foto_perfil_url,
        };
      }) as SessionRegistrant[];
    },
    enabled: !!sessionId,
  });

  const markAttendanceMutation = useMutation({
    mutationFn: async ({ registrationId, attended }: { registrationId: string; attended: boolean }) => {
      const { error } = await supabase
        .from('group_session_registrations')
        .update({
          attended_at: attended ? new Date().toISOString() : null,
          status: attended ? 'attended' : 'confirmed',
        })
        .eq('id', registrationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['session-registrants', sessionId] });
      toast({
        title: 'Presença atualizada',
        description: 'A presença foi registrada com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao atualizar presença',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const stats = {
    total: registrants?.length || 0,
    confirmed: registrants?.filter(r => r.status === 'confirmed').length || 0,
    attended: registrants?.filter(r => r.status === 'attended').length || 0,
    cancelled: registrants?.filter(r => r.status === 'cancelled').length || 0,
  };

  return {
    registrants: registrants || [],
    isLoading,
    markAttendance: markAttendanceMutation.mutate,
    isMarkingAttendance: markAttendanceMutation.isPending,
    stats,
  };
};

