import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { fetchAllPaged, fetchInChunks } from '@/lib/supabasePaging';

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

export interface ActiveInstitutionNote {
  id: string;
  title: string;
  content: string | null;
  note_type: string;
  start_date: string | null;
  end_date: string | null;
  is_pinned: boolean;
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
  // New fields for data range detection
  hasDataInPeriod: boolean;
  availableDataRange?: {
    oldest: string;
    newest: string;
  };
  totalStudentsLinked: number;
  activeNotes: ActiveInstitutionNote[];
}

export const useInstitutionWellbeing = (institutionId: string | undefined, days: number = 30) => {
  return useQuery({
    queryKey: ['institution-wellbeing', institutionId, days],
    queryFn: async (): Promise<WellbeingMetrics | null> => {
      if (!institutionId) return null;

      const endDate = new Date();
      const startDate = new Date();
      
      // Handle "all time" option (9999 days)
      if (days >= 9999) {
        startDate.setFullYear(2020, 0, 1); // Start from Jan 1, 2020
      } else {
        startDate.setDate(startDate.getDate() - days);
      }

      const previousStartDate = new Date(startDate);
      if (days >= 9999) {
        previousStartDate.setFullYear(2019, 0, 1); // Previous period from 2019
      } else {
        previousStartDate.setDate(previousStartDate.getDate() - days);
      }

      const toDay = (d: Date) => d.toISOString().split('T')[0];
      const startDateStr = toDay(startDate);
      const endDateStr = toDay(endDate);

      // Números agregados calculados no banco + notas, em paralelo
      const [summaryRes, notesRes] = await Promise.all([
        (supabase.rpc as any)('get_institution_wellbeing_summary', {
          p_institution_id: institutionId,
          p_start: startDateStr,
          p_end: endDateStr,
          p_prev_start: toDay(previousStartDate),
        }),
        supabase
          .from('institution_notes')
          .select('id, title, content, note_type, start_date, end_date, is_pinned')
          .eq('institution_id', institutionId)
          .or(`start_date.is.null,start_date.lte.${endDateStr}`)
          .or(`end_date.is.null,end_date.gte.${startDateStr}`),
      ]);
      if (summaryRes.error) throw summaryRes.error;
      const s: any = summaryRes.data || {};

      const totalStudentsLinked = Number(s.total_students || 0);
      const students = { length: totalStudentsLinked };

      if (totalStudentsLinked === 0) {
        return {
          avg_mood_score: null,
          avg_anxiety_level: null,
          avg_sleep_quality: null,
          avg_energy_level: null,
          total_entries: 0,
          students_with_entries: 0,
          students_with_low_mood: 0,
          mood_trend: 'stable',
          period_comparison: { current_avg: 0, previous_avg: 0, change_percent: 0 },
          daily_entries: [],
          insights: [],
          hasDataInPeriod: false,
          totalStudentsLinked: 0,
          activeNotes: [],
        };
      }

      const activeNotes: ActiveInstitutionNote[] = (notesRes.data || []).filter((n: any) => {
        if (!n.start_date && !n.end_date) return true;
        if (n.start_date && n.end_date) return n.start_date <= endDateStr && n.end_date >= startDateStr;
        if (n.start_date) return n.start_date <= endDateStr;
        if (n.end_date) return n.end_date >= startDateStr;
        return true;
      });

      const num = (v: any) => (v === null || v === undefined ? null : Number(v));
      const totalEntries = Number(s.total_entries || 0);
      const uniqueStudents = Number(s.students_with_entries || 0);
      const lowMoodStudents = Number(s.low_mood_students || 0);
      const avgMood = num(s.avg_mood);
      const avgAnxiety = num(s.avg_anxiety);
      const avgSleep = num(s.avg_sleep);
      const avgEnergy = num(s.avg_energy);

      let availableDataRange: { oldest: string; newest: string } | undefined;
      if (totalEntries === 0 && s.oldest && s.newest) {
        availableDataRange = { oldest: s.oldest, newest: s.newest };
      }

      const currentAvg = avgMood || 0;
      const previousAvg = num(s.prev_avg_mood) || 0;

      let trend: 'up' | 'down' | 'stable' = 'stable';
      const changePercent = previousAvg > 0 ? ((currentAvg - previousAvg) / previousAvg) * 100 : 0;
      if (changePercent > 5) trend = 'up';
      else if (changePercent < -5) trend = 'down';

      const dailyEntries: DailyEntry[] = ((s.daily || []) as any[])
        .filter((d) => typeof d.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d.date))
        .map((d) => ({
          date: d.date,
          avg_mood: num(d.avg_mood),
          avg_anxiety: num(d.avg_anxiety),
          avg_sleep: num(d.avg_sleep),
          avg_energy: num(d.avg_energy),
          entries_count: Number(d.entries_count || 0),
        }))
        .sort((a, b) => a.date.localeCompare(b.date));

      // Gerar insights inteligentes
      const insights: WellbeingInsight[] = [];

      // INSIGHT SEMPRE PRESENTE: Resumo geral de bem-estar
      if (totalEntries > 0 && avgMood !== null) {
        const moodStatus = avgMood >= 4 ? 'excelente' : avgMood >= 3.5 ? 'bom' : avgMood >= 2.5 ? 'moderado' : 'baixo';
        const moodType = avgMood >= 3.5 ? 'positive' : avgMood >= 2.5 ? 'info' : 'warning';
        const engagement = students.length > 0 ? Math.round((uniqueStudents / students.length) * 100) : 0;
        insights.push({
          type: moodType,
          icon: avgMood >= 4 ? '😊' : avgMood >= 3.5 ? '🙂' : avgMood >= 2.5 ? '😐' : '😟',
          title: `Humor coletivo ${moodStatus}`,
          description: `Média ${avgMood.toFixed(1)}/5 com ${engagement}% da turma engajada (${uniqueStudents} de ${students.length} alunos, ${totalEntries} check-ins).`,
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
          title: 'Ansiedade acima do saudável',
          description: `Média de ${avgAnxiety.toFixed(1)}/5 no período. Sugestão: prática guiada de respiração e revisão da carga acadêmica da semana.`,
        });
      } else if (avgAnxiety !== null && avgAnxiety <= 2.0) {
        insights.push({
          type: 'positive',
          icon: '🧘',
          title: 'Ansiedade controlada',
          description: `Média baixa (${avgAnxiety.toFixed(1)}/5) — bom equilíbrio emocional coletivo.`,
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

      // Insight: Alunos com humor baixo
      if (lowMoodStudents > 0 && uniqueStudents > 0) {
        const percentage = (lowMoodStudents / uniqueStudents) * 100;
        if (percentage > 20) {
          insights.push({
            type: 'warning',
            icon: '🚨',
            title: 'Grupo com humor abaixo do saudável',
            description: `${lowMoodStudents} de ${uniqueStudents} alunos engajados (${percentage.toFixed(0)}%) mantiveram humor abaixo de 3. Priorize a aba de Triagem para avaliar cada caso.`,
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
            const d = new Date(bestDay.date + 'T12:00:00');
            const weekday = d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '');
            const dayMonth = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
            const label = `${weekday.charAt(0).toUpperCase() + weekday.slice(1)}, ${dayMonth}`;
            insights.push({
              type: 'info',
              icon: '⭐',
              title: 'Melhor dia do período',
              description: `${label} teve a melhor média de humor no período: ${bestDay.avg_mood.toFixed(1)}/5.`,
            });
          }
        }
      }

      // Insights contextuais baseados nas notas ativas
      const noteTypeLabels: Record<string, string> = { event: 'Evento', alert: 'Alerta', reminder: 'Lembrete', info: 'Informação' };
      const noteTypeIcons: Record<string, string> = { event: '📅', alert: '🚨', reminder: '🔔', info: 'ℹ️' };

      activeNotes.forEach(note => {
        const label = noteTypeLabels[note.note_type] || 'Nota';
        const icon = noteTypeIcons[note.note_type] || '📌';
        const dateRange = note.start_date && note.end_date
          ? ` (${new Date(note.start_date + 'T12:00:00').toLocaleDateString('pt-BR')} - ${new Date(note.end_date + 'T12:00:00').toLocaleDateString('pt-BR')})`
          : '';
        
        insights.push({
          type: note.note_type === 'alert' ? 'warning' : 'info',
          icon,
          title: `${label}: ${note.title}`,
          description: `${note.content || note.title}${dateRange} — Considere este contexto ao analisar os indicadores.`,
        });
      });

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
        hasDataInPeriod: totalEntries > 0,
        availableDataRange,
        totalStudentsLinked,
        activeNotes,
      };
    },
    enabled: !!institutionId,
    staleTime: 5 * 60 * 1000,
  });
};
