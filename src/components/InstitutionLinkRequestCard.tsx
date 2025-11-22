import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Building2, Send, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useInstitutions } from '@/hooks/useInstitutions';
import { useInstitutionLinkRequest } from '@/hooks/useInstitutionLinkRequest';
import { useTenant } from '@/hooks/useTenant';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface InstitutionLinkRequestCardProps {
  userType: 'paciente' | 'profissional';
}

export function InstitutionLinkRequestCard({ userType }: InstitutionLinkRequestCardProps) {
  const { tenant } = useTenant();
  const { institutions, isLoading: loadingInstitutions } = useInstitutions(true);
  const { requests, createRequest, isCreating } = useInstitutionLinkRequest();
  
  const [selectedInstitution, setSelectedInstitution] = useState('');
  const [requestMessage, setRequestMessage] = useState('');
  const [relationshipType, setRelationshipType] = useState<'employee' | 'consultant' | 'supervisor' | 'intern'>('employee');
  const [enrollmentType, setEnrollmentType] = useState<'student' | 'alumni' | 'employee'>('student');
  const [showForm, setShowForm] = useState(false);

  const handleSubmit = () => {
    if (!selectedInstitution || !tenant?.id) return;

    createRequest({
      institutionId: selectedInstitution,
      requestMessage,
      userType,
      tenantId: tenant.id,
      ...(userType === 'profissional' && { relationshipType }),
      ...(userType === 'paciente' && { enrollmentType }),
    });

    setSelectedInstitution('');
    setRequestMessage('');
    setShowForm(false);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100">
            <Clock className="h-3 w-3 mr-1" />
            Pendente
          </Badge>
        );
      case 'approved':
        return (
          <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
            <CheckCircle className="h-3 w-3 mr-1" />
            Aprovado
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="secondary" className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100">
            <XCircle className="h-3 w-3 mr-1" />
            Rejeitado
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const pendingRequests = requests.filter(r => r.status === 'pending');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Solicitar Vínculo Institucional
        </CardTitle>
        <CardDescription>
          Solicite afiliação com uma instituição educacional
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {pendingRequests.length > 0 && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Você possui {pendingRequests.length} solicitação(ões) pendente(s) de análise.
            </AlertDescription>
          </Alert>
        )}

        {requests.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-muted-foreground">Minhas Solicitações</h4>
            {requests.slice(0, 3).map((request) => (
              <div
                key={request.id}
                className="p-3 rounded-lg border bg-card space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{request.institution_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(request.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                  {getStatusBadge(request.status)}
                </div>
                {request.review_notes && (
                  <p className="text-xs text-muted-foreground border-t pt-2 mt-2">
                    <strong>Resposta:</strong> {request.review_notes}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {!showForm && (
          <Button
            onClick={() => setShowForm(true)}
            variant="outline"
            className="w-full"
          >
            <Send className="h-4 w-4 mr-2" />
            Nova Solicitação
          </Button>
        )}

        {showForm && (
          <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
            <div>
              <Label htmlFor="institution">Instituição *</Label>
              <Select
                value={selectedInstitution}
                onValueChange={setSelectedInstitution}
                disabled={loadingInstitutions}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma instituição" />
                </SelectTrigger>
                <SelectContent>
                  {institutions.map((inst) => (
                    <SelectItem key={inst.id} value={inst.id}>
                      {inst.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {userType === 'profissional' && (
              <div>
                <Label htmlFor="relationshipType">Tipo de Vínculo</Label>
                <Select
                  value={relationshipType}
                  onValueChange={(value: any) => setRelationshipType(value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="employee">Funcionário</SelectItem>
                    <SelectItem value="consultant">Consultor</SelectItem>
                    <SelectItem value="supervisor">Supervisor</SelectItem>
                    <SelectItem value="intern">Estagiário</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {userType === 'paciente' && (
              <div>
                <Label htmlFor="enrollmentType">Tipo de Vínculo</Label>
                <Select
                  value={enrollmentType}
                  onValueChange={(value: any) => setEnrollmentType(value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student">Estudante</SelectItem>
                    <SelectItem value="alumni">Ex-Aluno</SelectItem>
                    <SelectItem value="employee">Funcionário</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <Label htmlFor="message">Mensagem (Opcional)</Label>
              <Textarea
                id="message"
                value={requestMessage}
                onChange={(e) => setRequestMessage(e.target.value)}
                placeholder="Explique brevemente o motivo da solicitação..."
                rows={3}
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleSubmit}
                disabled={!selectedInstitution || isCreating}
                className="flex-1"
              >
                {isCreating ? 'Enviando...' : 'Enviar Solicitação'}
              </Button>
              <Button
                onClick={() => {
                  setShowForm(false);
                  setSelectedInstitution('');
                  setRequestMessage('');
                }}
                variant="outline"
              >
                Cancelar
              </Button>
            </div>

            <p className="text-xs text-muted-foreground">
              Sua solicitação será enviada para análise da instituição e do administrativo da plataforma.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
