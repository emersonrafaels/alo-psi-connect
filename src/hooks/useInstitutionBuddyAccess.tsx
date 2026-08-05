import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface BuddyAccessViewer {
  user_id: string;
  nome: string | null;
  email: string | null;
  role: string | null;
  enabled: boolean;
}

export interface BuddyAccessStudent {
  patient_id: string;
  nome: string | null;
  email: string | null;
  enabled: boolean;
}

const viewersKey = (institutionId: string | null) => ['institution-buddy-viewers', institutionId];
const studentsKey = (institutionId: string | null) => ['institution-buddy-students', institutionId];

/** Admin: usuários institucionais da instituição + quem está liberado. */
export const useInstitutionBuddyViewers = (institutionId: string | null) => {
  return useQuery({
    queryKey: viewersKey(institutionId),
    enabled: !!institutionId,
    queryFn: async (): Promise<BuddyAccessViewer[]> => {
      const [{ data: users, error: usersError }, { data: grants, error: grantsError }] = await Promise.all([
        supabase
          .from('institution_users')
          .select('user_id, role, is_active')
          .eq('institution_id', institutionId!)
          .eq('is_active', true),
        supabase
          .from('institution_buddy_viewers' as any)
          .select('user_id')
          .eq('institution_id', institutionId!),
      ]);
      if (usersError) throw usersError;
      if (grantsError) throw grantsError;

      const enabled = new Set(((grants as any[]) ?? []).map((g) => g.user_id as string));
      const ids = Array.from(new Set(((users as any[]) ?? []).map((u) => u.user_id as string)));

      let profilesMap = new Map<string, { nome: string | null; email: string | null }>();
      if (ids.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, nome, email')
          .in('user_id', ids);
        profilesMap = new Map(
          (profiles ?? []).map((p: any) => [p.user_id, { nome: p.nome, email: p.email }])
        );
      }

      return ((users as any[]) ?? [])
        .map((u) => ({
          user_id: u.user_id as string,
          role: (u.role as string) ?? null,
          nome: profilesMap.get(u.user_id)?.nome ?? null,
          email: profilesMap.get(u.user_id)?.email ?? null,
          enabled: enabled.has(u.user_id),
        }))
        .sort((a, b) => (a.nome ?? a.email ?? '').localeCompare(b.nome ?? b.email ?? ''));
    },
  });
};

/** Admin: alunos vinculados à instituição + quais têm o Buddy liberado. */
export const useInstitutionBuddyStudents = (institutionId: string | null) => {
  return useQuery({
    queryKey: studentsKey(institutionId),
    enabled: !!institutionId,
    queryFn: async (): Promise<BuddyAccessStudent[]> => {
      const [{ data: links, error: linksError }, { data: grants, error: grantsError }] = await Promise.all([
        supabase
          .from('patient_institutions')
          .select('patient_id, pacientes!inner(id, profiles!inner(nome, email))')
          .eq('institution_id', institutionId!),
        supabase
          .from('institution_buddy_students' as any)
          .select('patient_id')
          .eq('institution_id', institutionId!),
      ]);
      if (linksError) throw linksError;
      if (grantsError) throw grantsError;

      const enabled = new Set(((grants as any[]) ?? []).map((g) => g.patient_id as string));

      return ((links as any[]) ?? [])
        .map((l) => ({
          patient_id: l.patient_id as string,
          nome: l.pacientes?.profiles?.nome ?? null,
          email: l.pacientes?.profiles?.email ?? null,
          enabled: enabled.has(l.patient_id),
        }))
        .sort((a, b) => (a.nome ?? a.email ?? '').localeCompare(b.nome ?? b.email ?? ''));
    },
  });
};

/** Admin: grava as duas listas (substitui o estado atual). */
export const useSaveInstitutionBuddyAccess = (institutionId: string | null) => {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ viewerIds, patientIds }: { viewerIds: string[]; patientIds: string[] }) => {
      if (!institutionId) throw new Error('Instituição não selecionada');

      // Viewers
      const { data: currentViewers } = await supabase
        .from('institution_buddy_viewers' as any)
        .select('user_id')
        .eq('institution_id', institutionId);
      const currentViewerIds = ((currentViewers as any[]) ?? []).map((v) => v.user_id as string);

      const viewersToAdd = viewerIds.filter((id) => !currentViewerIds.includes(id));
      const viewersToRemove = currentViewerIds.filter((id) => !viewerIds.includes(id));

      if (viewersToAdd.length > 0) {
        const { error } = await supabase.from('institution_buddy_viewers' as any).insert(
          viewersToAdd.map((id) => ({
            institution_id: institutionId,
            user_id: id,
            granted_by: user?.id ?? null,
          }))
        );
        if (error) throw error;
      }
      if (viewersToRemove.length > 0) {
        const { error } = await supabase
          .from('institution_buddy_viewers' as any)
          .delete()
          .eq('institution_id', institutionId)
          .in('user_id', viewersToRemove);
        if (error) throw error;
      }

      // Students
      const { data: currentStudents } = await supabase
        .from('institution_buddy_students' as any)
        .select('patient_id')
        .eq('institution_id', institutionId);
      const currentPatientIds = ((currentStudents as any[]) ?? []).map((s) => s.patient_id as string);

      const studentsToAdd = patientIds.filter((id) => !currentPatientIds.includes(id));
      const studentsToRemove = currentPatientIds.filter((id) => !patientIds.includes(id));

      if (studentsToAdd.length > 0) {
        const { error } = await supabase.from('institution_buddy_students' as any).insert(
          studentsToAdd.map((id) => ({
            institution_id: institutionId,
            patient_id: id,
            granted_by: user?.id ?? null,
          }))
        );
        if (error) throw error;
      }
      if (studentsToRemove.length > 0) {
        const { error } = await supabase
          .from('institution_buddy_students' as any)
          .delete()
          .eq('institution_id', institutionId)
          .in('patient_id', studentsToRemove);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success('Acessos ao Buddy atualizados');
      qc.invalidateQueries({ queryKey: viewersKey(institutionId) });
      qc.invalidateQueries({ queryKey: studentsKey(institutionId) });
      qc.invalidateQueries({ queryKey: ['institution-buddy-access'] });
    },
    onError: (e: any) => {
      toast.error(e?.message ?? 'Não foi possível salvar os acessos');
    },
  });
};

export type BuddyAttentionLevel = 'alto' | 'moderado' | 'baixo' | 'sem-dados';

export interface AllowedBuddyStudent {
  patient_id: string;
  nome: string | null;
  attention: BuddyAttentionLevel;
  last_insight_at: string | null;
  granted_at: string | null;
  is_stale: boolean;
}

const attentionFromInsight = (insight: any): BuddyAttentionLevel => {
  if (!insight) return 'sem-dados';
  const points: any[] = Array.isArray(insight.attention_points) ? insight.attention_points : [];
  const severities = points.map((p) => String(p?.severity ?? '').toLowerCase());
  if (severities.some((s) => s === 'high' || s === 'alto')) return 'alto';
  if (severities.some((s) => s === 'medium' || s === 'medio' || s === 'médio')) return 'moderado';
  return 'baixo';
};

const attentionRank: Record<BuddyAttentionLevel, number> = {
  alto: 0,
  moderado: 1,
  baixo: 2,
  'sem-dados': 3,
};

const STALE_DAYS = 15;

/**
 * Portal institucional: o usuário logado pode ver o Buddy dos alunos?
 * Retorna a lista de alunos liberados (vazia quando não há acesso),
 * já com nível de atenção e frescor dos dados.
 */
export const useAllowedBuddyStudents = (institutionId: string | null) => {
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ['institution-buddy-access', institutionId, user?.id],
    enabled: !!institutionId && !!user?.id,
    queryFn: async (): Promise<AllowedBuddyStudent[]> => {
      const { data: viewer, error: viewerError } = await supabase
        .from('institution_buddy_viewers' as any)
        .select('id')
        .eq('institution_id', institutionId!)
        .eq('user_id', user!.id)
        .maybeSingle();
      if (viewerError) throw viewerError;
      if (!viewer) return [];

      const { data, error } = await supabase
        .from('institution_buddy_students' as any)
        .select('patient_id, created_at, pacientes!inner(id, profiles!inner(nome))')
        .eq('institution_id', institutionId!);
      if (error) throw error;

      const rows = (data as any[]) ?? [];
      const ids = rows.map((r) => r.patient_id as string);

      const latestByPatient = new Map<string, any>();
      if (ids.length > 0) {
        const { data: insights } = await supabase
          .from('buddy_insights' as any)
          .select('patient_id, attention_points, created_at, period_end')
          .in('patient_id', ids)
          .order('created_at', { ascending: false });
        for (const i of ((insights as any[]) ?? [])) {
          if (!latestByPatient.has(i.patient_id)) latestByPatient.set(i.patient_id, i);
        }
      }

      const now = Date.now();

      return rows
        .map((r) => {
          const insight = latestByPatient.get(r.patient_id) ?? null;
          const lastAt = insight?.created_at ?? null;
          const ageDays = lastAt ? (now - new Date(lastAt).getTime()) / 86400000 : Infinity;
          return {
            patient_id: r.patient_id as string,
            nome: r.pacientes?.profiles?.nome ?? null,
            attention: attentionFromInsight(insight),
            last_insight_at: lastAt,
            granted_at: (r.created_at as string) ?? null,
            is_stale: !lastAt || ageDays > STALE_DAYS,
          };
        })
        .sort((a, b) => {
          const diff = attentionRank[a.attention] - attentionRank[b.attention];
          if (diff !== 0) return diff;
          const at = a.last_insight_at ? new Date(a.last_insight_at).getTime() : 0;
          const bt = b.last_insight_at ? new Date(b.last_insight_at).getTime() : 0;
          if (bt !== at) return bt - at;
          return (a.nome ?? '').localeCompare(b.nome ?? '');
        });
    },
  });

  return {
    students: query.data ?? [],
    canView: (query.data ?? []).length > 0,
    isLoading: query.isLoading,
  };
};


/** Portal institucional: retrato + último insight de um aluno liberado. */
export const useStudentBuddyData = (patientId: string | null) => {
  return useQuery({
    queryKey: ['institution-student-buddy', patientId],
    enabled: !!patientId,
    queryFn: async () => {
      const [{ data: portrait }, { data: insight }] = await Promise.all([
        supabase
          .from('buddy_portraits' as any)
          .select('*')
          .eq('patient_id', patientId!)
          .maybeSingle(),
        supabase
          .from('buddy_insights' as any)
          .select('*')
          .eq('patient_id', patientId!)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);
      return { portrait: (portrait as any) ?? null, insight: (insight as any) ?? null };
    },
  });
};
