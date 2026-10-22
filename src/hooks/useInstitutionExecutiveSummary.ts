import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { fetchAllPaged, fetchInChunks } from '@/lib/supabasePaging';

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

async function fetchSummary(institutionId: string): Promise<ExecutiveSummary> {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 86400000);
  const twoWeekAgo = new Date(now.getTime() - 14 * 86400000);

  const linked = await fetchAllPaged((f, t) => supabase
    .from('patient_institutions')
    .select('patient_id')
    .eq('institution_id', institutionId).order('id').range(f, t));

  const pacienteIds = (linked || []).map((l: any) => l.patient_id);

  // Map pacientes.id -> profiles.id, since mood_entries.profile_id references profiles.id
  const { data: pacientes } = pacienteIds.length
    ? { data: await fetchInChunks(pacienteIds, (c, f, t) => supabase.from('pacientes').select('id, profile_id').in('id', c).order('id').range(f, t)) }
    : { data: [] as any[] };

  const profileIds = (pacientes || [])
    .map((p: any) => p.profile_id)
    .filter(Boolean);

  const safeProfileIds = profileIds.length ? profileIds : ['00000000-0000-0000-0000-000000000000'];
  const totalStudents = pacienteIds.length;

  const [{ data: entriesWeek }, { data: entriesPrev }, { data: triages }] = await Promise.all([
    fetchInChunks(safeProfileIds, (c, f, t) => supabase
      .from('mood_entries')
      .select('id,profile_id,date')
      .in('profile_id', c)
      .gte('date', weekAgo.toISOString().slice(0, 10)).order('id').range(f, t)).then((data) => ({ data })),
    fetchInChunks(safeProfileIds, (c, f, t) => supabase
      .from('mood_entries')
      .select('id,profile_id,date')
      .in('profile_id', c)
      .gte('date', twoWeekAgo.toISOString().slice(0, 10))
      .lt('date', weekAgo.toISOString().slice(0, 10)).order('id').range(f, t)).then((data) => ({ data })),
    fetchAllPaged((f, t) => supabase
      .from('student_triage')
      .select('id,status,risk_level,priority,created_at,resolved_at,patient_id')
      .eq('institution_id', institutionId)
      .order('id').range(f, t)).then((data) => ({ data })),
  ]);

  const activeSet = new Set((entriesWeek || []).map((e: any) => e.profile_id));
  const prevSet = new Set((entriesPrev || []).map((e: any) => e.profile_id));

  const sparkline: number[] = Array(7).fill(0);
  (entriesWeek || []).forEach((e: any) => {
    const d = new Date(e.date + 'T00:00:00');
    const idx = 6 - Math.min(6, Math.floor((now.getTime() - d.getTime()) / 86400000));
    if (idx >= 0 && idx < 7) sparkline[idx]++;
  });

  const HIGH_RISK = ['alto', 'critico', 'crítico', 'high', 'critical'];
  const sortedTriages = [...(triages || [])].sort((a: any, b: any) =>
    String(b.created_at).localeCompare(String(a.created_at)));
  const totalTriage = sortedTriages.length;
  const resolvedTriage = sortedTriages.filter((t: any) => t.status === 'resolved').length;
  const openCritical = sortedTriages.filter(
    (t: any) => t.status !== 'resolved' && HIGH_RISK.includes(String(t.risk_level).toLowerCase()),
  );
  const criticalOpen = openCritical.length;

  const RISK_PT: Record<string, string> = {
    high: 'alto', critical: 'crítico', medium: 'moderado', low: 'baixo',
    alto: 'alto', critico: 'crítico', 'crítico': 'crítico', moderado: 'moderado', baixo: 'baixo',
  };
  const PRIORITY_PT: Record<string, string> = {
    high: 'Alta', critical: 'Crítica', medium: 'Média', low: 'Baixa',
    alta: 'Alta', 'crítica': 'Crítica', critica: 'Crítica', media: 'Média', 'média': 'Média', baixa: 'Baixa',
  };
  const humanizeRisk = (r?: string | null) => RISK_PT[String(r || '').toLowerCase()] || 'não informado';
  const humanizePriority = (p?: string | null) => PRIORITY_PT[String(p || '').toLowerCase()] || 'não definida';

  const toAlert = (t: any): AlertItem => ({
    id: `tri-${t.id}`,
    type: 'triage',
    title: `Triagem em aberto — risco ${humanizeRisk(t.risk_level)}`,
    subtitle: `Prioridade: ${humanizePriority(t.priority)}`,
    timestamp: t.created_at,
    severity: HIGH_RISK.includes(String(t.risk_level).toLowerCase()) ? 'high' : 'medium',
  });
  const criticalTriageAlerts = openCritical.map(toAlert);

  const alerts: AlertItem[] = criticalTriageAlerts.slice(0, 5);

  // Ausência prolongada: alunos que estavam ativos na semana anterior à retrasada e não têm registro há 14+ dias
  const absentIds = Array.from(prevSet).filter((id) => !activeSet.has(id)).slice(0, 5);
  absentIds.forEach((pid) => {
    alerts.push({
      id: `abs-${pid}`,
      type: 'absence',
      title: 'Ausência prolongada no diário',
      subtitle: 'Aluno previamente engajado sem registro há mais de 7 dias',
      timestamp: now.toISOString(),
      severity: 'medium',
    });
  });

  return {
    activeStudentsWeek: activeSet.size,
    activeStudentsPrevWeek: prevSet.size,
    sparkline,
    engagementRate: totalStudents > 0 ? activeSet.size / totalStudents : 0,
    criticalOpen,
    resolutionRate: totalTriage > 0 ? resolvedTriage / totalTriage : 0,
    totalTriage,
    resolvedTriage,
    alerts: alerts.slice(0, 10),
  };
}

export function useInstitutionExecutiveSummary(institutionId?: string) {
  return useQuery({
    queryKey: ['institution-exec-summary', institutionId],
    queryFn: () => fetchSummary(institutionId!),
    enabled: !!institutionId,
    staleTime: 5 * 60 * 1000,
  });
}
