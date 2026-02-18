import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Fire-and-forget notification helper
function notifyInstitutionAction(action_type: string, institution_id: string, metadata: Record<string, any>) {
  supabase.functions.invoke('notify-institution-action', {
    body: { action_type, institution_id, metadata },
  }).catch(err => console.warn('Notification failed (non-blocking):', err));
}

export type RiskLevel = 'critical' | 'alert' | 'attention' | 'healthy' | 'no_data';

export interface StudentRiskData {
  patientId: string;
  studentName: string;
  profileId: string | null;
  userId: string | null;
  riskLevel: RiskLevel;
  avgMood: number | null;
  avgAnxiety: number | null;
  avgEnergy: number | null;
  avgSleep: number | null;
  moodTrend: number | null; // percentage change
  entryCount: number;
  lastTriageStatus: string | null;
  lastTriageId: string | null;
  moodHistory: number[];
}

export interface TriageRecord {
  id: string;
  patient_id: string;
  institution_id: string;
  triaged_by: string;
  triaged_by_name?: string;
  status: string;
  risk_level: string;
  priority: string;
  recommended_action: string | null;
  notes: string | null;
  follow_up_date: string | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
}

function calculateRiskLevel(
  avgMood: number | null,
  avgAnxiety: number | null,
  avgEnergy: number | null,
  avgSleep: number | null,
  moodTrend: number | null
): RiskLevel {
  if (avgMood === null) return 'no_data';

  // Critical
  if (
    avgMood <= 1.5 ||
    (avgAnxiety !== null && avgAnxiety >= 4.5) ||
    (moodTrend !== null && moodTrend <= -40)
  ) return 'critical';

  // Alert
  if (
    avgMood <= 2.5 ||
    (avgAnxiety !== null && avgAnxiety >= 3.5) ||
    (avgEnergy !== null && avgEnergy <= 1.5)
  ) return 'alert';

  // Attention
  if (
    avgMood <= 3.0 ||
    (avgAnxiety !== null && avgAnxiety >= 3.0) ||
    (avgSleep !== null && avgSleep <= 2.0)
  ) return 'attention';

  return 'healthy';
}

function calculateTrend(entries: any[]): number | null {
  if (entries.length < 4) return null;
  const half = Math.floor(entries.length / 2);
  const firstHalf = entries.slice(0, half);
  const secondHalf = entries.slice(half);
  const avgFirst = firstHalf.reduce((s: number, e: any) => s + (e.mood_score || 0), 0) / firstHalf.length;
  const avgSecond = secondHalf.reduce((s: number, e: any) => s + (e.mood_score || 0), 0) / secondHalf.length;
  if (avgFirst === 0) return null;
  return Math.round(((avgSecond - avgFirst) / avgFirst) * 100);
}

export function useStudentTriageData(institutionId: string | null) {
  return useQuery({
    queryKey: ['student-triage-data', institutionId],
    queryFn: async (): Promise<StudentRiskData[]> => {
      if (!institutionId) return [];

      // 1. Get students linked to institution
      const { data: students, error: studentsError } = await supabase
        .from('patient_institutions')
        .select('patient_id, pacientes!inner(id, profile_id, profiles!inner(nome, user_id))')
        .eq('institution_id', institutionId)
        .eq('enrollment_status', 'enrolled');

      if (studentsError) throw studentsError;
      if (!students || students.length === 0) return [];

      // 2. Get profile_ids for mood_entries lookup
      const profileIds = students.map((s: any) => s.pacientes.profile_id).filter(Boolean);

      // 3. Get mood entries for last 14 days
      const fourteenDaysAgo = new Date();
      fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
      const dateStr = fourteenDaysAgo.toISOString().split('T')[0];

      const { data: moodEntries } = await supabase
        .from('mood_entries')
        .select('profile_id, mood_score, anxiety_level, energy_level, sleep_quality, sleep_hours, date')
        .in('profile_id', profileIds)
        .gte('date', dateStr)
        .order('date', { ascending: true });

      // 4. Get latest triage records
      const patientIds = students.map((s: any) => s.patient_id);
      const { data: triageRecords } = await supabase
        .from('student_triage' as any)
        .select('*')
        .eq('institution_id', institutionId)
        .in('patient_id', patientIds)
        .order('created_at', { ascending: false });

      // Group mood entries by profile_id
      const moodByProfile = new Map<string, any[]>();
      (moodEntries || []).forEach((e: any) => {
        const arr = moodByProfile.get(e.profile_id) || [];
        arr.push(e);
        moodByProfile.set(e.profile_id, arr);
      });

      // Latest triage per patient
      const triageByPatient = new Map<string, any>();
      (triageRecords || []).forEach((t: any) => {
        if (!triageByPatient.has(t.patient_id)) {
          triageByPatient.set(t.patient_id, t);
        }
      });

      // 5. Calculate risk for each student
      return students.map((s: any) => {
        const profileId = s.pacientes.profile_id;
        const entries = moodByProfile.get(profileId) || [];
        const latestTriage = triageByPatient.get(s.patient_id);

        const avgMood = entries.length > 0
          ? entries.reduce((sum: number, e: any) => sum + (e.mood_score || 0), 0) / entries.length
          : null;
        const anxietyEntries = entries.filter((e: any) => e.anxiety_level != null);
        const avgAnxiety = anxietyEntries.length > 0
          ? anxietyEntries.reduce((sum: number, e: any) => sum + e.anxiety_level, 0) / anxietyEntries.length
          : null;
        const energyEntries = entries.filter((e: any) => e.energy_level != null);
        const avgEnergy = energyEntries.length > 0
          ? energyEntries.reduce((sum: number, e: any) => sum + e.energy_level, 0) / energyEntries.length
          : null;
        const sleepEntries = entries.filter((e: any) => e.sleep_quality != null || e.sleep_hours != null);
        const avgSleep = sleepEntries.length > 0
          ? sleepEntries.reduce((sum: number, e: any) => {
              const val = e.sleep_quality ?? Math.min(5, Math.max(1, Math.round((e.sleep_hours - 3) / 1.5 + 1)));
              return sum + val;
            }, 0) / sleepEntries.length
          : null;

        const moodTrend = calculateTrend(entries.filter((e: any) => e.mood_score != null));

        const moodHistory = entries
          .filter((e: any) => e.mood_score != null)
          .map((e: any) => e.mood_score as number);

        return {
          patientId: s.patient_id,
          studentName: s.pacientes.profiles.nome || 'Sem nome',
          profileId: s.pacientes.profile_id || null,
          userId: s.pacientes.profiles.user_id || null,
          riskLevel: calculateRiskLevel(avgMood, avgAnxiety, avgEnergy, avgSleep, moodTrend),
          avgMood: avgMood !== null ? Math.round(avgMood * 10) / 10 : null,
          avgAnxiety: avgAnxiety !== null ? Math.round(avgAnxiety * 10) / 10 : null,
          avgEnergy: avgEnergy !== null ? Math.round(avgEnergy * 10) / 10 : null,
          avgSleep: avgSleep !== null ? Math.round(avgSleep * 10) / 10 : null,
          moodTrend,
          entryCount: entries.length,
          lastTriageStatus: latestTriage?.status || null,
          lastTriageId: latestTriage?.id || null,
          moodHistory,
        };
      });
    },
    enabled: !!institutionId,
  });
}

export function useTriageRecords(institutionId: string | null) {
  return useQuery({
    queryKey: ['triage-records', institutionId],
    queryFn: async () => {
      if (!institutionId) return [];
      const { data, error } = await supabase
        .from('student_triage' as any)
        .select('*')
        .eq('institution_id', institutionId)
        .order('created_at', { ascending: false });
      if (error) throw error;

      const records = (data || []) as unknown as TriageRecord[];

      // Fetch triaged_by names
      const uniqueUserIds = [...new Set(records.map(r => r.triaged_by).filter(Boolean))];
      if (uniqueUserIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, nome')
          .in('user_id', uniqueUserIds);
        const nameMap = new Map((profiles || []).map((p: any) => [p.user_id, p.nome]));
        records.forEach(r => {
          r.triaged_by_name = nameMap.get(r.triaged_by) || undefined;
        });
      }

      return records;
    },
    enabled: !!institutionId,
  });
}

export function useTriageActions(institutionId: string | null) {
  const queryClient = useQueryClient();

  const createTriage = useMutation({
    mutationFn: async (params: {
      patientId: string;
      studentName?: string;
      riskLevel: string;
      priority: string;
      recommendedAction: string;
      notes: string;
      followUpDate?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !institutionId) throw new Error('Not authenticated');

      const insertData: any = {
        patient_id: params.patientId,
        institution_id: institutionId,
        triaged_by: user.id,
        status: 'triaged',
        risk_level: params.riskLevel,
        priority: params.priority,
        recommended_action: params.recommendedAction,
        notes: params.notes,
      };
      if (params.followUpDate) insertData.follow_up_date = params.followUpDate;

      const { error } = await supabase
        .from('student_triage' as any)
        .insert(insertData as any);
      if (error) throw error;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['student-triage-data', institutionId] });
      queryClient.invalidateQueries({ queryKey: ['triage-records', institutionId] });
      if (institutionId) {
        notifyInstitutionAction('student_triaged', institutionId, {
          student_name: variables.studentName || '',
          risk_level: variables.riskLevel,
          priority: variables.priority,
          recommended_action: variables.recommendedAction,
        });
      }
    },
  });

  const updateTriageStatus = useMutation({
    mutationFn: async (params: { triageId: string; status: string; resolvedAt?: string; studentName?: string }) => {
      const updateData: any = { status: params.status };
      if (params.resolvedAt) updateData.resolved_at = params.resolvedAt;

      const { error } = await supabase
        .from('student_triage' as any)
        .update(updateData)
        .eq('id', params.triageId);
      if (error) throw error;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['student-triage-data', institutionId] });
      queryClient.invalidateQueries({ queryKey: ['triage-records', institutionId] });
      if (institutionId) {
        const actionMap: Record<string, string> = {
          in_progress: 'triage_in_progress',
          resolved: 'triage_resolved',
          triaged: 'triage_reopened',
        };
        const actionType = actionMap[variables.status] || 'triage_in_progress';
        notifyInstitutionAction(actionType, institutionId, {
          student_name: variables.studentName || '',
        });
      }
    },
  });

  const batchCreateTriage = useMutation({
    mutationFn: async (params: {
      entries: Array<{ patientId: string; riskLevel: string; studentName?: string }>;
      priority: string;
      recommendedAction: string;
      notes: string;
      followUpDate?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !institutionId) throw new Error('Not authenticated');

      const inserts = params.entries.map(e => {
        const d: any = {
          patient_id: e.patientId,
          institution_id: institutionId,
          triaged_by: user.id,
          status: 'triaged',
          risk_level: e.riskLevel,
          priority: params.priority,
          recommended_action: params.recommendedAction,
          notes: params.notes,
        };
        if (params.followUpDate) d.follow_up_date = params.followUpDate;
        return d;
      });

      const { error } = await supabase
        .from('student_triage' as any)
        .insert(inserts as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student-triage-data', institutionId] });
      queryClient.invalidateQueries({ queryKey: ['triage-records', institutionId] });
    },
  });

  const addQuickNote = useMutation({
    mutationFn: async (params: { patientId: string; note: string; riskLevel?: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !institutionId) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('student_triage' as any)
        .insert({
          patient_id: params.patientId,
          institution_id: institutionId,
          triaged_by: user.id,
          status: 'triaged',
          risk_level: params.riskLevel || 'attention',
          priority: 'low',
          recommended_action: 'monitor',
          notes: params.note,
        } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student-triage-data', institutionId] });
      queryClient.invalidateQueries({ queryKey: ['triage-records', institutionId] });
    },
  });

  return { createTriage, updateTriageStatus, batchCreateTriage, addQuickNote };
}
