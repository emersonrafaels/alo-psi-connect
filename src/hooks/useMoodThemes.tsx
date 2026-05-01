import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface ThemeAggregate {
  theme: string;
  category: string;
  count: number;
  last_seen: string;
  dominant_sentiment: 'positivo' | 'neutro' | 'negativo';
}

const CATEGORY_LABELS: Record<string, { label: string; emoji: string }> = {
  trabalho: { label: 'Trabalho', emoji: '💼' },
  estudos: { label: 'Estudos', emoji: '📚' },
  relacionamento: { label: 'Relacionamentos', emoji: '💞' },
  saude: { label: 'Saúde', emoji: '💪' },
  financeiro: { label: 'Financeiro', emoji: '💰' },
  lazer: { label: 'Lazer', emoji: '🎨' },
  outros: { label: 'Outros', emoji: '🌱' },
};

export function getCategoryMeta(category: string) {
  return CATEGORY_LABELS[category] || CATEGORY_LABELS.outros;
}

export function useMoodThemes(days = 30) {
  const { user } = useAuth();

  return useQuery<ThemeAggregate[]>({
    queryKey: ['mood-themes', user?.id, days],
    enabled: !!user?.id,
    queryFn: async () => {
      const since = new Date();
      since.setDate(since.getDate() - days);
      const { data, error } = await supabase
        .from('mood_detected_themes')
        .select('theme, category, sentiment, created_at')
        .eq('user_id', user!.id)
        .gte('created_at', since.toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      const map = new Map<string, ThemeAggregate>();
      for (const row of data || []) {
        const key = row.theme.toLowerCase();
        const existing = map.get(key);
        if (existing) {
          existing.count += 1;
          if (row.created_at > existing.last_seen) existing.last_seen = row.created_at;
        } else {
          map.set(key, {
            theme: row.theme,
            category: row.category || 'outros',
            count: 1,
            last_seen: row.created_at,
            dominant_sentiment: (row.sentiment as any) || 'neutro',
          });
        }
      }
      return Array.from(map.values()).sort((a, b) => b.count - a.count);
    },
  });
}
