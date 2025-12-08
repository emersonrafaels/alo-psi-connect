import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface AdminInstitution {
  id: string;
  institution_id: string;
  institution_name: string;
  institution_type: string;
  has_partnership: boolean;
  role: string;
  is_active: boolean;
  created_at: string;
}

export function useAdminInstitutions() {
  const { user } = useAuth();

  const { data: institutions = [], isLoading } = useQuery({
    queryKey: ['admin-institutions', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('institution_users')
        .select(`
          id,
          institution_id,
          role,
          is_active,
          created_at,
          educational_institutions (
            id,
            name,
            type,
            has_partnership
          )
        `)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error fetching admin institutions:', error);
        return [];
      }

      return (data || []).map((link: any) => ({
        id: link.id,
        institution_id: link.institution_id,
        institution_name: link.educational_institutions?.name || 'Instituição',
        institution_type: link.educational_institutions?.type || 'other',
        has_partnership: link.educational_institutions?.has_partnership || false,
        role: link.role,
        is_active: link.is_active,
        created_at: link.created_at,
      })) as AdminInstitution[];
    },
    enabled: !!user?.id,
  });

  return {
    institutions,
    isLoading,
  };
}
