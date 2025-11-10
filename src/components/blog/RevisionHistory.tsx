import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Clock, RotateCcw, Eye, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface Revision {
  id: string;
  post_id: string;
  title: string;
  content: string;
  excerpt: string;
  created_at: string;
  created_by: string;
  revision_note: string | null;
  author?: {
    nome: string;
    foto_perfil_url: string | null;
  };
}

interface RevisionHistoryProps {
  postId: string;
  onRestore?: (revision: Revision) => void;
}

export const RevisionHistory = ({ postId, onRestore }: RevisionHistoryProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedRevision, setSelectedRevision] = useState<Revision | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);

  const { data: revisions, isLoading } = useQuery({
    queryKey: ['blog-post-revisions', postId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_post_revisions')
        .select(`
          *,
          author:created_by(nome, foto_perfil_url)
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Revision[];
    },
    enabled: !!postId,
  });

  const restoreMutation = useMutation({
    mutationFn: async (revision: Revision) => {
      const { error } = await supabase
        .from('blog_posts')
        .update({
          title: revision.title,
          content: revision.content,
          excerpt: revision.excerpt,
          updated_at: new Date().toISOString(),
        })
        .eq('id', postId);

      if (error) throw error;
    },
    onSuccess: (_, revision) => {
      toast({
        title: 'Revisão restaurada',
        description: 'O post foi restaurado para a versão selecionada.',
      });
      queryClient.invalidateQueries({ queryKey: ['blog-posts'] });
      queryClient.invalidateQueries({ queryKey: ['blog-post', postId] });
      onRestore?.(revision);
      setRestoreDialogOpen(false);
    },
    onError: () => {
      toast({
        title: 'Erro ao restaurar',
        description: 'Não foi possível restaurar a revisão.',
        variant: 'destructive',
      });
    },
  });

  const handleRestore = (revision: Revision) => {
    setSelectedRevision(revision);
    setRestoreDialogOpen(true);
  };

  if (isLoading) {
    return <div className="text-center py-4">Carregando revisões...</div>;
  }

  if (!revisions || revisions.length === 0) {
    return (
      <Card className="p-6 text-center text-muted-foreground">
        <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>Nenhuma revisão encontrada.</p>
        <p className="text-sm mt-1">As revisões são criadas automaticamente ao salvar o post.</p>
      </Card>
    );
  }

  return (
    <>
      <ScrollArea className="h-[500px] pr-4">
        <div className="space-y-3">
          {revisions.map((revision, index) => (
            <Card key={revision.id} className="p-4 hover:bg-muted/50 transition-colors">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-sm font-medium">
                      {format(new Date(revision.created_at), "d 'de' MMMM, yyyy 'às' HH:mm", {
                        locale: ptBR,
                      })}
                    </span>
                    {index === 0 && (
                      <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                        Mais recente
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-semibold truncate">{revision.title}</p>
                  {revision.revision_note && (
                    <p className="text-xs text-muted-foreground mt-1">{revision.revision_note}</p>
                  )}
                  {revision.author && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Por: {revision.author.nome}
                    </p>
                  )}
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedRevision(revision);
                      setShowPreview(true);
                    }}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRestore(revision)}
                    disabled={index === 0}
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </ScrollArea>

      {/* Preview Dialog */}
      {showPreview && selectedRevision && (
        <AlertDialog open={showPreview} onOpenChange={setShowPreview}>
          <AlertDialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <AlertDialogHeader>
              <AlertDialogTitle>{selectedRevision.title}</AlertDialogTitle>
              <AlertDialogDescription>
                Revisão de{' '}
                {format(new Date(selectedRevision.created_at), "d 'de' MMMM, yyyy 'às' HH:mm", {
                  locale: ptBR,
                })}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div
              className="prose prose-sm dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: selectedRevision.content }}
            />
            <AlertDialogFooter>
              <AlertDialogCancel>Fechar</AlertDialogCancel>
              <AlertDialogAction onClick={() => handleRestore(selectedRevision)}>
                Restaurar Esta Versão
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {/* Restore Confirmation Dialog */}
      <AlertDialog open={restoreDialogOpen} onOpenChange={setRestoreDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restaurar Revisão?</AlertDialogTitle>
            <AlertDialogDescription>
              Isso irá substituir o conteúdo atual do post pela revisão selecionada. Uma nova
              revisão será criada com o conteúdo atual antes da restauração.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedRevision && restoreMutation.mutate(selectedRevision)}
            >
              Restaurar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
