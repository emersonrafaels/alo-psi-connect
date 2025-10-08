import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useAnalyticsLastUpdate = () => {
  return useQuery({
    queryKey: ['analyticsLastUpdate'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_analytics_daily')
        .select('created_at')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
  });
};
