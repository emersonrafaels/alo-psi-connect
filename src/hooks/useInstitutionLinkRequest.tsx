import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

interface InstitutionLinkRequest {
  id: string;
  institution_id: string;
  institution_name?: string;
  user_type: 'paciente' | 'profissional';
  status: 'pending' | 'approved' | 'rejected';
  request_message?: string;
  relationship_type?: string;
  enrollment_type?: string;
  created_at: string;
  reviewed_at?: string;
  review_notes?: string;
}

export function useInstitutionLinkRequest() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: requests, isLoading } = useQuery({
    queryKey: ['institution-link-requests', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('institution_link_requests')
        .select(`
          *,
          educational_institutions!inner (
            name
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map((item: any) => ({
        ...item,
        institution_name: item.educational_institutions.name,
      })) as InstitutionLinkRequest[];
    },
    enabled: !!user?.id,
  });

  const createRequestMutation = useMutation({
    mutationFn: async (requestData: {
      institutionId: string;
      requestMessage?: string;
      userType: 'paciente' | 'profissional';
      tenantId: string;
      relationshipType?: 'employee' | 'consultant' | 'supervisor' | 'intern';
      enrollmentType?: 'student' | 'alumni' | 'employee';
    }) => {
      const { data, error } = await supabase.functions.invoke(
        'request-institution-link',
        { body: requestData }
      );

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['institution-link-requests'] });
      toast({
        title: 'Solicitação enviada!',
        description: 'Sua solicitação foi enviada e logo será analisada pela instituição.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao enviar solicitação',
        description: error.message || 'Não foi possível enviar a solicitação. Tente novamente.',
        variant: 'destructive',
      });
    },
  });

  return {
    requests: requests || [],
    isLoading,
    createRequest: createRequestMutation.mutate,
    isCreating: createRequestMutation.isPending,
  };
}
