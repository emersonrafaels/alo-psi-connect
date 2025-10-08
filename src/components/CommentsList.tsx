import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { CommentThread } from '@/components/blog/CommentThread';

interface Comment {
  id: string;
  content: string;
  author_name: string;
  author_email: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  likes_count: number;
  parent_comment_id?: string;
  reported_count: number;
  replies?: Comment[];
}

interface CommentsListProps {
  postId: string;
  refreshTrigger: number;
}

export const CommentsList = ({ postId, refreshTrigger }: CommentsListProps) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingComment, setEditingComment] = useState<Comment | null>(null);
  const [editContent, setEditContent] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchComments = async () => {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select('*')
        .eq('post_id', postId)
        .eq('status', 'approved')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Organize comments in a tree structure
      const commentsMap = new Map<string, Comment>();
      const rootComments: Comment[] = [];
      
      (data || []).forEach(comment => {
        commentsMap.set(comment.id, { ...comment, replies: [] });
      });
      
      commentsMap.forEach(comment => {
        if (comment.parent_comment_id) {
          const parent = commentsMap.get(comment.parent_comment_id);
          if (parent) {
            parent.replies = parent.replies || [];
            parent.replies.push(comment);
          }
        } else {
          rootComments.push(comment);
        }
      });
      
      setComments(rootComments);
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [postId, refreshTrigger]);

  const handleEdit = (comment: Comment) => {
    setEditingComment(comment);
    setEditContent(comment.content);
  };

  const handleCancelEdit = () => {
    setEditingComment(null);
    setEditContent('');
  };
  
  const handleReply = (parentId: string) => {
    setReplyingTo(parentId);
    setReplyContent('');
  };
  
  const handleCancelReply = () => {
    setReplyingTo(null);
    setReplyContent('');
  };

  const handleUpdateComment = async () => {
    if (!editContent.trim() || !editingComment) {
      toast({
        title: "Erro",
        description: "O comentário não pode estar vazio.",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('comments')
        .update({ 
          content: editContent,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingComment.id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Comentário atualizado com sucesso."
      });

      handleCancelEdit();
      fetchComments();
    } catch (error) {
      console.error('Error updating comment:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar comentário.",
        variant: "destructive"
      });
    }
  };
  
  const handleSubmitReply = async () => {
    if (!replyContent.trim() || !replyingTo || !user) {
      toast({
        title: "Erro",
        description: "Erro ao enviar resposta.",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('nome, email')
        .eq('user_id', user.id)
        .single();

      const { error } = await supabase
        .from('comments')
        .insert({
          post_id: postId,
          content: replyContent,
          user_id: user.id,
          author_name: profile?.nome || user.email || 'Usuário',
          author_email: profile?.email || user.email || '',
          parent_comment_id: replyingTo,
          status: 'approved'
        });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Resposta enviada com sucesso."
      });

      handleCancelReply();
      fetchComments();
    } catch (error) {
      console.error('Error submitting reply:', error);
      toast({
        title: "Erro",
        description: "Erro ao enviar resposta.",
        variant: "destructive"
      });
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Tem certeza que deseja excluir este comentário?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Comentário excluído com sucesso."
      });

      fetchComments();
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast({
        title: "Erro",
        description: "Erro ao excluir comentário.",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 mt-8">
        <div className="animate-pulse space-y-4">
          <div className="h-24 bg-muted rounded-lg"></div>
          <div className="h-24 bg-muted rounded-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 mt-8">
      <h3 className="text-lg font-semibold">
        Comentários ({comments.length})
      </h3>

      {comments.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <p>Nenhum comentário ainda. Seja o primeiro a comentar!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <div key={comment.id}>
              <CommentThread
                comment={comment}
                replies={comment.replies || []}
                onReply={handleReply}
                onEdit={handleEdit}
                onDelete={handleDeleteComment}
              />
              
              {replyingTo === comment.id && (
                <div className="ml-8 mt-4 bg-card/20 p-4 rounded-lg border border-border/30">
                  <p className="text-sm font-medium mb-2">Respondendo a {comment.author_name}</p>
                  <textarea
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    className="w-full min-h-[100px] p-3 rounded-md border bg-background resize-none"
                    placeholder="Escreva sua resposta..."
                  />
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={handleSubmitReply}
                      className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90"
                    >
                      Enviar
                    </button>
                    <button
                      onClick={handleCancelReply}
                      className="px-4 py-2 border rounded-md text-sm font-medium hover:bg-accent"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
              
              {editingComment?.id === comment.id && (
                <div className="ml-8 mt-4 bg-card/20 p-4 rounded-lg border border-border/30">
                  <p className="text-sm font-medium mb-2">Editando comentário</p>
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full min-h-[100px] p-3 rounded-md border bg-background resize-none"
                  />
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={handleUpdateComment}
                      className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90"
                    >
                      Salvar
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="px-4 py-2 border rounded-md text-sm font-medium hover:bg-accent"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
