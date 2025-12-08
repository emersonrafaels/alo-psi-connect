import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface ProfessionalInstitutionLink {
  id: string;
  institution_id: string;
  institution_name: string;
  institution_type: string;
  has_partnership: boolean;
  relationship_type: string;
  start_date: string | null;
  end_date: string | null;
  is_active: boolean;
  notes: string | null;
}

export const useCurrentProfessionalInstitutions = () => {
  const { user } = useAuth();

  const { data: linkedInstitutions, isLoading } = useQuery({
    queryKey: ['current-professional-institutions', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      // First get the profile.id for this user (user.id is auth.uid(), but profissionais.profile_id stores profiles.id)
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (profileError) {
        console.error('[useCurrentProfessionalInstitutions] Error fetching profile:', profileError);
        throw profileError;
      }

      if (!profile) {
        console.log('[useCurrentProfessionalInstitutions] No profile found for user');
        return [];
      }

      // Now get the professional_id using the correct profile.id
      const { data: professional, error: profError } = await supabase
        .from('profissionais')
        .select('id')
        .eq('profile_id', profile.id)
        .maybeSingle();

      if (profError) {
        console.error('[useCurrentProfessionalInstitutions] Error fetching professional:', profError);
        throw profError;
      }

      if (!professional) {
        console.log('[useCurrentProfessionalInstitutions] No professional found for user');
        return [];
      }

      // Fetch institution links
      const { data, error } = await supabase
        .from('professional_institutions')
        .select(`
          id,
          institution_id,
          relationship_type,
          start_date,
          end_date,
          is_active,
          notes,
          educational_institutions!inner(
            id,
            name,
            type,
            has_partnership
          )
        `)
        .eq('professional_id', professional.id);

      if (error) {
        console.error('[useCurrentProfessionalInstitutions] Error fetching institutions:', error);
        throw error;
      }

      // Transform data to flat structure
      return (data || []).map((item: any) => ({
        id: item.id,
        institution_id: item.institution_id,
        institution_name: item.educational_institutions.name,
        institution_type: item.educational_institutions.type,
        has_partnership: item.educational_institutions.has_partnership,
        relationship_type: item.relationship_type,
        start_date: item.start_date,
        end_date: item.end_date,
        is_active: item.is_active,
        notes: item.notes,
      })) as ProfessionalInstitutionLink[];
    },
    enabled: !!user?.id,
  });

  return {
    linkedInstitutions: linkedInstitutions || [],
    isLoading,
  };
};
