import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { formatUserDisplayName } from '@/lib/utils';

export interface CreateUserData {
  email: string;
  password: string;
  nome: string;
  role?: 'admin' | 'super_admin' | 'moderator';
}

export const useUserManagement = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const createAdminUser = async (userData: CreateUserData) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-admin-user', {
        body: userData
      });

      if (error) {
        throw error;
      }

      if (data.error) {
        throw new Error(data.error);
      }

      toast({
        title: "Usuário criado com sucesso",
        description: `Usuário ${userData.email} foi criado com a role ${userData.role || 'admin'}`,
      });

      return { success: true, data: data.user };
    } catch (error: any) {
      console.error('Error creating user:', error);
      toast({
        title: "Erro ao criar usuário",
        description: error.message || "Erro desconhecido",
        variant: "destructive",
      });
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const manageUserRole = async (userId: string, action: 'add' | 'remove', role: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('manage-user-roles', {
        body: { userId, action, role }
      });

      if (error) {
        throw error;
      }

      if (data.error) {
        // Se a role já existe, retorna sucesso silenciosamente
        if (data.error === 'User already has this role') {
          console.log('Role already exists, skipping addition');
          return { success: true, data: null };
        }
        throw new Error(data.error);
      }

      toast({
        title: "Role atualizada com sucesso",
        description: `Role ${role} foi ${action === 'add' ? 'adicionada' : 'removida'}`,
      });

      return { success: true, data: data.data };
    } catch (error: any) {
      console.error('Error managing role:', error);
      toast({
        title: "Erro ao gerenciar role",
        description: error.message || "Erro desconhecido",
        variant: "destructive",
      });
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async (userId: string | null, profileId: string, deletionReason?: string) => {
    if (!userId && !profileId) {
      toast({
        title: "Erro de validação",
        description: "ID de usuário ou perfil é necessário",
        variant: "destructive",
      });
      return { success: false, error: 'Invalid identifiers' };
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('delete-user-completely', {
        body: { 
          userId: userId || null,
          profileId: profileId,
          deletionReason 
        }
      });

      if (error) {
        throw error;
      }

      if (data.error) {
        throw new Error(data.error);
      }

      const userName = formatUserDisplayName(data.deletedUser || {});
      const userEmail = data.deletedUser?.email || 'email não disponível';
      
      toast({
        title: "Usuário deletado completamente",
        description: `${userName} (${userEmail}) foi removido do sistema`,
      });

      return { success: true, data: data.deletedUser };
    } catch (error: any) {
      console.error('Error deleting user:', error);
      toast({
        title: "Erro ao deletar usuário",
        description: error.message || "Erro desconhecido",
        variant: "destructive",
      });
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const updateUserType = async (userId: string, newType: 'paciente' | 'profissional' | 'admin') => {
    setLoading(true);
    try {
      // Update the user type in profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ tipo_usuario: newType })
        .eq('user_id', userId);

      if (profileError) {
        throw profileError;
      }

      // If changing to professional, ensure a professional profile exists
      if (newType === 'profissional') {
        // Get the profile id
        const { data: profile, error: getProfileError } = await supabase
          .from('profiles')
          .select('id, nome, email')
          .eq('user_id', userId)
          .single();

        if (getProfileError) {
          throw getProfileError;
        }

        // Check if professional profile already exists
        const { data: existingProf, error: checkError } = await supabase
          .from('profissionais')
          .select('id')
          .eq('profile_id', profile.id)
          .maybeSingle();

        if (checkError) {
          throw checkError;
        }

        // Create professional profile if it doesn't exist
        if (!existingProf) {
          const { error: profError } = await supabase
            .from('profissionais')
            .insert({
              profile_id: profile.id,
              user_id: 1, // Default value as required by schema
              user_login: profile.email,
              user_email: profile.email,
              display_name: profile.nome,
              ativo: false // Start as inactive until approved
            });

          if (profError) {
            throw profError;
          }
        }
      }

      toast({
        title: "Tipo de usuário atualizado",
        description: `Usuário foi alterado para ${newType}`,
      });

      return { success: true };
    } catch (error: any) {
      console.error('Error updating user type:', error);
      toast({
        title: "Erro ao atualizar tipo de usuário",
        description: error.message || "Erro desconhecido",
        variant: "destructive",
      });
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const cleanupOrphanProfiles = async (emailPattern: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('cleanup-orphan-profiles', {
        body: { emailPattern }
      });

      if (error) {
        throw error;
      }

      if (data.error) {
        throw new Error(data.error);
      }

      toast({
        title: "Limpeza concluída",
        description: `${data.deletedCount} perfis órfãos foram deletados`,
      });

      return { success: true, data };
    } catch (error: any) {
      console.error('Error cleaning up orphan profiles:', error);
      toast({
        title: "Erro na limpeza",
        description: error.message || "Erro desconhecido",
        variant: "destructive",
      });
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const createInstitutionalUser = async (userData: {
    email: string;
    password: string;
    nome: string;
    institutionId: string;
    institutionRole?: 'admin' | 'viewer';
    tenantId?: string;
  }) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-institutional-user', {
        body: userData
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      toast({
        title: "Usuário institucional criado",
        description: `${userData.email} foi criado e vinculado à instituição`,
      });

      return { success: true, data: data.user };
    } catch (error: any) {
      console.error('Error creating institutional user:', error);
      toast({
        title: "Erro ao criar usuário",
        description: error.message || "Erro desconhecido",
        variant: "destructive",
      });
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    createAdminUser,
    createInstitutionalUser,
    manageUserRole,
    deleteUser,
    updateUserType,
    cleanupOrphanProfiles
  };
};