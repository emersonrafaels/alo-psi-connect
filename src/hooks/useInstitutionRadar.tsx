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

export function useSaveRadarDraft() {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (payload: {
      id?: string | null;
      institution_id: string;
      answers: RadarAnswers;
      institution_name?: string;
    }) => {
      const { id, institution_id, answers, institution_name } = payload;
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
        adaptive_answers: answers.adaptive as any,
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
      toast({ title: 'Radar analisado', description: 'A leitura estratégica foi gerada com sucesso.' });
    },
    onError: (e: any) => {
      toast({ title: 'Erro na análise', description: e.message, variant: 'destructive' });
    },
  });
}
