import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';

export interface AdminInstitutionLinkRequest {
  id: string;
  institution_id: string;
  institution_name: string;
  institution_type: string;
  institution_has_partnership: boolean;
  institution_is_active: boolean;
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
  profile_id?: string;
  patient_id?: string;
  professional_id?: number;
}

export interface UserExistingLink {
  id: string;
  institution_id: string;
  institution_name: string;
  is_active: boolean;
  created_at: string;
  type: 'patient' | 'professional';
}

export interface LinkRequestsMetrics {
  totalRequests: number;
  pendingRequests: number;
  approvedRequests: number;
  rejectedRequests: number;
  approvalRate: number;
  avgResponseTimeHours: number;
  requestsThisWeek: number;
  requestsLastWeek: number;
  weeklyChange: number;
  topInstitutions: Array<{
    id: string;
    name: string;
    totalRequests: number;
    approvedCount: number;
    approvalRate: number;
  }>;
  monthlyData: Array<{
    month: string;
    total: number;
    approved: number;
    rejected: number;
    pending: number;
  }>;
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
            name,
            type,
            has_partnership,
            is_active
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
        institution_type: item.educational_institutions.type,
        institution_has_partnership: item.educational_institutions.has_partnership,
        institution_is_active: item.educational_institutions.is_active,
        user_name: item.profiles.nome,
        user_email: item.profiles.email,
        tenant_name: item.tenants?.name,
      })) as AdminInstitutionLinkRequest[];
    },
  });

  // Fetch user's existing links for context
  const fetchUserExistingLinks = async (userId: string, userType: 'paciente' | 'profissional'): Promise<UserExistingLink[]> => {
    const links: UserExistingLink[] = [];

    if (userType === 'paciente') {
      // Fetch patient's existing links
      const { data: patientData } = await supabase
        .from('pacientes')
        .select('id')
        .eq('profile_id', userId)
        .single();

      if (patientData) {
        const { data: patientLinks } = await supabase
          .from('patient_institutions')
          .select(`
            id,
            institution_id,
            created_at,
            enrollment_status,
            educational_institutions (
              name
            )
          `)
          .eq('patient_id', patientData.id);

        if (patientLinks) {
          patientLinks.forEach((link: any) => {
            links.push({
              id: link.id,
              institution_id: link.institution_id,
              institution_name: link.educational_institutions?.name || 'Unknown',
              is_active: link.enrollment_status === 'student' || link.enrollment_status === 'enrolled',
              created_at: link.created_at,
              type: 'patient',
            });
          });
        }
      }
    } else {
      // Fetch professional's existing links
      const { data: profData } = await supabase
        .from('profissionais')
        .select('id')
        .eq('profile_id', userId)
        .single();

      if (profData) {
        const { data: profLinks } = await supabase
          .from('professional_institutions')
          .select(`
            id,
            institution_id,
            created_at,
            is_active,
            educational_institutions (
              name
            )
          `)
          .eq('professional_id', profData.id);

        if (profLinks) {
          profLinks.forEach((link: any) => {
            links.push({
              id: link.id,
              institution_id: link.institution_id,
              institution_name: link.educational_institutions?.name || 'Unknown',
              is_active: link.is_active,
              created_at: link.created_at,
              type: 'professional',
            });
          });
        }
      }
    }

    return links;
  };

  // Check for duplicate links
  const checkDuplicateLink = async (
    userId: string,
    institutionId: string,
    userType: 'paciente' | 'profissional'
  ): Promise<boolean> => {
    if (userType === 'paciente') {
      const { data: patientData } = await supabase
        .from('pacientes')
        .select('id')
        .eq('profile_id', userId)
        .single();

      if (patientData) {
        const { data: existingLink } = await supabase
          .from('patient_institutions')
          .select('id')
          .eq('patient_id', patientData.id)
          .eq('institution_id', institutionId)
          .maybeSingle();

        return !!existingLink;
      }
    } else {
      const { data: profData } = await supabase
        .from('profissionais')
        .select('id')
        .eq('profile_id', userId)
        .single();

      if (profData) {
        const { data: existingLink } = await supabase
          .from('professional_institutions')
          .select('id')
          .eq('professional_id', profData.id)
          .eq('institution_id', institutionId)
          .maybeSingle();

        return !!existingLink;
      }
    }

    return false;
  };

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
      queryClient.invalidateQueries({ queryKey: ['link-requests-metrics'] });
      
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

  // Batch review mutation
  const batchReviewMutation = useMutation({
    mutationFn: async ({
      requestIds,
      action,
      reviewNotes,
    }: {
      requestIds: string[];
      action: 'approve' | 'reject';
      reviewNotes?: string;
    }) => {
      const results = await Promise.allSettled(
        requestIds.map((requestId) =>
          supabase.functions.invoke('review-institution-link-request', {
            body: { requestId, action, reviewNotes },
          })
        )
      );

      const successful = results.filter((r) => r.status === 'fulfilled').length;
      const failed = results.filter((r) => r.status === 'rejected').length;

      return { successful, failed, total: requestIds.length };
    },
    onSuccess: (result, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-institution-link-requests'] });
      queryClient.invalidateQueries({ queryKey: ['institution-users'] });
      queryClient.invalidateQueries({ queryKey: ['patient-institutions'] });
      queryClient.invalidateQueries({ queryKey: ['professional-institutions'] });
      queryClient.invalidateQueries({ queryKey: ['link-requests-metrics'] });

      const actionLabel = variables.action === 'approve' ? 'aprovadas' : 'rejeitadas';
      
      if (result.failed === 0) {
        toast({
          title: `${result.successful} solicitações ${actionLabel}!`,
          description: 'Todas as solicitações foram processadas com sucesso.',
        });
      } else {
        toast({
          title: `Processamento parcial`,
          description: `${result.successful} ${actionLabel}, ${result.failed} falharam.`,
          variant: 'destructive',
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao processar solicitações',
        description: error.message || 'Não foi possível processar as solicitações. Tente novamente.',
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
    batchReview: batchReviewMutation.mutate,
    isBatchReviewing: batchReviewMutation.isPending,
    fetchUserExistingLinks,
    checkDuplicateLink,
  };
}

// Separate hook for metrics
export function useLinkRequestsMetrics(tenantId?: string) {
  return useQuery({
    queryKey: ['link-requests-metrics', tenantId],
    queryFn: async (): Promise<LinkRequestsMetrics> => {
      // Fetch all requests for metrics calculation
      let query = supabase
        .from('institution_link_requests')
        .select(`
          id,
          status,
          created_at,
          reviewed_at,
          institution_id,
          educational_institutions!inner (
            id,
            name
          )
        `)
        .order('created_at', { ascending: false });

      if (tenantId) {
        query = query.eq('tenant_id', tenantId);
      }

      const { data: allRequests, error } = await query;

      if (error) throw error;

      const requests = allRequests || [];
      
      // Calculate basic metrics
      const totalRequests = requests.length;
      const pendingRequests = requests.filter((r) => r.status === 'pending').length;
      const approvedRequests = requests.filter((r) => r.status === 'approved').length;
      const rejectedRequests = requests.filter((r) => r.status === 'rejected').length;
      
      const approvalRate = totalRequests > 0 
        ? Math.round((approvedRequests / (approvedRequests + rejectedRequests || 1)) * 100)
        : 0;

      // Calculate average response time
      const reviewedRequests = requests.filter((r) => r.reviewed_at && r.created_at);
      let avgResponseTimeHours = 0;
      if (reviewedRequests.length > 0) {
        const totalHours = reviewedRequests.reduce((sum, r) => {
          const created = new Date(r.created_at).getTime();
          const reviewed = new Date(r.reviewed_at!).getTime();
          return sum + (reviewed - created) / (1000 * 60 * 60);
        }, 0);
        avgResponseTimeHours = Math.round(totalHours / reviewedRequests.length);
      }

      // This week vs last week
      const now = new Date();
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

      const requestsThisWeek = requests.filter(
        (r) => new Date(r.created_at) >= oneWeekAgo
      ).length;
      const requestsLastWeek = requests.filter(
        (r) => new Date(r.created_at) >= twoWeeksAgo && new Date(r.created_at) < oneWeekAgo
      ).length;
      const weeklyChange = requestsLastWeek > 0 
        ? Math.round(((requestsThisWeek - requestsLastWeek) / requestsLastWeek) * 100)
        : requestsThisWeek > 0 ? 100 : 0;

      // Top institutions
      const institutionCounts = new Map<string, { 
        id: string;
        name: string; 
        total: number; 
        approved: number;
      }>();
      
      requests.forEach((r: any) => {
        const instId = r.institution_id;
        const instName = r.educational_institutions?.name || 'Unknown';
        const existing = institutionCounts.get(instId) || { id: instId, name: instName, total: 0, approved: 0 };
        existing.total++;
        if (r.status === 'approved') existing.approved++;
        institutionCounts.set(instId, existing);
      });

      const topInstitutions = Array.from(institutionCounts.values())
        .map((inst) => ({
          ...inst,
          totalRequests: inst.total,
          approvedCount: inst.approved,
          approvalRate: inst.total > 0 ? Math.round((inst.approved / inst.total) * 100) : 0,
        }))
        .sort((a, b) => b.totalRequests - a.totalRequests)
        .slice(0, 10);

      // Monthly data (last 12 months)
      const monthlyData: LinkRequestsMetrics['monthlyData'] = [];
      for (let i = 11; i >= 0; i--) {
        const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
        
        const monthRequests = requests.filter((r) => {
          const date = new Date(r.created_at);
          return date >= monthStart && date <= monthEnd;
        });

        monthlyData.push({
          month: monthStart.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }),
          total: monthRequests.length,
          approved: monthRequests.filter((r) => r.status === 'approved').length,
          rejected: monthRequests.filter((r) => r.status === 'rejected').length,
          pending: monthRequests.filter((r) => r.status === 'pending').length,
        });
      }

      return {
        totalRequests,
        pendingRequests,
        approvedRequests,
        rejectedRequests,
        approvalRate,
        avgResponseTimeHours,
        requestsThisWeek,
        requestsLastWeek,
        weeklyChange,
        topInstitutions,
        monthlyData,
      };
    },
  });
}
