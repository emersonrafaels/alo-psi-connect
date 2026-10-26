import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { RadarAnswers, computeOverallScore } from '@/data/radarCatalog';
import { toast } from '@/hooks/use-toast';

export interface RadarDiagnostic {
  id: string;
  institution_id: string;
  version: number;
  status: 'draft' | 'submitted' | 'archived';
  respondent_name: string | null;
  respondent_role: string | null;
  respondent_area: string | null;
  respondent_email: string | null;
  respondent_phone: string | null;
  institution_snapshot: any;
  structures: any;
  pains: any;
  adaptive_answers: any;
  maturity: any;
  priorities: any;
  overall_score: number | null;
  headline: string | null;
  strategic_reading: any;
  recommendations: any;
  consent_given: boolean;
  filled_by_user_id: string | null;
  submitted_at: string | null;
  created_at: string;
  updated_at: string;
}

export function useInstitutionRadarList(institutionId?: string | null) {
  return useQuery({
    queryKey: ['institution-radar-list', institutionId ?? 'all'],
    queryFn: async () => {
      let q = supabase
        .from('institution_radar_diagnostics' as any)
        .select('*, educational_institutions(id, name, type, logo_url)')
        .order('created_at', { ascending: false });
      if (institutionId) q = q.eq('institution_id', institutionId);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as any[];
    },
  });
}

export function useInstitutionRadar(id?: string | null) {
  return useQuery({
    queryKey: ['institution-radar', id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('institution_radar_diagnostics' as any)
        .select('*, educational_institutions(id, name, type, logo_url)')
        .eq('id', id!)
        .maybeSingle();
      if (error) throw error;
      return data as any;
    },
  });
}

export function useLatestInstitutionRadar(institutionId?: string | null) {
  return useQuery({
    queryKey: ['institution-radar-latest', institutionId],
    enabled: !!institutionId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('institution_radar_diagnostics' as any)
        .select('*')
        .eq('institution_id', institutionId!)
        .order('version', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as any;
    },
  });
}

export const CHECKPOINT_STEP_KEY = '__checkpoint_step';

export interface RadarCheckpoint {
  id: string;
  updatedAt: string;
  step: number;
  authorName: string | null;
  answers: Partial<RadarAnswers>;
}

/** Reconstrói as respostas do formulário a partir de uma linha salva. */
function rowToAnswers(row: any): Partial<RadarAnswers> {
  const { [CHECKPOINT_STEP_KEY]: _step, ...adaptive } = (row.adaptive_answers ?? {}) as Record<string, any>;
  const { name: _n, ...institution } = (row.institution_snapshot ?? {}) as Record<string, any>;
  return {
    institution: institution as any,
    respondent: {
      name: row.respondent_name ?? '',
      role: row.respondent_role ?? '',
      area: row.respondent_area ?? '',
      email: row.respondent_email ?? '',
      phone: row.respondent_phone ?? '',
    } as any,
    structures: row.structures ?? {},
    pains: row.pains ?? [],
    adaptive: adaptive as any,
    maturity: row.maturity ?? {},
    priorities: row.priorities ?? {},
    consent: !!row.consent_given,
  };
}

/** Preenchimento não concluído mais recente da instituição (checkpoint). */
export function useRadarCheckpoint(institutionId?: string | null) {
  return useQuery({
    queryKey: ['institution-radar-checkpoint', institutionId],
    enabled: !!institutionId,
    queryFn: async (): Promise<RadarCheckpoint | null> => {
      const { data, error } = await supabase
        .from('institution_radar_diagnostics' as any)
        .select('*')
        .eq('institution_id', institutionId!)
        .eq('status', 'draft')
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      const row = data as any;
      if (!row) return null;
      let authorName: string | null = null;
      if (row.filled_by_user_id) {
        const { data: prof } = await supabase
          .from('profiles')
          .select('nome, email')
          .eq('user_id', row.filled_by_user_id)
          .maybeSingle();
        authorName = (prof as any)?.nome || (prof as any)?.email || null;
      }
      if (!authorName) authorName = row.respondent_name || row.respondent_email || null;
      return {
        id: row.id,
        updatedAt: row.updated_at,
        step: Number(row.adaptive_answers?.[CHECKPOINT_STEP_KEY] ?? 0) || 0,
        authorName,
        answers: rowToAnswers(row),
      };
    },
  });
}

export function useDiscardRadarCheckpoint() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('institution_radar_diagnostics' as any)
        .update({ status: 'archived' })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['institution-radar-checkpoint'] });
      qc.invalidateQueries({ queryKey: ['institution-radar-list'] });
    },
    onError: (e: any) => {
      toast({ title: 'Não foi possível descartar o checkpoint', description: e.message, variant: 'destructive' });
    },
  });
}

export function useSaveRadarCheckpoint() {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (payload: {
      id?: string | null;
      institution_id: string;
      answers: RadarAnswers;
      institution_name?: string;
      step?: number;
    }) => {
      const { id, institution_id, answers, institution_name, step = 0 } = payload;
      const overall_score = computeOverallScore(answers.maturity);

      const row = {
        institution_id,
        respondent_name: answers.respondent.name ?? null,
        respondent_role: answers.respondent.role ?? null,
        respondent_area: answers.respondent.area ?? null,
        respondent_email: answers.respondent.email ?? null,
        respondent_phone: answers.respondent.phone ?? null,
        institution_snapshot: { name: institution_name, ...answers.institution } as any,
        structures: answers.structures as any,
        pains: answers.pains as any,
        adaptive_answers: { ...answers.adaptive, [CHECKPOINT_STEP_KEY]: step } as any,
        maturity: answers.maturity as any,
        priorities: answers.priorities as any,
        consent_given: answers.consent,
        overall_score,
        filled_by_user_id: user?.id ?? null,
        status: 'draft' as const,
      };

      if (id) {
        const { data, error } = await supabase
          .from('institution_radar_diagnostics' as any)
          .update(row)
          .eq('id', id)
          .select('*')
          .single();
        if (error) throw error;
        return data;
      } else {
        // Nova versão: v = maxVersion+1
        const { data: last } = await supabase
          .from('institution_radar_diagnostics' as any)
          .select('version')
          .eq('institution_id', institution_id)
          .order('version', { ascending: false })
          .limit(1)
          .maybeSingle();
        const version = ((last as any)?.version ?? 0) + 1;
        const { data, error } = await supabase
          .from('institution_radar_diagnostics' as any)
          .insert({ ...row, version })
          .select('*')
          .single();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['institution-radar-list'] });
      qc.invalidateQueries({ queryKey: ['institution-radar-latest'] });
      qc.invalidateQueries({ queryKey: ['institution-radar-checkpoint'] });
    },
    onError: (e: any) => {
      toast({ title: 'Erro ao salvar', description: e.message, variant: 'destructive' });
    },
  });
}

export function useSubmitRadar() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase.functions.invoke('radar-institutional-analyze', {
        body: { diagnostic_id: id },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['institution-radar-list'] });
      qc.invalidateQueries({ queryKey: ['institution-radar'] });
      qc.invalidateQueries({ queryKey: ['institution-radar-latest'] });
      qc.invalidateQueries({ queryKey: ['institution-radar-checkpoint'] });
      toast({ title: 'Radar analisado', description: 'A leitura estratégica foi gerada com sucesso.' });
    },
    onError: (e: any) => {
      toast({ title: 'Erro na análise', description: e.message, variant: 'destructive' });
    },
  });
}
