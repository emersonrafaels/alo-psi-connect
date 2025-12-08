import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { 
  Search, Eye, CheckCircle, XCircle, Clock, Building2, User, 
  GraduationCap, Briefcase, BarChart3, TrendingUp, TrendingDown,
  Percent, Timer, Calendar
} from 'lucide-react';
import { useAdminInstitutionLinkRequests, useLinkRequestsMetrics } from '@/hooks/useAdminInstitutionLinkRequests';
import { ReviewLinkRequestModal } from './ReviewLinkRequestModal';
import { LinkRequestsMetricsDashboard } from './LinkRequestsMetricsDashboard';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface InstitutionLinkRequestsTabProps {
  tenantId?: string | null;
}

export function InstitutionLinkRequestsTab({ tenantId }: InstitutionLinkRequestsTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [userTypeFilter, setUserTypeFilter] = useState<'all' | 'paciente' | 'profissional'>('all');
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('requests');
  
  // Batch selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [batchAction, setBatchAction] = useState<'approve' | 'reject'>('approve');
  const [batchNotes, setBatchNotes] = useState('');

  const { 
    requests, 
    isLoading, 
    stats, 
    reviewRequest, 
    isReviewing,
    batchReview,
    isBatchReviewing,
  } = useAdminInstitutionLinkRequests({
    statusFilter,
    userTypeFilter,
    tenantId: tenantId || undefined,
  });

  const { data: metrics } = useLinkRequestsMetrics(tenantId || undefined);

  const filteredRequests = requests.filter((request) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      request.user_name.toLowerCase().includes(searchLower) ||
      request.user_email.toLowerCase().includes(searchLower) ||
      request.institution_name.toLowerCase().includes(searchLower)
    );
  });

  const pendingRequests = filteredRequests.filter((r) => r.status === 'pending');

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <Badge variant="default" className="bg-yellow-500">
            <Clock className="w-3 h-3 mr-1" />
            Pendente
          </Badge>
        );
      case 'approved':
        return (
          <Badge variant="default" className="bg-green-600">
            <CheckCircle className="w-3 h-3 mr-1" />
            Aprovada
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="destructive">
            <XCircle className="w-3 h-3 mr-1" />
            Rejeitada
          </Badge>
        );
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getUserTypeIcon = (type: string) => {
    if (type === 'paciente') {
      return <GraduationCap className="w-4 h-4" />;
    }
    return <Briefcase className="w-4 h-4" />;
  };

  const handleReview = (requestId: string, action: 'approve' | 'reject', reviewNotes?: string) => {
    reviewRequest({ requestId, action, reviewNotes });
    setIsReviewModalOpen(false);
    setSelectedRequest(null);
  };

  // Batch actions handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const pendingIds = pendingRequests.map((r) => r.id);
      setSelectedIds(new Set(pendingIds));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedIds);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedIds(newSelected);
  };

  const handleBatchAction = (action: 'approve' | 'reject') => {
    setBatchAction(action);
    setIsBatchModalOpen(true);
  };

  const confirmBatchAction = () => {
    batchReview({
      requestIds: Array.from(selectedIds),
      action: batchAction,
      reviewNotes: batchNotes || undefined,
    });
    setIsBatchModalOpen(false);
    setBatchNotes('');
    setSelectedIds(new Set());
  };

  const allPendingSelected = pendingRequests.length > 0 && 
    pendingRequests.every((r) => selectedIds.has(r.id));
  const somePendingSelected = pendingRequests.some((r) => selectedIds.has(r.id));

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="requests" className="flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            Solicitações
            {stats.pending > 0 && (
              <Badge variant="secondary" className="ml-1 bg-yellow-100 text-yellow-800">
                {stats.pending}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="metrics" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Métricas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="requests" className="space-y-6">
          {/* Cards de Estatísticas */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total</CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
                <p className="text-xs text-muted-foreground">Todas as solicitações</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
                <Clock className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.pending}</div>
                <p className="text-xs text-muted-foreground">Aguardando revisão</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Aprovadas</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.approved}</div>
                <p className="text-xs text-muted-foreground">Vínculos criados</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Rejeitadas</CardTitle>
                <XCircle className="h-4 w-4 text-destructive" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.rejected}</div>
                <p className="text-xs text-muted-foreground">Solicitações negadas</p>
              </CardContent>
            </Card>
          </div>

          {/* Métricas rápidas */}
          {metrics && (
            <div className="grid gap-4 md:grid-cols-3">
              <Card className="bg-gradient-to-br from-green-50 to-green-100/50 border-green-200">
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-700">Taxa de Aprovação</p>
                      <p className="text-2xl font-bold text-green-800">{metrics.approvalRate}%</p>
                    </div>
                    <Percent className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200">
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-700">Tempo Médio Resposta</p>
                      <p className="text-2xl font-bold text-blue-800">{metrics.avgResponseTimeHours}h</p>
                    </div>
                    <Timer className="h-8 w-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-50 to-purple-100/50 border-purple-200">
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-purple-700">Esta Semana</p>
                      <div className="flex items-center gap-2">
                        <p className="text-2xl font-bold text-purple-800">{metrics.requestsThisWeek}</p>
                        {metrics.weeklyChange !== 0 && (
                          <Badge 
                            variant={metrics.weeklyChange > 0 ? 'default' : 'secondary'}
                            className={metrics.weeklyChange > 0 ? 'bg-green-600' : 'bg-red-600'}
                          >
                            {metrics.weeklyChange > 0 ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                            {Math.abs(metrics.weeklyChange)}%
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Calendar className="h-8 w-8 text-purple-600" />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Barra de Ações em Lote */}
          {selectedIds.size > 0 && (
            <Card className="border-primary bg-primary/5">
              <CardContent className="py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={allPendingSelected}
                      onCheckedChange={handleSelectAll}
                    />
                    <span className="text-sm font-medium">
                      {selectedIds.size} solicitação(ões) selecionada(s)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedIds(new Set())}
                    >
                      Limpar Seleção
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleBatchAction('reject')}
                      disabled={isBatchReviewing}
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Rejeitar Selecionados
                    </Button>
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() => handleBatchAction('approve')}
                      disabled={isBatchReviewing}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Aprovar Selecionados
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Filtros */}
          <Card>
            <CardHeader>
              <CardTitle>Solicitações de Vínculo Institucional</CardTitle>
              <CardDescription>
                Gerencie as solicitações de vínculo com instituições educacionais
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      placeholder="Buscar por nome, email ou instituição..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
                  <SelectTrigger className="w-full md:w-[180px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os status</SelectItem>
                    <SelectItem value="pending">Pendentes</SelectItem>
                    <SelectItem value="approved">Aprovadas</SelectItem>
                    <SelectItem value="rejected">Rejeitadas</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={userTypeFilter} onValueChange={(value: any) => setUserTypeFilter(value)}>
                  <SelectTrigger className="w-full md:w-[180px]">
                    <SelectValue placeholder="Tipo de Usuário" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os tipos</SelectItem>
                    <SelectItem value="paciente">Pacientes/Alunos</SelectItem>
                    <SelectItem value="profissional">Profissionais</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Tabela */}
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={allPendingSelected}
                          onCheckedChange={handleSelectAll}
                          disabled={pendingRequests.length === 0}
                        />
                      </TableHead>
                      <TableHead>Solicitante</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Instituição</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          Carregando solicitações...
                        </TableCell>
                      </TableRow>
                    ) : filteredRequests.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          Nenhuma solicitação encontrada
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredRequests.map((request) => (
                        <TableRow key={request.id}>
                          <TableCell>
                            <Checkbox
                              checked={selectedIds.has(request.id)}
                              onCheckedChange={(checked) => handleSelectOne(request.id, !!checked)}
                              disabled={request.status !== 'pending'}
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-muted-foreground" />
                              <div>
                                <div className="font-medium">{request.user_name}</div>
                                <div className="text-xs text-muted-foreground">{request.user_email}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getUserTypeIcon(request.user_type)}
                              <span className="capitalize">{request.user_type}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Building2 className="w-4 h-4 text-muted-foreground" />
                              <div>
                                <div>{request.institution_name}</div>
                                {request.institution_has_partnership && (
                                  <Badge variant="outline" className="text-xs mt-0.5">Parceira</Badge>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {format(new Date(request.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                          </TableCell>
                          <TableCell>{getStatusBadge(request.status)}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedRequest(request);
                                setIsReviewModalOpen(true);
                              }}
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              {request.status === 'pending' ? 'Revisar' : 'Ver Detalhes'}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="metrics">
          <LinkRequestsMetricsDashboard tenantId={tenantId || undefined} />
        </TabsContent>
      </Tabs>

      {/* Modal de Revisão */}
      <ReviewLinkRequestModal
        request={selectedRequest}
        open={isReviewModalOpen}
        onOpenChange={setIsReviewModalOpen}
        onReview={handleReview}
        isReviewing={isReviewing}
      />

      {/* Modal de Confirmação de Ação em Lote */}
      <AlertDialog open={isBatchModalOpen} onOpenChange={setIsBatchModalOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {batchAction === 'approve' ? 'Aprovar' : 'Rejeitar'} {selectedIds.size} solicitação(ões)?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação será aplicada a todas as solicitações selecionadas.
              {batchAction === 'approve' && ' Os vínculos serão criados automaticamente.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="py-4">
            <label className="text-sm font-medium">Notas (aplicada a todos)</label>
            <Textarea
              value={batchNotes}
              onChange={(e) => setBatchNotes(e.target.value)}
              placeholder="Adicione uma nota para todas as solicitações..."
              className="mt-2"
              rows={3}
            />
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isBatchReviewing}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmBatchAction}
              disabled={isBatchReviewing}
              className={batchAction === 'approve' ? 'bg-green-600 hover:bg-green-700' : ''}
            >
              {isBatchReviewing ? 'Processando...' : `Confirmar ${batchAction === 'approve' ? 'Aprovação' : 'Rejeição'}`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
