import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useTenant } from './useTenant';
import { endOfMonth, format, parse } from 'date-fns';

export interface GroupSession {
  id: string;
  tenant_id: string;
  title: string;
  description: string;
  session_type: 'palestra' | 'workshop' | 'roda_conversa';
  session_date: string;
  start_time: string;
  duration_minutes: number;
  organizer_type: 'professional' | 'institution' | 'tenant';
  professional_id?: number;
  institution_id?: string;
  max_participants: number;
  current_registrations: number;
  is_free: boolean;
  price: number;
  meeting_link?: string;
  whatsapp_group_link?: string;
  google_event_id?: string;
  featured_image_url?: string;
  has_libras: boolean;
  audience_type: 'all' | 'institutions';
  allowed_institution_ids: string[];
  status: 'draft' | 'scheduled' | 'live' | 'completed' | 'cancelled';
  created_by?: string;
  created_at: string;
  updated_at: string;
  professional?: {
    display_name: string;
    crp_crm: string;
    foto_perfil_url?: string;
  };
  institution?: {
    name: string;
  };
}

export const useGroupSessions = (filters?: {
  sessionType?: string;
  month?: string;
  status?: string;
  tenantId?: string | null;
}) => {
  const { tenant } = useTenant();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Use tenantId from filters if provided (for admin), otherwise use current tenant
  const effectiveTenantId = filters?.tenantId !== undefined ? filters.tenantId : tenant?.id;

  const { data: sessions, isLoading, error, refetch } = useQuery({
    queryKey: ['group-sessions', effectiveTenantId, filters],
    queryFn: async () => {
      let query = supabase
        .from('group_sessions')
        .select(`
          *,
          professional:profissionais!group_sessions_professional_id_fkey(display_name, crp_crm, foto_perfil_url),
          institution:educational_institutions!group_sessions_institution_id_fkey(name)
        `)
        .order('session_date', { ascending: true })
        .order('start_time', { ascending: true });

      // Apply tenant filter only if effectiveTenantId is not null
      if (effectiveTenantId) {
        query = query.eq('tenant_id', effectiveTenantId);
      }

      if (filters?.sessionType) {
        query = query.eq('session_type', filters.sessionType);
      }

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      if (filters?.month) {
        const monthDate = parse(filters.month, 'yyyy-MM', new Date());
        const startDate = format(monthDate, 'yyyy-MM-dd');
        const endDate = format(endOfMonth(monthDate), 'yyyy-MM-dd');
        query = query.gte('session_date', startDate).lte('session_date', endDate);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as GroupSession[];
    },
    enabled: effectiveTenantId !== undefined,
  });

  const createMutation = useMutation({
    mutationFn: async (sessionData: Partial<GroupSession>) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('group_sessions')
        .insert({
          title: sessionData.title!,
          description: sessionData.description!,
          session_type: sessionData.session_type!,
          session_date: sessionData.session_date!,
          start_time: sessionData.start_time!,
          duration_minutes: sessionData.duration_minutes || 60,
          organizer_type: sessionData.organizer_type!,
          professional_id: sessionData.professional_id,
          institution_id: sessionData.institution_id,
          max_participants: sessionData.max_participants || 100,
          is_free: sessionData.is_free !== false,
          price: sessionData.price || 0,
          meeting_link: sessionData.meeting_link,
          whatsapp_group_link: sessionData.whatsapp_group_link,
          featured_image_url: sessionData.featured_image_url,
          has_libras: sessionData.has_libras || false,
          audience_type: sessionData.audience_type || 'all',
          allowed_institution_ids: sessionData.allowed_institution_ids || [],
          status: sessionData.status || 'scheduled',
          tenant_id: tenant?.id!,
          created_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group-sessions'] });
      toast({
        title: 'Encontro criado',
        description: 'O encontro foi criado com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao criar encontro',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<GroupSession> & { id: string }) => {
      const { data, error } = await supabase
        .from('group_sessions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group-sessions'] });
      toast({
        title: 'Encontro atualizado',
        description: 'As alterações foram salvas com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao atualizar encontro',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('group_sessions')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group-sessions'] });
      toast({
        title: 'Encontro excluído',
        description: 'O encontro foi removido com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao excluir encontro',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    sessions: sessions || [],
    isLoading,
    error,
    refetch,
    createSession: createMutation.mutate,
    updateSession: updateMutation.mutate,
    deleteSession: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
};
