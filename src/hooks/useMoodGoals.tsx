import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface MoodGoal {
  id: string;
  user_id: string;
  goal_type: string;
  target_value: number;
  period: string;
  is_active: boolean;
}

export function useMoodGoals() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const goalsQuery = useQuery<MoodGoal[]>({
    queryKey: ['mood-goals', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mood_user_goals')
        .select('*')
        .eq('user_id', user!.id)
        .eq('is_active', true);
      if (error) throw error;
      return (data || []) as MoodGoal[];
    },
  });

  const upsertGoal = useMutation({
    mutationFn: async (goal: Partial<MoodGoal> & { goal_type: string; target_value: number }) => {
      if (!user?.id) throw new Error('Usuário não autenticado');
      const payload = {
        user_id: user.id,
        goal_type: goal.goal_type,
        target_value: goal.target_value,
        period: goal.period || 'week',
        is_active: true,
      };
      const { data, error } = await supabase
        .from('mood_user_goals')
        .upsert(payload, { onConflict: 'id' })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['mood-goals', user?.id] });
      toast.success('Meta atualizada');
    },
  });

  return { ...goalsQuery, upsertGoal };
}

export function calculateGoalProgress(entries: { date: string }[], goal: MoodGoal): {
  current: number;
  target: number;
  percentage: number;
} {
  const now = new Date();
  const start = new Date();
  if (goal.period === 'week') {
    const day = now.getDay();
    start.setDate(now.getDate() - day);
  } else if (goal.period === 'month') {
    start.setDate(1);
  }
  start.setHours(0, 0, 0, 0);

  const count = entries.filter((e) => new Date(e.date) >= start).length;
  return {
    current: count,
    target: goal.target_value,
    percentage: Math.min(100, Math.round((count / goal.target_value) * 100)),
  };
}
