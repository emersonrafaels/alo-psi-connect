import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface AuditLogEntry {
  id: string;
  institution_id: string;
  action_type: string;
  entity_type: string;
  entity_id?: string;
  performed_by: string;
  changes_summary?: {
    field: string;
    old_value: any;
    new_value: any;
  }[];
  metadata?: Record<string, any>;
  created_at: string;
  performer?: {
    nome: string;
    email: string;
  };
}

interface LogActionParams {
  institution_id: string;
  action_type: string;
  entity_type: string;
  entity_id?: string;
  changes_summary?: {
    field: string;
    old_value: any;
    new_value: any;
  }[];
  metadata?: Record<string, any>;
}

interface AuditFilters {
  action_type?: string;
  entity_type?: string;
  performed_by?: string;
  start_date?: string;
  end_date?: string;
}

export const useInstitutionAudit = (institutionId?: string) => {
  const queryClient = useQueryClient();

  // Fetch audit logs with filters
  const { data: auditLogs, isLoading, refetch } = useQuery({
    queryKey: ['institution-audit', institutionId],
    queryFn: async () => {
      if (!institutionId) return [];

      // Fetch audit logs
      const { data: logs, error } = await supabase
        .from('institution_audit_log')
        .select('*')
        .eq('institution_id', institutionId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching audit logs:', error);
        throw error;
      }

      if (!logs || logs.length === 0) return [];

      // Get unique user IDs
      const userIds = [...new Set(logs.map(log => log.performed_by).filter(Boolean))];

      // Fetch user profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, user_id, nome, email')
        .in('user_id', userIds);

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
      }

      // Create a map of user_id to profile
      const profileMap = new Map(
        profiles?.map(p => [p.user_id, { nome: p.nome, email: p.email }]) || []
      );

      // Merge logs with profiles
      return logs.map(log => ({
        ...log,
        changes_summary: log.changes_summary as any,
        metadata: log.metadata as any,
        performer: profileMap.get(log.performed_by) || undefined,
      })) as AuditLogEntry[];
    },
    enabled: !!institutionId,
  });

  // Fetch filtered audit logs
  const fetchFilteredLogs = async (filters: AuditFilters) => {
    if (!institutionId) return [];

    let query = supabase
      .from('institution_audit_log')
      .select('*')
      .eq('institution_id', institutionId);

    if (filters.action_type) {
      query = query.eq('action_type', filters.action_type);
    }
    if (filters.entity_type) {
      query = query.eq('entity_type', filters.entity_type);
    }
    if (filters.performed_by) {
      query = query.eq('performed_by', filters.performed_by);
    }
    if (filters.start_date) {
      query = query.gte('created_at', filters.start_date);
    }
    if (filters.end_date) {
      query = query.lte('created_at', filters.end_date);
    }

    query = query.order('created_at', { ascending: false });

    const { data: logs, error } = await query;

    if (error) {
      console.error('Error fetching filtered logs:', error);
      throw error;
    }

    if (!logs || logs.length === 0) return [];

    // Get unique user IDs
    const userIds = [...new Set(logs.map(log => log.performed_by).filter(Boolean))];

    // Fetch user profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, user_id, nome, email')
      .in('user_id', userIds);

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
    }

    // Create a map of user_id to profile
    const profileMap = new Map(
      profiles?.map(p => [p.user_id, { nome: p.nome, email: p.email }]) || []
    );

    // Merge logs with profiles
    return logs.map(log => ({
      ...log,
      changes_summary: log.changes_summary as any,
      metadata: log.metadata as any,
      performer: profileMap.get(log.performed_by) || undefined,
    })) as AuditLogEntry[];
  };

  // Log action mutation (calls edge function)
  const logActionMutation = useMutation({
    mutationFn: async (params: LogActionParams) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const { data, error } = await supabase.functions.invoke('log-institution-action', {
        body: params,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      // Refetch audit logs after successful logging
      queryClient.invalidateQueries({ queryKey: ['institution-audit', institutionId] });
    },
    onError: (error) => {
      console.error('Error logging action:', error);
      // Silently fail - não queremos bloquear ações do usuário se o log falhar
    },
  });

  // Export logs to CSV
  const exportToCSV = (logs: AuditLogEntry[]) => {
    const headers = ['Data/Hora', 'Ação', 'Tipo de Entidade', 'Responsável', 'Alterações'];
    const rows = logs.map(log => [
      new Date(log.created_at).toLocaleString('pt-BR'),
      getActionLabel(log.action_type),
      getEntityLabel(log.entity_type),
      log.performer?.nome || log.performer?.email || 'Desconhecido',
      log.changes_summary?.map(c => `${c.field}: ${c.old_value} → ${c.new_value}`).join('; ') || '-'
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `auditoria-${institutionId}-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();

    toast.success('Relatório exportado com sucesso!');
  };

  // Helper function to log action
  const logAction = (params: Omit<LogActionParams, 'institution_id'>) => {
    if (!institutionId) return;
    logActionMutation.mutate({
      ...params,
      institution_id: institutionId,
    });
  };

  return {
    auditLogs: auditLogs || [],
    isLoading,
    refetch,
    logAction,
    fetchFilteredLogs,
    exportToCSV,
    isLogging: logActionMutation.isPending,
  };
};

// Helper functions for labels
export const getActionLabel = (action: string): string => {
  const labels: Record<string, string> = {
    create: 'Criação',
    update: 'Atualização',
    delete: 'Exclusão',
    link_user: 'Vinculação de Usuário',
    unlink_user: 'Desvinculação de Usuário',
    add_professional: 'Adição de Profissional',
    remove_professional: 'Remoção de Profissional',
    create_coupon: 'Criação de Cupom',
    update_coupon: 'Atualização de Cupom',
    delete_coupon: 'Exclusão de Cupom',
    link_admin: 'Adição de Administrador',
    unlink_admin: 'Remoção de Administrador',
    create_admin: 'Criação de Administrador',
    reactivate_admin: 'Reativação de Administrador',
    link_patient: 'Vinculação de Estudante',
    unlink_patient: 'Desvinculação de Estudante',
  };
  return labels[action] || action;
};

export const getEntityLabel = (entity: string): string => {
  const labels: Record<string, string> = {
    institution: 'Instituição',
    user: 'Usuário',
    professional: 'Profissional',
    coupon: 'Cupom',
    admin_user: 'Administrador',
    patient: 'Estudante',
  };
  return labels[entity] || entity;
};

export const getActionIcon = (action: string) => {
  // Será usado no componente para exibir ícones
  const icons: Record<string, string> = {
    create: '✨',
    update: '✏️',
    delete: '🗑️',
    link_user: '🔗',
    unlink_user: '🔓',
    add_professional: '👨‍⚕️',
    remove_professional: '👋',
    create_coupon: '🎟️',
    update_coupon: '🔄',
    delete_coupon: '❌',
    link_admin: '👤',
    unlink_admin: '🚫',
    create_admin: '✨',
    reactivate_admin: '🔄',
    link_patient: '🔗',
    unlink_patient: '🔓',
  };
  return icons[action] || '📝';
};

export const getActionDescription = (
  action: string,
  performer: { nome: string; email: string } | undefined,
  institutionName: string,
  metadata?: Record<string, any>
): string => {
  const performerName = performer?.nome || performer?.email || 'Usuário desconhecido';
  const affectedUser = metadata?.nome || metadata?.email || 'usuário';

  const descriptions: Record<string, string> = {
    create: `${performerName} criou a instituição ${institutionName}`,
    update: `${performerName} atualizou as informações da instituição ${institutionName}`,
    delete: `${performerName} excluiu a instituição ${institutionName}`,
    link_admin: `${performerName} adicionou ${affectedUser} como administrador na instituição ${institutionName}`,
    unlink_admin: `${performerName} removeu ${affectedUser} como administrador da instituição ${institutionName}`,
    create_admin: `${performerName} criou e vinculou ${affectedUser} como administrador na instituição ${institutionName}`,
    reactivate_admin: `${performerName} reativou ${affectedUser} como administrador na instituição ${institutionName}`,
    link_patient: `${performerName} vinculou o estudante ${affectedUser} à instituição ${institutionName}`,
    unlink_patient: `${performerName} desvinculou o estudante ${affectedUser} da instituição ${institutionName}`,
    add_professional: `${performerName} adicionou o profissional ${affectedUser} à instituição ${institutionName}`,
    remove_professional: `${performerName} removeu o profissional ${affectedUser} da instituição ${institutionName}`,
    create_coupon: `${performerName} criou o cupom "${metadata?.coupon_code || 'cupom'}" para a instituição ${institutionName}`,
    update_coupon: `${performerName} atualizou o cupom "${metadata?.coupon_code || 'cupom'}" da instituição ${institutionName}`,
    delete_coupon: `${performerName} excluiu o cupom "${metadata?.coupon_code || 'cupom'}" da instituição ${institutionName}`,
  };

  return descriptions[action] || `${performerName} realizou a ação "${getActionLabel(action)}" na instituição ${institutionName}`;
};
