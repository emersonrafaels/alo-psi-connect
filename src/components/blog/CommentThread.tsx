import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ThumbsUp, Reply, Flag, MoreVertical, Edit, Trash } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Comment {
  id: string;
  content: string;
  author_name: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  likes_count: number;
  parent_comment_id?: string;
  reported_count: number;
  replies?: Comment[];
}

interface CommentThreadProps {
  comment: Comment;
  replies?: Comment[];
  onReply: (parentId: string) => void;
  onEdit: (comment: Comment) => void;
  onDelete: (commentId: string) => void;
  depth?: number;
}

export const CommentThread = ({ 
  comment, 
  replies = [], 
  onReply, 
  onEdit, 
  onDelete,
  depth = 0 
}: CommentThreadProps) => {
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(comment.likes_count || 0);
  const { user } = useAuth();
  const { toast } = useToast();
  const maxDepth = 3;

  useEffect(() => {
    if (user) {
      checkIfLiked();
    }
  }, [user, comment.id]);

  const checkIfLiked = async () => {
    if (!user) return;

    try {
      const { data } = await supabase
        .from('comment_likes')
        .select('id')
        .eq('comment_id', comment.id)
        .eq('user_id', user.id)
        .maybeSingle();

      setIsLiked(!!data);
    } catch (error) {
      console.error('Error checking like status:', error);
    }
  };

  const handleLike = async () => {
    if (!user) {
      toast({
        title: "Login necessário",
        description: "Você precisa estar logado para curtir.",
        variant: "destructive"
      });
      return;
    }

    try {
      if (isLiked) {
        await supabase
          .from('comment_likes')
          .delete()
          .eq('comment_id', comment.id)
          .eq('user_id', user.id);
        
        setLikesCount(prev => Math.max(0, prev - 1));
        setIsLiked(false);
      } else {
        await supabase
          .from('comment_likes')
          .insert({
            comment_id: comment.id,
            user_id: user.id
          });
        
        setLikesCount(prev => prev + 1);
        setIsLiked(true);
      }
    } catch (error) {
      console.error('Error liking comment:', error);
      toast({
        title: "Erro",
        description: "Erro ao curtir comentário.",
        variant: "destructive"
      });
    }
  };

  const handleReport = async () => {
    if (!user) {
      toast({
        title: "Login necessário",
        description: "Você precisa estar logado para reportar.",
        variant: "destructive"
      });
      return;
    }

    try {
      await supabase
        .from('comments')
        .update({ reported_count: (comment.reported_count || 0) + 1 })
        .eq('id', comment.id);

      toast({
        title: "Comentário reportado",
        description: "Obrigado por nos ajudar a manter a comunidade segura."
      });
    } catch (error) {
      console.error('Error reporting comment:', error);
    }
  };

  return (
    <div className={`${depth > 0 ? 'ml-8 mt-4' : 'mb-4'}`}>
      <div className="bg-card/30 p-4 rounded-lg border border-border/30">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-primary-foreground text-sm font-semibold">
              {comment.author_name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-medium text-sm">{comment.author_name}</p>
              <p className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(comment.created_at), { 
                  addSuffix: true, 
                  locale: ptBR 
                })}
                {comment.updated_at !== comment.created_at && ' (editado)'}
              </p>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {user && user.id === comment.user_id && (
                <>
                  <DropdownMenuItem onClick={() => onEdit(comment)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Editar
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => onDelete(comment.id)}
                    className="text-destructive"
                  >
                    <Trash className="h-4 w-4 mr-2" />
                    Excluir
                  </DropdownMenuItem>
                </>
              )}
              <DropdownMenuItem onClick={handleReport}>
                <Flag className="h-4 w-4 mr-2" />
                Reportar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <p className="text-sm leading-relaxed whitespace-pre-wrap mb-3">
          {comment.content}
        </p>

        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLike}
            className={`h-8 gap-1 ${isLiked ? 'text-primary' : ''}`}
          >
            <ThumbsUp className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
            <span className="text-xs">{likesCount}</span>
          </Button>

          {depth < maxDepth && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onReply(comment.id)}
              className="h-8 gap-1"
            >
              <Reply className="h-4 w-4" />
              <span className="text-xs">Responder</span>
            </Button>
          )}
        </div>
      </div>

      {replies.length > 0 && (
        <div className="mt-2">
          {replies.map(reply => (
            <CommentThread
              key={reply.id}
              comment={reply}
              replies={reply.replies || []}
              onReply={onReply}
              onEdit={onEdit}
              onDelete={onDelete}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};
