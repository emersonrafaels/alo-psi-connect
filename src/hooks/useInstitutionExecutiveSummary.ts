import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useMemo } from 'react';
import { useStudentTriageData } from '@/hooks/useStudentTriage';
import { isAwaitingTriage } from '@/features/triage/priorities';

export interface AlertItem {
  id: string;
  type: 'triage' | 'mood_drop' | 'absence';
  title: string;
  subtitle: string;
  timestamp: string;
  severity: 'low' | 'medium' | 'high';
}

export interface ExecutiveSummary {
  activeStudentsWeek: number;
  activeStudentsPrevWeek: number;
  sparkline: number[];
  engagementRate: number;
  criticalOpen: number;
  resolutionRate: number;
  totalTriage: number;
  resolvedTriage: number;
  alerts: AlertItem[];
  criticalTriageAlerts: AlertItem[];
}

export interface PortalSummaryRaw {
  total_students: number;
  enrolled_students: number;
  active_week: number;
  active_prev_week: number;
  sparkline: number[];
  total_triage: number;
  resolved_triage: number;
  open_critical: { id: string; risk_level: string | null; priority: string | null; created_at: string }[];
  absent_profile_ids: string[];
}

const RISK_PT: Record<string, string> = {
  high: 'alto', critical: 'Sinal elevado', medium: 'moderado', low: 'baixo',
  alto: 'alto', critico: 'Sinal elevado', 'crítico': 'Sinal elevado', moderado: 'moderado', baixo: 'baixo',
};
const PRIORITY_PT: Record<string, string> = {
  high: 'Alta', critical: 'Crítica', medium: 'Média', low: 'Baixa',
  alta: 'Alta', 'crítica': 'Crítica', critica: 'Crítica', media: 'Média', 'média': 'Média', baixa: 'Baixa',
};
const humanizeRisk = (r?: string | null) => RISK_PT[String(r || '').toLowerCase()] || 'não informado';
const humanizePriority = (p?: string | null) => PRIORITY_PT[String(p || '').toLowerCase()] || 'não definida';

/** Turns the database summary into the portal's executive numbers. */
export function mapPortalSummary(raw: PortalSummaryRaw, criticalOpen: number, now = new Date()): ExecutiveSummary {
  const totalStudents = Number(raw.total_students) || 0;
  const activeWeek = Number(raw.active_week) || 0;
  const totalTriage = Number(raw.total_triage) || 0;
  const resolvedTriage = Number(raw.resolved_triage) || 0;
  const criticalTriageAlerts: AlertItem[] = (raw.open_critical || []).map((t) => ({
    id: `tri-${t.id}`,
    type: 'triage',
    title: `Triagem em aberto — risco ${humanizeRisk(t.risk_level)}`,
    subtitle: `Prioridade: ${humanizePriority(t.priority)}`,
    timestamp: t.created_at,
    severity: 'high',
  }));
  const alerts: AlertItem[] = criticalTriageAlerts.slice(0, 5);
  (raw.absent_profile_ids || []).slice(0, 5).forEach((pid) => alerts.push({
    id: `abs-${pid}`,
    type: 'absence',
    title: 'Ausência prolongada no diário',
    subtitle: 'Aluno previamente engajado sem registro há mais de 7 dias',
    timestamp: now.toISOString(),
    severity: 'medium',
  }));
  const spark = Array.isArray(raw.sparkline) ? raw.sparkline.map(Number) : [];
  return {
    activeStudentsWeek: activeWeek,
    activeStudentsPrevWeek: Number(raw.active_prev_week) || 0,
    sparkline: spark.length === 7 ? spark : Array(7).fill(0),
    engagementRate: totalStudents > 0 ? activeWeek / totalStudents : 0,
    criticalOpen,
    resolutionRate: totalTriage > 0 ? resolvedTriage / totalTriage : 0,
    totalTriage,
    resolvedTriage,
    alerts: alerts.slice(0, 10),
    criticalTriageAlerts,
  };
}

export function usePortalSummary(institutionId?: string) {
  return useQuery({
    queryKey: ['institution-portal-summary', institutionId],
    queryFn: async () => {
      const { data, error } = await (supabase.rpc as any)('get_institution_portal_summary', { p_institution_id: institutionId });
      if (error) throw error;
      return data as PortalSummaryRaw;
    },
    enabled: !!institutionId,
    staleTime: 60 * 1000,
  });
}

/**
 * Executive numbers arrive first from the aggregate summary; the "awaiting
 * triage" count fills in afterwards from the triage data shared with the
 * Triagem tab and Panorama card (same cache key, fetched once).
 */
export function useInstitutionExecutiveSummary(institutionId?: string) {
  const summary = usePortalSummary(institutionId);
  const risk = useStudentTriageData(institutionId ?? null, 15);
  const criticalOpen = (risk.data || []).filter(isAwaitingTriage).length;
  const data = useMemo(
    () => (summary.data ? mapPortalSummary(summary.data, criticalOpen) : undefined),
    [summary.data, criticalOpen],
  );
  return { data, isLoading: summary.isLoading, criticalLoading: risk.isLoading, error: summary.error };
}
