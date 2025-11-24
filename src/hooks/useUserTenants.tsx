import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface UserTenantData {
  tenant_id: string;
  is_primary: boolean;
  tenants: {
    id: string;
    name: string;
    slug: string;
  } | null;
}

export const useUserTenants = (userId: string) => {
  return useQuery({
    queryKey: ['user-tenants', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_tenants')
        .select(`
          tenant_id,
          is_primary,
          tenants:tenant_id (
            id,
            name,
            slug
          )
        `)
        .eq('user_id', userId)
        .order('is_primary', { ascending: false }); // Primário primeiro

      if (error) throw error;
      return (data || []) as UserTenantData[];
    },
    enabled: !!userId,
  });
};

export const useUserPrimaryTenant = (userId: string) => {
  return useQuery({
    queryKey: ['user-primary-tenant', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_tenants')
        .select(`
          tenant_id,
          tenants:tenant_id (
            id,
            name,
            slug
          )
        `)
        .eq('user_id', userId)
        .eq('is_primary', true)
        .single();

      if (error) throw error;
      return data as UserTenantData;
    },
    enabled: !!userId,
  });
};
