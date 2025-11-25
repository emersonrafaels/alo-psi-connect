import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, startOfMonth, addMonths } from 'date-fns';
import { useTenant } from './useTenant';

export const useNextAvailableMonth = () => {
  const { tenant } = useTenant();

  return useQuery({
    queryKey: ['next-available-month', tenant?.id],
    queryFn: async () => {
      if (!tenant?.id) return null;

      const today = new Date();
      const currentMonth = format(today, 'yyyy-MM');

      // Check if current month has sessions
      const { data: currentMonthSessions } = await supabase
        .from('group_sessions')
        .select('id')
        .eq('tenant_id', tenant.id)
        .eq('status', 'scheduled')
        .gte('session_date', format(startOfMonth(today), 'yyyy-MM-dd'))
        .lt('session_date', format(startOfMonth(addMonths(today, 1)), 'yyyy-MM-dd'))
        .limit(1);

      if (currentMonthSessions && currentMonthSessions.length > 0) {
        return {
          month: today,
          isCurrentMonth: true,
          nextSessionDate: null,
        };
      }

      // Find next month with sessions (check up to 12 months ahead)
      for (let i = 1; i <= 12; i++) {
        const checkMonth = addMonths(today, i);
        const monthStart = format(startOfMonth(checkMonth), 'yyyy-MM-dd');
        const monthEnd = format(startOfMonth(addMonths(checkMonth, 1)), 'yyyy-MM-dd');

        const { data: futureSessions } = await supabase
          .from('group_sessions')
          .select('session_date')
          .eq('tenant_id', tenant.id)
          .eq('status', 'scheduled')
          .gte('session_date', monthStart)
          .lt('session_date', monthEnd)
          .order('session_date', { ascending: true })
          .limit(1);

        if (futureSessions && futureSessions.length > 0) {
          return {
            month: checkMonth,
            isCurrentMonth: false,
            nextSessionDate: futureSessions[0].session_date,
          };
        }
      }

      return {
        month: today,
        isCurrentMonth: true,
        nextSessionDate: null,
      };
    },
    enabled: !!tenant?.id,
  });
};
