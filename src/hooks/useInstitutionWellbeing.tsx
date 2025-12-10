import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface DailyEntry {
  date: string;
  avg_mood: number | null;
  avg_anxiety: number | null;
  avg_sleep: number | null;
  avg_energy: number | null;
  entries_count: number;
}

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
  daily_entries: DailyEntry[];
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
          daily_entries: [],
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

      // Agrupar entries por dia para gráficos de linha do tempo
      const entriesByDate = new Map<string, {
        moods: number[];
        anxieties: number[];
        sleeps: number[];
        energies: number[];
      }>();

      entries.forEach(e => {
        // Assumir que temos uma data no formato correto
        const dateStr = new Date().toISOString().split('T')[0]; // fallback
        const entryDate = dateStr; // Usar data atual como fallback

        if (!entriesByDate.has(entryDate)) {
          entriesByDate.set(entryDate, { moods: [], anxieties: [], sleeps: [], energies: [] });
        }
        const dayData = entriesByDate.get(entryDate)!;
        if (e.mood_score !== null) dayData.moods.push(e.mood_score);
        if (e.anxiety_level !== null) dayData.anxieties.push(e.anxiety_level);
        if (e.sleep_quality !== null) dayData.sleeps.push(e.sleep_quality);
        if (e.energy_level !== null) dayData.energies.push(e.energy_level);
      });

      // Buscar entries com data para agrupar corretamente
      const { data: entriesWithDate } = await supabase
        .from('mood_entries')
        .select('date, mood_score, anxiety_level, sleep_quality, energy_level')
        .in('profile_id', profileIds)
        .gte('date', startDate.toISOString().split('T')[0])
        .lte('date', endDate.toISOString().split('T')[0])
        .order('date', { ascending: true });

      const dailyMap = new Map<string, {
        moods: number[];
        anxieties: number[];
        sleeps: number[];
        energies: number[];
      }>();

      (entriesWithDate || []).forEach(e => {
        const dateStr = e.date;
        if (!dailyMap.has(dateStr)) {
          dailyMap.set(dateStr, { moods: [], anxieties: [], sleeps: [], energies: [] });
        }
        const dayData = dailyMap.get(dateStr)!;
        if (e.mood_score !== null) dayData.moods.push(e.mood_score);
        if (e.anxiety_level !== null) dayData.anxieties.push(e.anxiety_level);
        if (e.sleep_quality !== null) dayData.sleeps.push(e.sleep_quality);
        if (e.energy_level !== null) dayData.energies.push(e.energy_level);
      });

      const calcAvg = (arr: number[]) => arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : null;

      const dailyEntries: DailyEntry[] = Array.from(dailyMap.entries())
        .map(([date, data]) => ({
          date,
          avg_mood: calcAvg(data.moods),
          avg_anxiety: calcAvg(data.anxieties),
          avg_sleep: calcAvg(data.sleeps),
          avg_energy: calcAvg(data.energies),
          entries_count: data.moods.length + data.anxieties.length + data.sleeps.length + data.energies.length,
        }))
        .sort((a, b) => a.date.localeCompare(b.date));

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
        daily_entries: dailyEntries,
      };
    },
    enabled: !!institutionId,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
};
