import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface UserInstitutionLink {
  id: string;
  institutionId: string;
  institutionName: string;
  institutionType: 'public' | 'private';
  linkType: 'admin' | 'patient' | 'professional';
  // Campos específicos por tipo
  role?: 'admin' | 'viewer';
  relationshipType?: 'employee' | 'consultant' | 'supervisor' | 'intern';
  enrollmentDate?: string;
  enrollmentStatus?: 'enrolled' | 'graduated' | 'inactive';
  isActive: boolean;
  createdAt: string;
}

interface UseUserInstitutionLinksProps {
  userId: string;
  profileId: string;
  userType: string;
  enabled?: boolean;
}

export const useUserInstitutionLinks = ({ 
  userId, 
  profileId, 
  userType,
  enabled = true 
}: UseUserInstitutionLinksProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: links = [], isLoading, error, refetch } = useQuery({
    queryKey: ['user-institution-links', userId, profileId, userType],
    queryFn: async () => {
      const allLinks: UserInstitutionLink[] = [];

      // 1. Buscar vínculos como admin institucional (institution_users)
      const { data: adminLinks } = await supabase
        .from('institution_users')
        .select(`
          id,
          institution_id,
          role,
          is_active,
          created_at,
          educational_institutions!inner(
            name,
            type
          )
        `)
        .eq('user_id', userId);

      if (adminLinks) {
        adminLinks.forEach((link: any) => {
          allLinks.push({
            id: link.id,
            institutionId: link.institution_id,
            institutionName: link.educational_institutions.name,
            institutionType: link.educational_institutions.type,
            linkType: 'admin',
            role: link.role,
            isActive: link.is_active,
            createdAt: link.created_at,
          });
        });
      }

      // 2. Se for paciente, buscar vínculos de paciente (patient_institutions)
      if (userType === 'paciente') {
        // Primeiro buscar o patient_id via profile_id
        const { data: patientData } = await supabase
          .from('pacientes')
          .select('id')
          .eq('profile_id', profileId)
          .single();

        if (patientData) {
          const { data: patientLinks } = await supabase
            .from('patient_institutions')
            .select(`
              id,
              institution_id,
              enrollment_status,
              enrollment_date,
              created_at,
              educational_institutions!inner(
                name,
                type
              )
            `)
            .eq('patient_id', patientData.id);

          if (patientLinks) {
            patientLinks.forEach((link: any) => {
              allLinks.push({
                id: link.id,
                institutionId: link.institution_id,
                institutionName: link.educational_institutions.name,
                institutionType: link.educational_institutions.type,
                linkType: 'patient',
                enrollmentStatus: link.enrollment_status,
                enrollmentDate: link.enrollment_date,
                isActive: link.enrollment_status === 'enrolled',
                createdAt: link.created_at,
              });
            });
          }
        }
      }

      // 3. Se for profissional, buscar vínculos de profissional (professional_institutions)
      if (userType === 'profissional') {
        // Primeiro buscar o professional_id via profile_id
        const { data: professionalData } = await supabase
          .from('profissionais')
          .select('id')
          .eq('profile_id', profileId)
          .single();

        if (professionalData) {
          const { data: professionalLinks } = await supabase
            .from('professional_institutions')
            .select(`
              id,
              institution_id,
              relationship_type,
              is_active,
              created_at,
              educational_institutions!inner(
                name,
                type
              )
            `)
            .eq('professional_id', professionalData.id);

          if (professionalLinks) {
            professionalLinks.forEach((link: any) => {
              allLinks.push({
                id: link.id,
                institutionId: link.institution_id,
                institutionName: link.educational_institutions.name,
                institutionType: link.educational_institutions.type,
                linkType: 'professional',
                relationshipType: link.relationship_type,
                isActive: link.is_active,
                createdAt: link.created_at,
              });
            });
          }
        }
      }

      return allLinks.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    },
    enabled: enabled && !!userId && !!profileId && !!userType,
  });

  // Mutation para adicionar vínculo
  const addLinkMutation = useMutation({
    mutationFn: async (data: {
      institutionId: string;
      linkType: 'admin' | 'patient' | 'professional';
      role?: 'admin' | 'viewer';
      relationshipType?: 'employee' | 'consultant' | 'supervisor' | 'intern';
      enrollmentDate?: string;
      enrollmentStatus?: 'enrolled' | 'graduated' | 'inactive';
    }) => {
      // Validar duplicata
      const existingLink = links.find(
        link => link.institutionId === data.institutionId && link.linkType === data.linkType
      );
      if (existingLink) {
        throw new Error('Este vínculo já existe para este usuário');
      }

      if (data.linkType === 'admin') {
        const { error } = await supabase
          .from('institution_users')
          .insert({
            user_id: userId,
            institution_id: data.institutionId,
            role: data.role || 'viewer',
            is_active: true,
          });
        if (error) throw error;
      } else if (data.linkType === 'patient') {
        // Buscar patient_id
        const { data: patientData, error: patientError } = await supabase
          .from('pacientes')
          .select('id')
          .eq('profile_id', profileId)
          .single();
        
        if (patientError) throw new Error('Perfil de paciente não encontrado');

        const { error } = await supabase
          .from('patient_institutions')
          .insert({
            patient_id: patientData.id,
            institution_id: data.institutionId,
            enrollment_status: data.enrollmentStatus || 'enrolled',
            enrollment_date: data.enrollmentDate,
          });
        if (error) throw error;
      } else if (data.linkType === 'professional') {
        // Buscar professional_id
        const { data: professionalData, error: profError } = await supabase
          .from('profissionais')
          .select('id')
          .eq('profile_id', profileId)
          .single();
        
        if (profError) throw new Error('Perfil de profissional não encontrado');

        const { error } = await supabase
          .from('professional_institutions')
          .insert({
            professional_id: professionalData.id,
            institution_id: data.institutionId,
            relationship_type: data.relationshipType || 'employee',
            is_active: true,
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-institution-links'] });
      toast({
        title: 'Vínculo adicionado',
        description: 'O usuário foi vinculado à instituição com sucesso.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao adicionar vínculo',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Mutation para remover vínculo
  const removeLinkMutation = useMutation({
    mutationFn: async (data: { linkId: string; linkType: 'admin' | 'patient' | 'professional' }) => {
      if (data.linkType === 'admin') {
        const { error } = await supabase
          .from('institution_users')
          .delete()
          .eq('id', data.linkId);
        if (error) throw error;
      } else if (data.linkType === 'patient') {
        const { error } = await supabase
          .from('patient_institutions')
          .delete()
          .eq('id', data.linkId);
        if (error) throw error;
      } else if (data.linkType === 'professional') {
        const { error } = await supabase
          .from('professional_institutions')
          .delete()
          .eq('id', data.linkId);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-institution-links'] });
      toast({
        title: 'Vínculo removido',
        description: 'O vínculo foi removido com sucesso.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao remover vínculo',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Mutation para atualizar vínculo
  const updateLinkMutation = useMutation({
    mutationFn: async (data: {
      linkId: string;
      linkType: 'admin' | 'patient' | 'professional';
      updates: {
        role?: 'admin' | 'viewer';
        relationshipType?: 'employee' | 'consultant' | 'supervisor' | 'intern';
        enrollmentStatus?: 'enrolled' | 'graduated' | 'inactive';
        isActive?: boolean;
      };
    }) => {
      if (data.linkType === 'admin') {
        const { error } = await supabase
          .from('institution_users')
          .update({
            role: data.updates.role,
            is_active: data.updates.isActive,
          })
          .eq('id', data.linkId);
        if (error) throw error;
      } else if (data.linkType === 'patient') {
        const { error } = await supabase
          .from('patient_institutions')
          .update({
            enrollment_status: data.updates.enrollmentStatus,
          })
          .eq('id', data.linkId);
        if (error) throw error;
      } else if (data.linkType === 'professional') {
        const { error } = await supabase
          .from('professional_institutions')
          .update({
            relationship_type: data.updates.relationshipType,
            is_active: data.updates.isActive,
          })
          .eq('id', data.linkId);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-institution-links'] });
      toast({
        title: 'Vínculo atualizado',
        description: 'As informações foram atualizadas com sucesso.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao atualizar vínculo',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    links,
    isLoading,
    error,
    refetch,
    addLink: addLinkMutation.mutate,
    removeLink: removeLinkMutation.mutate,
    updateLink: updateLinkMutation.mutate,
    isAdding: addLinkMutation.isPending,
    isRemoving: removeLinkMutation.isPending,
    isUpdating: updateLinkMutation.isPending,
  };
};
