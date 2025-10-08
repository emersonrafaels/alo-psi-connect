import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export const useSavedPosts = (postId: string) => {
  const [isSaved, setIsSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    checkIfSaved();
  }, [postId, user]);

  const checkIfSaved = async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('blog_saved_posts')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      setIsSaved(!!data);
    } catch (error) {
      console.error('Error checking saved status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSave = async () => {
    if (!user) {
      toast({
        title: "Login necessário",
        description: "Você precisa estar logado para salvar posts.",
        variant: "destructive"
      });
      return;
    }

    try {
      if (isSaved) {
        await supabase
          .from('blog_saved_posts')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id);

        setIsSaved(false);
        toast({
          title: "Post removido",
          description: "Post removido dos salvos."
        });
      } else {
        await supabase
          .from('blog_saved_posts')
          .insert({
            post_id: postId,
            user_id: user.id
          });

        setIsSaved(true);
        toast({
          title: "Post salvo!",
          description: "Post adicionado aos seus favoritos."
        });
      }
    } catch (error) {
      console.error('Error toggling save:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar post.",
        variant: "destructive"
      });
    }
  };

  return { isSaved, isLoading, toggleSave };
};
