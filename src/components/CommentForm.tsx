import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface CommentFormProps {
  postId: string;
  onCommentAdded: () => void;
}

export const CommentForm = ({ postId, onCommentAdded }: CommentFormProps) => {
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Login necessário",
        description: "Você precisa estar logado para comentar.",
        variant: "destructive"
      });
      return;
    }

    if (!content.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, escreva seu comentário.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('comments')
        .insert({
          post_id: postId,
          user_id: user.id,
          content: content.trim(),
          author_name: user.user_metadata?.name || user.email?.split('@')[0] || 'Usuário',
          author_email: user.email || ''
        });

      if (error) throw error;

      setContent("");
      onCommentAdded();
      toast({
        title: "Sucesso",
        description: "Comentário adicionado com sucesso!"
      });
    } catch (error) {
      console.error('Error adding comment:', error);
      toast({
        title: "Erro",
        description: "Erro ao adicionar comentário. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="bg-card/50 p-6 rounded-lg border border-border/50">
        <p className="text-muted-foreground text-center">
          <a href="/auth" className="text-primary hover:underline">
            Faça login
          </a>{" "}
          para deixar um comentário.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-card/50 p-6 rounded-lg border border-border/50 space-y-4">
      <h3 className="text-lg font-semibold">Deixe seu comentário</h3>
      
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Escreva seu comentário aqui..."
        className="min-h-[100px] resize-none"
        disabled={isSubmitting}
      />
      
      <div className="flex justify-end">
        <Button 
          type="submit" 
          disabled={isSubmitting || !content.trim()}
          className="btn-gradient"
        >
          {isSubmitting ? "Enviando..." : "Comentar"}
        </Button>
      </div>
    </form>
  );
};