import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface WellbeingMetrics {
  avg_mood_score: number | null;
  avg_anxiety_level: number | null;
  avg_sleep_quality: number | null;
  avg_energy_level: number | null;
  total_entries: number;
  students_with_entries: number;
  students_with_low_mood: number;
  mood_trend: 'up' | 'down' | 'stable';
  period_comparison: {
    current_avg: number;
    previous_avg: number;
    change_percent: number;
  };
}

export const useInstitutionWellbeing = (institutionId: string | undefined, days: number = 30) => {
  return useQuery({
    queryKey: ['institution-wellbeing', institutionId, days],
    queryFn: async (): Promise<WellbeingMetrics | null> => {
      if (!institutionId) return null;

      // Buscar dados agregados dos mood_entries dos alunos da instituição
      // Fazemos isso via query direta com agregações para garantir anonimidade
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const previousStartDate = new Date(startDate);
      previousStartDate.setDate(previousStartDate.getDate() - days);

      // Buscar alunos vinculados à instituição
      const { data: students } = await supabase
        .from('patient_institutions')
        .select('pacientes!inner(profile_id)')
        .eq('institution_id', institutionId);

      if (!students || students.length === 0) {
        return {
          avg_mood_score: null,
          avg_anxiety_level: null,
          avg_sleep_quality: null,
          avg_energy_level: null,
          total_entries: 0,
          students_with_entries: 0,
          students_with_low_mood: 0,
          mood_trend: 'stable',
          period_comparison: {
            current_avg: 0,
            previous_avg: 0,
            change_percent: 0,
          },
        };
      }

      const profileIds = students.map(s => s.pacientes.profile_id);

      // Buscar mood entries agregados do período atual
      const { data: currentPeriodEntries } = await supabase
        .from('mood_entries')
        .select('mood_score, anxiety_level, sleep_quality, energy_level, profile_id')
        .in('profile_id', profileIds)
        .gte('date', startDate.toISOString().split('T')[0])
        .lte('date', endDate.toISOString().split('T')[0]);

      // Buscar mood entries do período anterior para comparação
      const { data: previousPeriodEntries } = await supabase
        .from('mood_entries')
        .select('mood_score')
        .in('profile_id', profileIds)
        .gte('date', previousStartDate.toISOString().split('T')[0])
        .lt('date', startDate.toISOString().split('T')[0]);

      // Calcular métricas agregadas
      const entries = currentPeriodEntries || [];
      const previousEntries = previousPeriodEntries || [];

      const totalEntries = entries.length;
      const uniqueStudents = new Set(entries.map(e => e.profile_id)).size;
      
      const avgMood = entries.length > 0
        ? entries.reduce((sum, e) => sum + (e.mood_score || 0), 0) / entries.filter(e => e.mood_score !== null).length
        : null;
      
      const avgAnxiety = entries.length > 0
        ? entries.reduce((sum, e) => sum + (e.anxiety_level || 0), 0) / entries.filter(e => e.anxiety_level !== null).length
        : null;
      
      const avgSleep = entries.length > 0
        ? entries.reduce((sum, e) => sum + (e.sleep_quality || 0), 0) / entries.filter(e => e.sleep_quality !== null).length
        : null;

      const avgEnergy = entries.length > 0
        ? entries.reduce((sum, e) => sum + (e.energy_level || 0), 0) / entries.filter(e => e.energy_level !== null).length
        : null;

      // Contar alunos com humor baixo (<=3)
      const lowMoodStudents = new Set(
        entries.filter(e => e.mood_score !== null && e.mood_score <= 3).map(e => e.profile_id)
      ).size;

      // Calcular tendência
      const currentAvg = avgMood || 0;
      const previousAvg = previousEntries.length > 0
        ? previousEntries.reduce((sum, e) => sum + (e.mood_score || 0), 0) / previousEntries.filter(e => e.mood_score !== null).length
        : 0;

      let trend: 'up' | 'down' | 'stable' = 'stable';
      const changePercent = previousAvg > 0 ? ((currentAvg - previousAvg) / previousAvg) * 100 : 0;
      
      if (changePercent > 5) trend = 'up';
      else if (changePercent < -5) trend = 'down';

      return {
        avg_mood_score: avgMood ? Number(avgMood.toFixed(1)) : null,
        avg_anxiety_level: avgAnxiety ? Number(avgAnxiety.toFixed(1)) : null,
        avg_sleep_quality: avgSleep ? Number(avgSleep.toFixed(1)) : null,
        avg_energy_level: avgEnergy ? Number(avgEnergy.toFixed(1)) : null,
        total_entries: totalEntries,
        students_with_entries: uniqueStudents,
        students_with_low_mood: lowMoodStudents,
        mood_trend: trend,
        period_comparison: {
          current_avg: Number(currentAvg.toFixed(1)),
          previous_avg: Number(previousAvg.toFixed(1)),
          change_percent: Number(changePercent.toFixed(1)),
        },
      };
    },
    enabled: !!institutionId,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
};
