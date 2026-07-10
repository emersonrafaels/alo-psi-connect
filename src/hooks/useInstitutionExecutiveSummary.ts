import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

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
}

async function fetchSummary(institutionId: string): Promise<ExecutiveSummary> {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 86400000);
  const twoWeekAgo = new Date(now.getTime() - 14 * 86400000);

  const { data: linked } = await supabase
    .from('patient_institutions')
    .select('patient_id')
    .eq('institution_id', institutionId);

  const pacienteIds = (linked || []).map((l: any) => l.patient_id);

  // Map pacientes.id -> profiles.id, since mood_entries.profile_id references profiles.id
  const { data: pacientes } = pacienteIds.length
    ? await supabase.from('pacientes').select('id, profile_id').in('id', pacienteIds)
    : { data: [] as any[] };

  const profileIds = (pacientes || [])
    .map((p: any) => p.profile_id)
    .filter(Boolean);

  const safeProfileIds = profileIds.length ? profileIds : ['00000000-0000-0000-0000-000000000000'];
  const totalStudents = pacienteIds.length;

  const [{ data: entriesWeek }, { data: entriesPrev }, { data: triages }] = await Promise.all([
    supabase
      .from('mood_entries')
      .select('id,profile_id,date')
      .in('profile_id', safeProfileIds)
      .gte('date', weekAgo.toISOString().slice(0, 10)),
    supabase
      .from('mood_entries')
      .select('id,profile_id,date')
      .in('profile_id', safeProfileIds)
      .gte('date', twoWeekAgo.toISOString().slice(0, 10))
      .lt('date', weekAgo.toISOString().slice(0, 10)),
    supabase
      .from('student_triage')
      .select('id,status,risk_level,priority,created_at,resolved_at,patient_id')
      .eq('institution_id', institutionId)
      .order('created_at', { ascending: false })
      .limit(200),
  ]);

  const activeSet = new Set((entriesWeek || []).map((e: any) => e.profile_id));
  const prevSet = new Set((entriesPrev || []).map((e: any) => e.profile_id));

  const sparkline: number[] = Array(7).fill(0);
  (entriesWeek || []).forEach((e: any) => {
    const d = new Date(e.date + 'T00:00:00');
    const idx = 6 - Math.min(6, Math.floor((now.getTime() - d.getTime()) / 86400000));
    if (idx >= 0 && idx < 7) sparkline[idx]++;
  });

  const totalTriage = (triages || []).length;
  const resolvedTriage = (triages || []).filter((t: any) => t.status === 'resolved').length;
  const criticalOpen = (triages || []).filter(
    (t: any) =>
      t.status !== 'resolved' &&
      ['alto', 'critico', 'crítico', 'high', 'critical'].includes(String(t.risk_level).toLowerCase())
  ).length;

  const alerts: AlertItem[] = [];
  (triages || []).slice(0, 5).forEach((t: any) => {
    if (t.status !== 'resolved') {
      alerts.push({
        id: `tri-${t.id}`,
        type: 'triage',
        title: `Triagem em aberto (risco ${t.risk_level || 'n/a'})`,
        subtitle: `Prioridade: ${t.priority || 'n/a'}`,
        timestamp: t.created_at,
        severity: ['alto', 'critico', 'high', 'critical'].includes(String(t.risk_level).toLowerCase())
          ? 'high'
          : 'medium',
      });
    }
  });

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
    engagementRate: patientIds.length > 0 ? activeSet.size / patientIds.length : 0,
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
