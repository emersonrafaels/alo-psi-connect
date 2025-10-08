import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

const getSessionId = () => {
  let sessionId = localStorage.getItem('blog_session_id');
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem('blog_session_id', sessionId);
  }
  return sessionId;
};

export const useBlogRating = (postId: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const sessionId = getSessionId();

  const { data: userRating } = useQuery({
    queryKey: ['blog-rating', postId, user?.id, sessionId],
    queryFn: async () => {
      let query = supabase
        .from('blog_post_ratings')
        .select('rating')
        .eq('post_id', postId);

      if (user) {
        query = query.eq('user_id', user.id);
      } else {
        query = query.eq('session_id', sessionId);
      }

      const { data, error } = await query.maybeSingle();

      if (error) throw error;
      return data?.rating || null;
    },
    enabled: !!postId,
  });

  const ratePost = useMutation({
    mutationFn: async (rating: number) => {
      if (rating < 1 || rating > 5) {
        throw new Error('Avaliação deve ser entre 1 e 5 estrelas');
      }

      // Check if user already rated
      let existingQuery = supabase
        .from('blog_post_ratings')
        .select('id')
        .eq('post_id', postId);

      if (user) {
        existingQuery = existingQuery.eq('user_id', user.id);
      } else {
        existingQuery = existingQuery.eq('session_id', sessionId);
      }

      const { data: existing } = await existingQuery.maybeSingle();

      if (existing) {
        // Update existing rating
        const { error } = await supabase
          .from('blog_post_ratings')
          .update({ rating })
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        // Insert new rating
        const { error } = await supabase
          .from('blog_post_ratings')
          .insert({
            post_id: postId,
            rating,
            user_id: user?.id || null,
            session_id: !user ? sessionId : null,
          });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blog-rating', postId] });
      queryClient.invalidateQueries({ queryKey: ['blog-post', postId] });
      queryClient.invalidateQueries({ queryKey: ['blog-post-by-id', postId] });
    },
  });

  return { userRating, ratePost };
};
