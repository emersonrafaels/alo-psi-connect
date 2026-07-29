import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

/**
 * Verifica se o usuário atual pode acessar o Radar Institucional.
 * Libera para: admin, super_admin, institution_admin, facilitator
 * e usuários adicionados manualmente na lista de acesso (radar_access_grants).
 */
export const useRadarAccess = () => {
  const { user, loading: authLoading } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['radar-access', user?.id],
    queryFn: async () => {
      if (!user) return false;
      const { data, error } = await supabase.rpc('has_radar_access', { _user_id: user.id });
      if (error) throw error;
      return !!data;
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  return { hasAccess: !!data, loading: authLoading || (!!user && isLoading) };
};

export interface RadarAccessGrant {
  id: string;
  user_id: string;
  granted_by: string | null;
  note: string | null;
  created_at: string;
  profile?: {
    nome: string | null;
    email: string | null;
    tipo_usuario: string | null;
  } | null;
  granted_by_name?: string | null;
}

/** Lista e gestão dos acessos liberados manualmente (somente admin). */
export const useRadarAccessGrants = () => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['radar-access-grants'],
    queryFn: async (): Promise<RadarAccessGrant[]> => {
      const { data, error } = await supabase
        .from('radar_access_grants')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;

      const rows = data ?? [];
      const ids = Array.from(
        new Set(rows.flatMap((r) => [r.user_id, r.granted_by].filter(Boolean) as string[]))
      );

      let profilesMap = new Map<string, { nome: string | null; email: string | null; tipo_usuario: string | null }>();
      if (ids.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, nome, email, tipo_usuario')
          .in('user_id', ids);
        profilesMap = new Map(
          (profiles ?? []).map((p: any) => [p.user_id, { nome: p.nome, email: p.email, tipo_usuario: p.tipo_usuario }])
        );
      }

      return rows.map((r) => ({
        ...r,
        profile: profilesMap.get(r.user_id) ?? null,
        granted_by_name: r.granted_by ? profilesMap.get(r.granted_by)?.nome ?? null : null,
      }));
    },
  });

  const grant = useMutation({
    mutationFn: async ({ userId, note }: { userId: string; note?: string }) => {
      const { data: auth } = await supabase.auth.getUser();
      const { error } = await supabase.from('radar_access_grants').insert({
        user_id: userId,
        note: note?.trim() || null,
        granted_by: auth.user?.id ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Acesso ao Radar liberado');
      queryClient.invalidateQueries({ queryKey: ['radar-access-grants'] });
      queryClient.invalidateQueries({ queryKey: ['radar-access'] });
    },
    onError: (e: any) => {
      toast.error(
        e?.code === '23505' ? 'Este usuário já possui acesso liberado' : 'Não foi possível liberar o acesso'
      );
    },
  });

  const revoke = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('radar_access_grants').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Acesso removido');
      queryClient.invalidateQueries({ queryKey: ['radar-access-grants'] });
      queryClient.invalidateQueries({ queryKey: ['radar-access'] });
    },
    onError: () => toast.error('Não foi possível remover o acesso'),
  });

  return { grants: query.data ?? [], isLoading: query.isLoading, grant, revoke };
};

/** Busca usuários por nome ou e-mail para liberar acesso. */
export const useProfileSearch = (term: string) => {
  return useQuery({
    queryKey: ['radar-access-profile-search', term],
    queryFn: async () => {
      const like = `%${term}%`;
      const { data, error } = await supabase
        .from('profiles')
        .select('id, user_id, nome, email, tipo_usuario')
        .or(`nome.ilike.${like},email.ilike.${like}`)
        .not('user_id', 'is', null)
        .limit(10);
      if (error) throw error;
      return data ?? [];
    },
    enabled: term.trim().length >= 3,
  });
};
