import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';

export interface GroupSessionRegistration {
  id: string;
  session_id: string;
  user_id: string;
  status: 'confirmed' | 'cancelled' | 'attended' | 'no_show';
  payment_status: 'free' | 'pending' | 'paid' | 'refunded';
  registered_at: string;
  cancelled_at?: string;
  attended_at?: string;
}

export const useGroupSessionRegistration = (sessionId?: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [lastRegisteredSessionId, setLastRegisteredSessionId] = useState<string | null>(null);

  // Verificar se usuário está inscrito em uma sessão
  const { data: registration, isLoading } = useQuery({
    queryKey: ['group-session-registration', sessionId],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !sessionId) return null;

      const { data, error } = await supabase
        .from('group_session_registrations')
        .select('*')
        .eq('session_id', sessionId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      return data as GroupSessionRegistration | null;
    },
    enabled: !!sessionId,
  });

  // Inscrever-se em uma sessão
  const registerMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Verificar se já está inscrito
      const { data: existingRegistration } = await supabase
        .from('group_session_registrations')
        .select('id, status')
        .eq('session_id', sessionId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (existingRegistration && existingRegistration.status === 'confirmed') {
        throw new Error('Você já está inscrito nesta sessão');
      }

      // Verificar se sessão tem vagas
      const { data: session, error: sessionError } = await supabase
        .from('group_sessions')
        .select('max_participants, current_registrations')
        .eq('id', sessionId)
        .single();

      if (sessionError) throw sessionError;

      if (session.current_registrations >= session.max_participants) {
        throw new Error('Sessão esgotada');
      }

      let data;

      // Se existe registro cancelado, reativar via UPDATE
      if (existingRegistration && existingRegistration.status === 'cancelled') {
        const { data: updatedData, error } = await supabase
          .from('group_session_registrations')
          .update({
            status: 'confirmed',
            cancelled_at: null,
            registered_at: new Date().toISOString(),
          })
          .eq('id', existingRegistration.id)
          .select()
          .single();
        
        if (error) throw error;
        data = updatedData;
      } else {
        // Criar nova inscrição via INSERT
        const { data: insertedData, error } = await supabase
          .from('group_session_registrations')
          .insert({
            session_id: sessionId,
            user_id: user.id,
            status: 'confirmed',
            payment_status: 'free',
          })
          .select()
          .single();

        if (error) throw error;
        data = insertedData;
      }

      // Incrementar contador de inscrições
      const { error: updateError } = await supabase
        .from('group_sessions')
        .update({ 
          current_registrations: session.current_registrations + 1 
        })
        .eq('id', sessionId);

      if (updateError) throw updateError;

      return data;
    },
    onMutate: async (sessionId: string) => {
      // Cancelar queries pendentes para evitar race conditions
      await queryClient.cancelQueries({ queryKey: ['group-sessions'] });
      
      // Salvar estado anterior para rollback em caso de erro
      const previousSessions = queryClient.getQueryData(['group-sessions']);
      
      // Atualizar cache otimisticamente (contador instantâneo)
      queryClient.setQueriesData(
        { queryKey: ['group-sessions'] },
        (old: any) => {
          if (!old) return old;
          if (Array.isArray(old)) {
            return old.map((session: any) => 
              session.id === sessionId 
                ? { ...session, current_registrations: (session.current_registrations || 0) + 1 }
                : session
            );
          }
          return old;
        }
      );
      
      return { previousSessions };
    },
    onSuccess: (_, sessionId) => {
      setLastRegisteredSessionId(sessionId);
      queryClient.invalidateQueries({ queryKey: ['group-session-registration'] });
      // NÃO invalidar group-sessions - o optimistic update já atualizou
      queryClient.invalidateQueries({ queryKey: ['user-registrations'] });
      toast({
        title: 'Inscrição confirmada!',
        description: 'Você receberá um email com o link da sessão.',
      });
      
      // Limpar após 3 segundos
      setTimeout(() => setLastRegisteredSessionId(null), 3000);
    },
    onError: (error, sessionId, context) => {
      // Rollback: restaurar cache anterior em caso de erro
      if (context?.previousSessions) {
        queryClient.setQueryData(['group-sessions'], context.previousSessions);
      }
      
      const message = error.message.includes('duplicate key') 
        ? 'Você já está inscrito nesta sessão'
        : error.message;
      
      toast({
        title: 'Erro ao realizar inscrição',
        description: message,
        variant: 'destructive',
      });
    },
  });

  // Cancelar inscrição
  const cancelMutation = useMutation({
    mutationFn: async (registrationId: string) => {
      const { error } = await supabase
        .from('group_session_registrations')
        .update({ 
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
        })
        .eq('id', registrationId);

      if (error) throw error;

      // Decrementar contador de inscrições
      const registration = await supabase
        .from('group_session_registrations')
        .select('session_id')
        .eq('id', registrationId)
        .single();

      if (registration.data) {
        const { data: session } = await supabase
          .from('group_sessions')
          .select('current_registrations')
          .eq('id', registration.data.session_id)
          .single();

        if (session) {
          await supabase
            .from('group_sessions')
            .update({ 
              current_registrations: Math.max(0, session.current_registrations - 1)
            })
            .eq('id', registration.data.session_id);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group-session-registration'] });
      queryClient.invalidateQueries({ queryKey: ['group-sessions'] });
      toast({
        title: 'Inscrição cancelada',
        description: 'Sua inscrição foi cancelada com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao cancelar inscrição',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    registration,
    isLoading,
    isRegistered: !!registration && registration.status === 'confirmed',
    register: registerMutation.mutate,
    cancel: cancelMutation.mutate,
    isRegistering: registerMutation.isPending,
    isCancelling: cancelMutation.isPending,
    lastRegisteredSessionId,
  };
};
