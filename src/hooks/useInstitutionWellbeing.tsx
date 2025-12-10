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

interface WellbeingInsight {
  type: 'positive' | 'warning' | 'info';
  icon: string;
  title: string;
  description: string;
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
  insights: WellbeingInsight[];
}

export const useInstitutionWellbeing = (institutionId: string | undefined, days: number = 30) => {
  return useQuery({
    queryKey: ['institution-wellbeing', institutionId, days],
    queryFn: async (): Promise<WellbeingMetrics | null> => {
      if (!institutionId) return null;

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
          insights: [],
        };
      }

      const profileIds = students.map(s => s.pacientes.profile_id);

      // Buscar mood entries com data do período atual
      const { data: entriesWithDate } = await supabase
        .from('mood_entries')
        .select('date, mood_score, anxiety_level, sleep_quality, energy_level, profile_id')
        .in('profile_id', profileIds)
        .gte('date', startDate.toISOString().split('T')[0])
        .lte('date', endDate.toISOString().split('T')[0])
        .order('date', { ascending: true });

      // Buscar mood entries do período anterior para comparação
      const { data: previousPeriodEntries } = await supabase
        .from('mood_entries')
        .select('mood_score')
        .in('profile_id', profileIds)
        .gte('date', previousStartDate.toISOString().split('T')[0])
        .lt('date', startDate.toISOString().split('T')[0]);

      const entries = entriesWithDate || [];
      const previousEntries = previousPeriodEntries || [];

      const totalEntries = entries.length;
      const uniqueStudents = new Set(entries.map(e => e.profile_id)).size;
      
      // Calcular médias com tratamento de nulls
      const moodEntries = entries.filter(e => e.mood_score !== null);
      const anxietyEntries = entries.filter(e => e.anxiety_level !== null);
      const sleepEntries = entries.filter(e => e.sleep_quality !== null);
      const energyEntries = entries.filter(e => e.energy_level !== null);

      const avgMood = moodEntries.length > 0
        ? moodEntries.reduce((sum, e) => sum + (e.mood_score || 0), 0) / moodEntries.length
        : null;
      
      const avgAnxiety = anxietyEntries.length > 0
        ? anxietyEntries.reduce((sum, e) => sum + (e.anxiety_level || 0), 0) / anxietyEntries.length
        : null;
      
      const avgSleep = sleepEntries.length > 0
        ? sleepEntries.reduce((sum, e) => sum + (e.sleep_quality || 0), 0) / sleepEntries.length
        : null;

      const avgEnergy = energyEntries.length > 0
        ? energyEntries.reduce((sum, e) => sum + (e.energy_level || 0), 0) / energyEntries.length
        : null;

      // Contar alunos com humor baixo (<=3)
      const lowMoodStudents = new Set(
        entries.filter(e => e.mood_score !== null && e.mood_score <= 3).map(e => e.profile_id)
      ).size;

      // Calcular tendência
      const currentAvg = avgMood || 0;
      const prevMoodEntries = previousEntries.filter(e => e.mood_score !== null);
      const previousAvg = prevMoodEntries.length > 0
        ? prevMoodEntries.reduce((sum, e) => sum + (e.mood_score || 0), 0) / prevMoodEntries.length
        : 0;

      let trend: 'up' | 'down' | 'stable' = 'stable';
      const changePercent = previousAvg > 0 ? ((currentAvg - previousAvg) / previousAvg) * 100 : 0;
      
      if (changePercent > 5) trend = 'up';
      else if (changePercent < -5) trend = 'down';

      // Agrupar entries por dia para gráficos
      const dailyMap = new Map<string, {
        moods: number[];
        anxieties: number[];
        sleeps: number[];
        energies: number[];
      }>();

      entries.forEach(e => {
        // Validar que a data existe e é válida
        if (!e.date || typeof e.date !== 'string') return;
        
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
        .filter(([date]) => {
          // Validar formato de data YYYY-MM-DD
          return /^\d{4}-\d{2}-\d{2}$/.test(date);
        })
        .map(([date, data]) => ({
          date,
          avg_mood: calcAvg(data.moods),
          avg_anxiety: calcAvg(data.anxieties),
          avg_sleep: calcAvg(data.sleeps),
          avg_energy: calcAvg(data.energies),
          entries_count: Math.max(data.moods.length, data.anxieties.length, data.sleeps.length, data.energies.length),
        }))
        .sort((a, b) => a.date.localeCompare(b.date));

      // Gerar insights inteligentes
      const insights: WellbeingInsight[] = [];

      // INSIGHT SEMPRE PRESENTE: Resumo geral de bem-estar
      if (totalEntries > 0 && avgMood !== null) {
        const moodStatus = avgMood >= 4 ? 'excelente' : avgMood >= 3.5 ? 'bom' : avgMood >= 2.5 ? 'moderado' : 'baixo';
        const moodType = avgMood >= 3.5 ? 'positive' : avgMood >= 2.5 ? 'info' : 'warning';
        insights.push({
          type: moodType,
          icon: avgMood >= 4 ? '😊' : avgMood >= 3.5 ? '🙂' : avgMood >= 2.5 ? '😐' : '😟',
          title: `Bem-estar ${moodStatus}`,
          description: `Média de humor: ${avgMood.toFixed(1)}/5 com ${totalEntries} registros de ${uniqueStudents} aluno${uniqueStudents > 1 ? 's' : ''}.`,
        });
      }

      // Insight: Tendência de humor (limiar reduzido de 10% para 5%)
      if (changePercent > 5 && previousAvg > 0) {
        insights.push({
          type: 'positive',
          icon: '📈',
          title: 'Humor em alta',
          description: `O humor médio dos alunos melhorou ${Math.abs(changePercent).toFixed(0)}% em relação ao período anterior.`,
        });
      } else if (changePercent < -5 && previousAvg > 0) {
        insights.push({
          type: 'warning',
          icon: '📉',
          title: 'Queda no humor',
          description: `O humor médio dos alunos caiu ${Math.abs(changePercent).toFixed(0)}% em relação ao período anterior.`,
        });
      }

      // Insight: Ansiedade (limiar reduzido de 3.5 para 3.0)
      if (avgAnxiety !== null && avgAnxiety > 3.0) {
        insights.push({
          type: 'warning',
          icon: '⚠️',
          title: 'Ansiedade elevada',
          description: `A média de ansiedade está em ${avgAnxiety.toFixed(1)}/5. Considere ações preventivas.`,
        });
      } else if (avgAnxiety !== null && avgAnxiety <= 2.0) {
        insights.push({
          type: 'positive',
          icon: '🧘',
          title: 'Ansiedade controlada',
          description: `A média de ansiedade está baixa (${avgAnxiety.toFixed(1)}/5), indicando bom equilíbrio emocional.`,
        });
      }

      // Insight: Sono x Energia correlação
      if (avgSleep !== null && avgEnergy !== null) {
        const sleepEnergyDiff = Math.abs(avgSleep - avgEnergy);
        if (sleepEnergyDiff < 0.5) {
          insights.push({
            type: 'info',
            icon: '🔗',
            title: 'Correlação sono-energia',
            description: 'Qualidade de sono e energia estão alinhadas, indicando bom descanso.',
          });
        } else if (avgSleep > avgEnergy + 1) {
          insights.push({
            type: 'info',
            icon: '💤',
            title: 'Energia abaixo do sono',
            description: 'Apesar de boa qualidade de sono, os níveis de energia estão baixos.',
          });
        }
      }

      // Insight: Alunos com humor baixo (limiar reduzido de 30% para 20%)
      if (lowMoodStudents > 0 && uniqueStudents > 0) {
        const percentage = (lowMoodStudents / uniqueStudents) * 100;
        if (percentage > 20) {
          insights.push({
            type: 'warning',
            icon: '🚨',
            title: 'Atenção requerida',
            description: `${lowMoodStudents} aluno${lowMoodStudents > 1 ? 's' : ''} (${percentage.toFixed(0)}%) apresentou humor baixo no período.`,
          });
        }
      }

      // Insight: Participação (limiares ajustados: 50% para positivo, 50% para info)
      const participationRate = students.length > 0 ? (uniqueStudents / students.length) * 100 : 0;
      if (participationRate >= 50) {
        insights.push({
          type: 'positive',
          icon: '🎯',
          title: 'Boa participação',
          description: `${participationRate.toFixed(0)}% dos alunos registraram seu bem-estar no período.`,
        });
      } else if (participationRate > 0 && participationRate < 50) {
        insights.push({
          type: 'info',
          icon: '📊',
          title: 'Participação moderada',
          description: `${participationRate.toFixed(0)}% dos alunos registraram seu bem-estar. Considere incentivar o uso.`,
        });
      }

      // Insight: Melhor dia (mínimo reduzido de 7 para 3 dias)
      if (dailyEntries.length >= 3) {
        const daysWithMood = dailyEntries.filter(d => d.avg_mood !== null);
        if (daysWithMood.length >= 2) {
          const bestDay = daysWithMood.sort((a, b) => (b.avg_mood || 0) - (a.avg_mood || 0))[0];
          
          if (bestDay && bestDay.avg_mood !== null) {
            const dayName = new Date(bestDay.date + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long' });
            insights.push({
              type: 'info',
              icon: '⭐',
              title: 'Melhor dia',
              description: `${dayName.charAt(0).toUpperCase() + dayName.slice(1)} teve a melhor média de humor: ${bestDay.avg_mood.toFixed(1)}/5.`,
            });
          }
        }
      }

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
        insights,
      };
    },
    enabled: !!institutionId,
    staleTime: 5 * 60 * 1000,
  });
};
