import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const CATEGORY = 'admin_access';
const KEY = 'patient_full_view_allowed_users';

interface AllowedConfig {
  id: string | null;
  list: string[];
}

export const useTriageAllowedList = () => {
  return useQuery<AllowedConfig>({
    queryKey: ['triage-allowed-list'],
    queryFn: async () => {
      const { data } = await supabase
        .from('system_configurations')
        .select('id, value')
        .eq('category', CATEGORY)
        .eq('key', KEY)
        .is('tenant_id', null)
        .maybeSingle();

      let list: string[] = [];
      if (data) {
        try {
          list = typeof data.value === 'string'
            ? JSON.parse(data.value as string)
            : (data.value as any);
        } catch {
          list = [];
        }
      }
      return { id: data?.id || null, list: Array.isArray(list) ? list : [] };
    },
    staleTime: 30_000,
  });
};

export const useToggleTriageAccess = () => {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ userId, enable }: { userId: string; enable: boolean }) => {
      const current = await qc.fetchQuery<AllowedConfig>({
        queryKey: ['triage-allowed-list'],
        queryFn: async () => {
          const { data } = await supabase
            .from('system_configurations')
            .select('id, value')
            .eq('category', CATEGORY)
            .eq('key', KEY)
            .is('tenant_id', null)
            .maybeSingle();
          let list: string[] = [];
          if (data) {
            try {
              list = typeof data.value === 'string'
                ? JSON.parse(data.value as string)
                : (data.value as any);
            } catch {
              list = [];
            }
          }
          return { id: data?.id || null, list: Array.isArray(list) ? list : [] };
        },
      });

      const newList = enable
        ? Array.from(new Set([...current.list, userId]))
        : current.list.filter((id) => id !== userId);

      if (current.id) {
        const { error } = await supabase
          .from('system_configurations')
          .update({ value: JSON.stringify(newList), updated_at: new Date().toISOString() })
          .eq('id', current.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('system_configurations')
          .insert({
            category: CATEGORY,
            key: KEY,
            value: JSON.stringify(newList),
            tenant_id: null,
            description: 'Usuários autorizados a acessar a página de listagem completa de estudantes',
          });
        if (error) throw error;
      }

      return { enable };
    },
    onSuccess: ({ enable }) => {
      qc.invalidateQueries({ queryKey: ['triage-allowed-list'] });
      qc.invalidateQueries({ queryKey: ['patient-full-view-allowed-list'] });
      qc.invalidateQueries({ queryKey: ['patient-full-view-access'] });
      toast({
        title: enable ? 'Acesso à Triagem habilitado' : 'Acesso à Triagem desabilitado',
      });
    },
    onError: (e: any) => {
      toast({ title: 'Erro', description: e.message, variant: 'destructive' });
    },
  });
};
