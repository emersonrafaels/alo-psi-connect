import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';

export interface AdminInstitutionLinkRequest {
  id: string;
  institution_id: string;
  institution_name: string;
  user_id: string;
  user_name: string;
  user_email: string;
  user_type: 'paciente' | 'profissional';
  status: 'pending' | 'approved' | 'rejected';
  request_message?: string;
  relationship_type?: string;
  enrollment_type?: string;
  created_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
  review_notes?: string;
  tenant_id?: string;
  tenant_name?: string;
}

interface UseAdminInstitutionLinkRequestsParams {
  statusFilter?: 'all' | 'pending' | 'approved' | 'rejected';
  userTypeFilter?: 'all' | 'paciente' | 'profissional';
  institutionId?: string;
  tenantId?: string;
}

export function useAdminInstitutionLinkRequests(params?: UseAdminInstitutionLinkRequestsParams) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: requests, isLoading } = useQuery({
    queryKey: ['admin-institution-link-requests', params],
    queryFn: async () => {
      let query = supabase
        .from('institution_link_requests')
        .select(`
          *,
          educational_institutions!inner (
            name
          ),
          profiles!inner (
            nome,
            email,
            user_id
          ),
          tenants (
            name
          )
        `)
        .order('created_at', { ascending: false });

      // Apply filters
      if (params?.statusFilter && params.statusFilter !== 'all') {
        query = query.eq('status', params.statusFilter);
      }

      if (params?.userTypeFilter && params.userTypeFilter !== 'all') {
        query = query.eq('user_type', params.userTypeFilter);
      }

      if (params?.institutionId) {
        query = query.eq('institution_id', params.institutionId);
      }

      if (params?.tenantId) {
        query = query.eq('tenant_id', params.tenantId);
      }

      const { data, error } = await query;

      if (error) throw error;

      return (data || []).map((item: any) => ({
        ...item,
        institution_name: item.educational_institutions.name,
        user_name: item.profiles.nome,
        user_email: item.profiles.email,
        tenant_name: item.tenants?.name,
      })) as AdminInstitutionLinkRequest[];
    },
  });

  const reviewRequestMutation = useMutation({
    mutationFn: async ({
      requestId,
      action,
      reviewNotes,
    }: {
      requestId: string;
      action: 'approve' | 'reject';
      reviewNotes?: string;
    }) => {
      const { data, error } = await supabase.functions.invoke(
        'review-institution-link-request',
        {
          body: {
            requestId,
            action,
            reviewNotes,
          },
        }
      );

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-institution-link-requests'] });
      queryClient.invalidateQueries({ queryKey: ['institution-users'] });
      queryClient.invalidateQueries({ queryKey: ['patient-institutions'] });
      queryClient.invalidateQueries({ queryKey: ['professional-institutions'] });
      
      toast({
        title: variables.action === 'approve' ? 'Solicitação aprovada!' : 'Solicitação rejeitada',
        description:
          variables.action === 'approve'
            ? 'O vínculo foi criado e o usuário foi notificado.'
            : 'A solicitação foi rejeitada e o usuário foi notificado.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao processar solicitação',
        description: error.message || 'Não foi possível processar a solicitação. Tente novamente.',
        variant: 'destructive',
      });
    },
  });

  // Calculate statistics
  const stats = {
    total: requests?.length || 0,
    pending: requests?.filter((r) => r.status === 'pending').length || 0,
    approved: requests?.filter((r) => r.status === 'approved').length || 0,
    rejected: requests?.filter((r) => r.status === 'rejected').length || 0,
  };

  return {
    requests: requests || [],
    isLoading,
    stats,
    reviewRequest: reviewRequestMutation.mutate,
    isReviewing: reviewRequestMutation.isPending,
  };
}
