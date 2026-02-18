import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface MoodEntry {
  id: string;
  date: string;
  mood_score: number | null;
  anxiety_level: number | null;
  energy_level: number | null;
  sleep_quality: number | null;
  sleep_hours: number | null;
  tags: string[] | null;
  journal_text: string | null;
  emotion_values: Record<string, number> | null;
}

export interface TopEmotion {
  emotion: string;
  count: number;
}

export interface StudentTriageHistory {
  id: string;
  status: string;
  risk_level: string;
  priority: string;
  recommended_action: string | null;
  notes: string | null;
  follow_up_date: string | null;
  created_at: string;
  resolved_at: string | null;
  triaged_by_name?: string;
}

export interface StudentActivityData {
  moodEntries: MoodEntry[];
  topEmotions: TopEmotion[];
  triageHistory: StudentTriageHistory[];
}

export function useStudentActivityData(
  profileId: string | null,
  patientId: string | null,
  institutionId: string | null,
  enabled: boolean
) {
  return useQuery({
    queryKey: ['student-activity', profileId, patientId, institutionId],
    queryFn: async (): Promise<StudentActivityData> => {
      // Resolve profileId: fallback to pacientes.profile_id if not provided
      let resolvedProfileId = profileId;
      if (!resolvedProfileId && patientId) {
        const { data: patient } = await supabase
          .from('pacientes')
          .select('profile_id')
          .eq('id', patientId)
          .single();
        resolvedProfileId = patient?.profile_id || null;
        console.log('[useStudentActivityData] Resolved profileId from patientId:', { patientId, resolvedProfileId });
      }

      // Fetch mood entries (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const dateStr = thirtyDaysAgo.toISOString().split('T')[0];

      const [moodResult, triageResult] = await Promise.all([
        resolvedProfileId
          ? supabase
              .from('mood_entries')
              .select('id, date, mood_score, anxiety_level, energy_level, sleep_quality, sleep_hours, tags, journal_text, emotion_values')
              .eq('profile_id', resolvedProfileId)
              .gte('date', dateStr)
              .order('date', { ascending: false })
          : Promise.resolve({ data: [], error: null }),
        patientId && institutionId
          ? supabase
              .from('student_triage' as any)
              .select('*')
              .eq('patient_id', patientId)
              .eq('institution_id', institutionId)
              .order('created_at', { ascending: false })
          : Promise.resolve({ data: [], error: null }),
      ]);

      if (moodResult.error) console.error('[useStudentActivityData] mood_entries error:', moodResult.error);
      if (triageResult.error) console.error('[useStudentActivityData] student_triage error:', triageResult.error);

      const moodEntries: MoodEntry[] = (moodResult.data || []).map((e: any) => ({
        id: e.id,
        date: e.date,
        mood_score: e.mood_score,
        anxiety_level: e.anxiety_level,
        energy_level: e.energy_level,
        sleep_quality: e.sleep_quality,
        sleep_hours: e.sleep_hours,
        tags: e.tags,
        journal_text: e.journal_text,
        emotion_values: e.emotion_values as Record<string, number> | null,
      }));

      // Calculate top emotions from aggregated emotion_values
      const emotionCounts = new Map<string, number>();
      moodEntries.forEach(entry => {
        if (entry.emotion_values && typeof entry.emotion_values === 'object') {
          Object.entries(entry.emotion_values).forEach(([emotion, value]) => {
            if (typeof value === 'number' && value > 0) {
              emotionCounts.set(emotion, (emotionCounts.get(emotion) || 0) + value);
            }
          });
        }
      });
      const topEmotions: TopEmotion[] = Array.from(emotionCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([emotion, count]) => ({ emotion, count }));

      // Process triage history
      const triageData = (triageResult.data || []) as any[];
      const uniqueUserIds = [...new Set(triageData.map(t => t.triaged_by).filter(Boolean))];
      let nameMap = new Map<string, string>();
      if (uniqueUserIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, nome')
          .in('user_id', uniqueUserIds);
        nameMap = new Map((profiles || []).map((p: any) => [p.user_id, p.nome]));
      }

      const triageHistory: StudentTriageHistory[] = triageData.map(t => ({
        id: t.id,
        status: t.status,
        risk_level: t.risk_level,
        priority: t.priority,
        recommended_action: t.recommended_action,
        notes: t.notes,
        follow_up_date: t.follow_up_date,
        created_at: t.created_at,
        resolved_at: t.resolved_at,
        triaged_by_name: nameMap.get(t.triaged_by) || undefined,
      }));

      return { moodEntries, topEmotions, triageHistory };
    },
    enabled: enabled && !!(profileId || patientId),
  });
}
