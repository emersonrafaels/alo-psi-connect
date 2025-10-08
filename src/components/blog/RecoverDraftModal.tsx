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
import { FileText } from 'lucide-react';

interface RecoverDraftModalProps {
  open: boolean;
  draftTimestamp?: number;
  onRecover: () => void;
  onDiscard: () => void;
}

export const RecoverDraftModal = ({
  open,
  draftTimestamp,
  onRecover,
  onDiscard
}: RecoverDraftModalProps) => {
  const formatDraftAge = () => {
    if (!draftTimestamp) return '';
    
    const now = Date.now();
    const diffMs = now - draftTimestamp;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffMins < 60) return `há ${diffMins} minuto${diffMins !== 1 ? 's' : ''}`;
    if (diffHours < 24) return `há ${diffHours} hora${diffHours !== 1 ? 's' : ''}`;
    return `há ${diffDays} dia${diffDays !== 1 ? 's' : ''}`;
  };

  return (
    <AlertDialog open={open}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <AlertDialogTitle>Rascunho Encontrado</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="space-y-2">
            <p>
              Encontramos um rascunho não salvo deste post, criado {formatDraftAge()}.
            </p>
            <p>
              Deseja recuperar este rascunho ou começar do zero?
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onDiscard}>
            Descartar
          </AlertDialogCancel>
          <AlertDialogAction onClick={onRecover}>
            Recuperar Rascunho
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
