import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useInstitutionUsers = (tenantId: string | null = null) => {
  return useQuery({
    queryKey: ['institution-users-by-tenant', tenantId],
    queryFn: async () => {
      let query = supabase
        .from('institution_users')
        .select('*');
      
      if (tenantId) {
        query = query.eq('tenant_id', tenantId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });
};
