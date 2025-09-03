import { useEffect, useState } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';

export type UserRole = 'admin' | 'super_admin' | 'moderator';

interface AdminAuthData {
  isAdmin: boolean;
  roles: UserRole[];
  loading: boolean;
  hasRole: (role: UserRole) => boolean;
}

export const useAdminAuth = (): AdminAuthData => {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAdminRoles = async () => {
      if (!user) {
        setIsAdmin(false);
        setRoles([]);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id);

        if (error) {
          console.error('Error fetching admin roles:', error);
          setIsAdmin(false);
          setRoles([]);
        } else {
          const userRoles = data?.map(item => item.role as UserRole) || [];
          setRoles(userRoles);
          setIsAdmin(userRoles.length > 0);
        }
      } catch (error) {
        console.error('Error checking admin roles:', error);
        setIsAdmin(false);
        setRoles([]);
      } finally {
        setLoading(false);
      }
    };

    checkAdminRoles();
  }, [user]);

  const hasRole = (role: UserRole) => roles.includes(role);

  return {
    isAdmin,
    roles,
    loading,
    hasRole
  };
};