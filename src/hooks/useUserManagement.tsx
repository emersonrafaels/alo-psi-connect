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

  const deleteUser = async (userId: string, deletionReason?: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('delete-user-completely', {
        body: { userId, deletionReason }
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

  return {
    loading,
    createAdminUser,
    manageUserRole,
    deleteUser
  };
};