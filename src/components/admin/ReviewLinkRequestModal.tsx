import { useState, useEffect } from 'react';
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
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { AdminInstitutionLinkRequest, UserExistingLink, useAdminInstitutionLinkRequests } from '@/hooks/useAdminInstitutionLinkRequests';
import { 
  CheckCircle, XCircle, Building2, User, Mail, Calendar, MessageSquare, 
  Briefcase, GraduationCap, AlertTriangle, Link2, Handshake, CheckCircle2,
  Clock, History, UserCheck
} from 'lucide-react';
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
  const [existingLinks, setExistingLinks] = useState<UserExistingLink[]>([]);
  const [isDuplicate, setIsDuplicate] = useState(false);
  const [isLoadingContext, setIsLoadingContext] = useState(false);
  
  const { fetchUserExistingLinks, checkDuplicateLink } = useAdminInstitutionLinkRequests();

  useEffect(() => {
    if (request && open) {
      loadContextData();
    }
  }, [request, open]);

  const loadContextData = async () => {
    if (!request?.profile_id) return;
    
    setIsLoadingContext(true);
    try {
      const [links, duplicate] = await Promise.all([
        fetchUserExistingLinks(request.profile_id, request.user_type),
        checkDuplicateLink(request.profile_id, request.institution_id, request.user_type),
      ]);
      setExistingLinks(links);
      setIsDuplicate(duplicate);
    } catch (error) {
      console.error('Error loading context data:', error);
    } finally {
      setIsLoadingContext(false);
    }
  };

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

  const getRelationshipTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      employee: 'Funcionário',
      consultant: 'Consultor',
      supervisor: 'Supervisor',
      intern: 'Estagiário',
      partner: 'Parceiro',
      contractor: 'Prestador de Serviço',
    };
    return labels[type.toLowerCase()] || type;
  };

  const getEnrollmentTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      student: 'Estudante',
      alumni: 'Ex-Aluno',
      employee: 'Funcionário',
      enrolled: 'Matriculado',
      graduated: 'Formado',
      inactive: 'Inativo',
    };
    return labels[type.toLowerCase()] || type;
  };

  const getInstitutionTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      university: 'Universidade',
      college: 'Faculdade',
      technical: 'Escola Técnica',
      school: 'Escola',
      institute: 'Instituto',
      other: 'Outro',
      private: 'Privada',
      public: 'Pública',
    };
    return labels[type.toLowerCase()] || type;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="default" className="bg-yellow-500"><Clock className="w-3 h-3 mr-1" />Pendente</Badge>;
      case 'approved':
        return <Badge variant="default" className="bg-green-600"><CheckCircle className="w-3 h-3 mr-1" />Aprovada</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Rejeitada</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Revisar Solicitação de Vínculo
            {getStatusBadge(request.status)}
          </DialogTitle>
          <DialogDescription>
            Analise os detalhes da solicitação e aprove ou rejeite o vínculo institucional.
          </DialogDescription>
        </DialogHeader>

        {/* Duplicate Warning */}
        {isDuplicate && request.status === 'pending' && (
          <Alert variant="destructive" className="border-yellow-500 bg-yellow-50">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              <strong>Atenção:</strong> Este usuário já possui um vínculo ativo com esta instituição.
              Aprovar esta solicitação pode criar uma duplicata.
            </AlertDescription>
          </Alert>
        )}

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

          {/* Vínculos Existentes do Usuário */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <History className="w-4 h-4" />
              Vínculos Existentes
            </h3>
            {isLoadingContext ? (
              <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : existingLinks.length > 0 ? (
              <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                {existingLinks.map((link) => (
                  <div 
                    key={link.id}
                    className={`flex items-center justify-between p-2 rounded ${
                      link.institution_id === request.institution_id 
                        ? 'bg-yellow-100 border border-yellow-300' 
                        : 'bg-background'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">{link.institution_name}</span>
                      {link.institution_id === request.institution_id && (
                        <Badge variant="outline" className="text-yellow-700 border-yellow-500">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          Mesmo
                        </Badge>
                      )}
                    </div>
                    <Badge variant={link.is_active ? 'default' : 'secondary'} className={link.is_active ? 'bg-green-600' : ''}>
                      {link.is_active ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-muted/50 p-4 rounded-lg text-sm text-muted-foreground text-center">
                <UserCheck className="w-5 h-5 mx-auto mb-2 opacity-50" />
                Nenhum vínculo institucional existente
              </div>
            )}
          </div>

          <Separator />

          {/* Informações da Instituição */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              Instituição Solicitada
            </h3>
            <div className="bg-muted/50 p-4 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-medium">{request.institution_name}</span>
                <div className="flex items-center gap-2">
                  {request.institution_has_partnership && (
                    <Badge variant="default" className="bg-purple-600">
                      <Handshake className="w-3 h-3 mr-1" />
                      Parceira
                    </Badge>
                  )}
                  <Badge variant={request.institution_is_active ? 'default' : 'destructive'}>
                    {request.institution_is_active ? 'Ativa' : 'Inativa'}
                  </Badge>
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>Tipo: <strong>{getInstitutionTypeLabel(request.institution_type)}</strong></span>
              </div>
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
                  <Badge variant="outline">{getRelationshipTypeLabel(request.relationship_type)}</Badge>
                </div>
              )}

              {request.enrollment_type && (
                <div className="text-sm">
                  <span className="font-medium">Tipo de matrícula:</span>{' '}
                  <Badge variant="outline">{getEnrollmentTypeLabel(request.enrollment_type)}</Badge>
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
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                Revisão
              </h3>
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
              disabled={isReviewing || isDuplicate}
              className="bg-green-600 hover:bg-green-700"
              title={isDuplicate ? 'Não é possível aprovar: vínculo duplicado detectado' : ''}
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
