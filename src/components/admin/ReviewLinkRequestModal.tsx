import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { AdminInstitutionLinkRequest } from '@/hooks/useAdminInstitutionLinkRequests';
import { CheckCircle, XCircle, Building2, User, Mail, Calendar, MessageSquare, Briefcase, GraduationCap } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ReviewLinkRequestModalProps {
  request: AdminInstitutionLinkRequest | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onReview: (requestId: string, action: 'approve' | 'reject', reviewNotes?: string) => void;
  isReviewing: boolean;
}

export function ReviewLinkRequestModal({
  request,
  open,
  onOpenChange,
  onReview,
  isReviewing,
}: ReviewLinkRequestModalProps) {
  const [reviewNotes, setReviewNotes] = useState('');
  const [action, setAction] = useState<'approve' | 'reject' | null>(null);

  if (!request) return null;

  const handleSubmit = () => {
    if (!action) return;
    onReview(request.id, action, reviewNotes || undefined);
    setReviewNotes('');
    setAction(null);
  };

  const getUserTypeBadge = (type: string) => {
    if (type === 'paciente') {
      return <Badge variant="secondary"><GraduationCap className="w-3 h-3 mr-1" />Paciente/Aluno</Badge>;
    }
    return <Badge variant="outline"><Briefcase className="w-3 h-3 mr-1" />Profissional</Badge>;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="default" className="bg-yellow-500">Pendente</Badge>;
      case 'approved':
        return <Badge variant="default" className="bg-green-600">Aprovada</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejeitada</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Revisar Solicitação de Vínculo
            {getStatusBadge(request.status)}
          </DialogTitle>
          <DialogDescription>
            Analise os detalhes da solicitação e aprove ou rejeite o vínculo institucional.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informações do Solicitante */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <User className="w-4 h-4" />
              Informações do Solicitante
            </h3>
            <div className="bg-muted/50 p-4 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{request.user_name}</span>
                {getUserTypeBadge(request.user_type)}
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="w-3 h-3" />
                {request.user_email}
              </div>
              {request.tenant_name && (
                <div className="text-sm text-muted-foreground">
                  Tenant: <span className="font-medium">{request.tenant_name}</span>
                </div>
              )}
            </div>
          </div>

          {/* Informações da Instituição */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              Instituição Solicitada
            </h3>
            <div className="bg-muted/50 p-4 rounded-lg">
              <div className="font-medium">{request.institution_name}</div>
            </div>
          </div>

          {/* Detalhes da Solicitação */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Detalhes da Solicitação
            </h3>
            <div className="bg-muted/50 p-4 rounded-lg space-y-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="w-3 h-3" />
                Solicitado em: {format(new Date(request.created_at), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
              </div>
              
              {request.relationship_type && (
                <div className="text-sm">
                  <span className="font-medium">Tipo de relacionamento:</span>{' '}
                  <span className="text-muted-foreground capitalize">{request.relationship_type}</span>
                </div>
              )}

              {request.enrollment_type && (
                <div className="text-sm">
                  <span className="font-medium">Tipo de matrícula:</span>{' '}
                  <span className="text-muted-foreground capitalize">{request.enrollment_type}</span>
                </div>
              )}

              {request.request_message && (
                <div className="text-sm">
                  <span className="font-medium">Mensagem:</span>
                  <p className="text-muted-foreground mt-1 whitespace-pre-wrap bg-background p-3 rounded border">
                    {request.request_message}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Status Review (se já foi revisada) */}
          {request.status !== 'pending' && (
            <div className="space-y-3">
              <h3 className="font-semibold text-sm">Revisão</h3>
              <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                {request.reviewed_at && (
                  <div className="text-sm text-muted-foreground">
                    Revisado em: {format(new Date(request.reviewed_at), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                  </div>
                )}
                {request.review_notes && (
                  <div className="text-sm">
                    <span className="font-medium">Notas da revisão:</span>
                    <p className="text-muted-foreground mt-1 whitespace-pre-wrap bg-background p-3 rounded border">
                      {request.review_notes}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Campo de Notas (apenas para pendentes) */}
          {request.status === 'pending' && (
            <div className="space-y-3">
              <Label htmlFor="review-notes">Notas da Revisão (opcional)</Label>
              <Textarea
                id="review-notes"
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="Adicione observações sobre esta decisão..."
                rows={4}
              />
            </div>
          )}
        </div>

        {request.status === 'pending' && (
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isReviewing}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setAction('reject');
                handleSubmit();
              }}
              disabled={isReviewing}
            >
              <XCircle className="w-4 h-4 mr-2" />
              Rejeitar
            </Button>
            <Button
              onClick={() => {
                setAction('approve');
                handleSubmit();
              }}
              disabled={isReviewing}
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Aprovar
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
