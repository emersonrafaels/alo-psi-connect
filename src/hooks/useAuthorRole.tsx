import { useEffect, useState } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';

export const useAuthorRole = () => {
  const { user } = useAuth();
  const [isAuthor, setIsAuthor] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuthorRole = async () => {
      if (!user) {
        setIsAuthor(false);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .in('role', ['author', 'admin', 'super_admin']);

        if (error) {
          console.error('Error checking author role:', error);
          setIsAuthor(false);
        } else {
          setIsAuthor((data || []).length > 0);
        }
      } catch (error) {
        console.error('Error checking author role:', error);
        setIsAuthor(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuthorRole();
  }, [user]);

  return { isAuthor, loading };
};
