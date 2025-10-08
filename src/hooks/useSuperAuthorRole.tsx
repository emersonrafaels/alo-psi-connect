import { useEffect, useState } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';

export const useSuperAuthorRole = () => {
  const { user } = useAuth();
  const [isSuperAuthor, setIsSuperAuthor] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSuperAuthorRole = async () => {
      if (!user) {
        setIsSuperAuthor(false);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .in('role', ['super_author', 'admin', 'super_admin']);

        if (error) {
          console.error('Error checking super author role:', error);
          setIsSuperAuthor(false);
        } else {
          setIsSuperAuthor((data || []).length > 0);
        }
      } catch (error) {
        console.error('Error checking super author role:', error);
        setIsSuperAuthor(false);
      } finally {
        setLoading(false);
      }
    };

    checkSuperAuthorRole();
  }, [user]);

  return { isSuperAuthor, loading };
};
