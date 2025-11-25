import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from './useAuth';

export const useWaitlist = (sessionId?: string) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: waitlistEntry, isLoading } = useQuery({
    queryKey: ['waitlist-entry', sessionId, user?.id],
    queryFn: async () => {
      if (!sessionId || !user) return null;

      const { data, error } = await supabase
        .from('group_session_waitlist')
        .select('*')
        .eq('session_id', sessionId)
        .eq('user_id', user.id)
        .eq('status', 'waiting')
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!sessionId && !!user,
  });

  const joinWaitlistMutation = useMutation({
    mutationFn: async ({ sessionId, email, name }: { sessionId: string; email: string; name: string }) => {
      if (!user) throw new Error('User must be authenticated');

      // Get current position
      const { count } = await supabase
        .from('group_session_waitlist')
        .select('*', { count: 'exact', head: true })
        .eq('session_id', sessionId)
        .eq('status', 'waiting');

      const position = (count || 0) + 1;

      const { data, error } = await supabase
        .from('group_session_waitlist')
        .insert({
          session_id: sessionId,
          user_id: user.id,
          email,
          name,
          position,
          status: 'waiting',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['waitlist-entry'] });
      toast({
        title: 'Você entrou na lista de espera!',
        description: 'Avisaremos por email quando uma vaga abrir.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao entrar na lista de espera',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const leaveWaitlistMutation = useMutation({
    mutationFn: async (waitlistId: string) => {
      const { error } = await supabase
        .from('group_session_waitlist')
        .update({ status: 'cancelled' })
        .eq('id', waitlistId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['waitlist-entry'] });
      toast({
        title: 'Você saiu da lista de espera',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao sair da lista de espera',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    waitlistEntry,
    isInWaitlist: !!waitlistEntry,
    isLoading,
    joinWaitlist: joinWaitlistMutation.mutate,
    leaveWaitlist: leaveWaitlistMutation.mutate,
    isJoining: joinWaitlistMutation.isPending,
    isLeaving: leaveWaitlistMutation.isPending,
  };
};