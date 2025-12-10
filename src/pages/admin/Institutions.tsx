import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
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
import { Plus, Search, Edit, Users, Trash2, GraduationCap, Building2, Handshake, AlertTriangle, UserCog, Ticket, Shield, Briefcase, FileText, BarChart3, FileCheck, Image, Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useInstitutions, EducationalInstitution } from '@/hooks/useInstitutions';
import { useUncataloguedInstitutions } from '@/hooks/useUncataloguedInstitutions';
import { EditInstitutionModal } from '@/components/admin/EditInstitutionModal';
import { UncataloguedInstitutionsTable } from '@/components/admin/UncataloguedInstitutionsTable';
import { useInstitutionPatients } from '@/hooks/useInstitutionPatients';
import { ManageInstitutionUsersModal } from '@/components/admin/ManageInstitutionUsersModal';
import { ManageInstitutionAdminUsersModal } from '@/components/admin/ManageInstitutionAdminUsersModal';
import { ManageInstitutionCouponsModal } from '@/components/admin/ManageInstitutionCouponsModal';
import { InstitutionAuditLog } from '@/components/admin/InstitutionAuditLog';
import { InstitutionMetricsDashboard } from '@/components/admin/InstitutionMetricsDashboard';
import { InstitutionLinkRequestsTab } from '@/components/admin/InstitutionLinkRequestsTab';
import { useAdminTenant } from '@/contexts/AdminTenantContext';
import { AdminTenantSelector } from '@/components/admin/AdminTenantSelector';
import { useInstitutionUsers } from '@/hooks/useInstitutionUsers';
import { useAdminInstitutionLinkRequests } from '@/hooks/useAdminInstitutionLinkRequests';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export default function Institutions() {
  const { tenantFilter, selectedTenantId, tenants } = useAdminTenant();
  const { toast } = useToast();
  const [isFetchingLogos, setIsFetchingLogos] = useState(false);
  
  const {
    institutions,
    isLoading,
    stats,
    createInstitution,
    updateInstitution,
    deleteInstitution,
    isUpdating,
  } = useInstitutions();

  const {
    uncatalogued,
    isLoading: isLoadingUncatalogued,
    stats: uncataloguedStats,
    catalogueInstitution,
    linkInstitution,
    isCataloguing,
    isLinking,
  } = useUncataloguedInstitutions();

  // Buscar dados filtrados por tenant
  const { data: institutionUsersData } = useInstitutionUsers(tenantFilter);
  const { data: institutionCouponsData } = useQuery({
    queryKey: ['all-institution-coupons', tenantFilter],
    queryFn: async () => {
      let query = supabase.from('institution_coupons').select('*');
      if (tenantFilter) {
        query = query.eq('tenant_id', tenantFilter);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'public' | 'private'>('all');
  const [partnershipFilter, setPartnershipFilter] = useState<'all' | 'yes' | 'no'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  
  const [editingInstitution, setEditingInstitution] = useState<EducationalInstitution | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [managingUsers, setManagingUsers] = useState<{ id: string; name: string } | null>(null);
  const [managingAdminUsers, setManagingAdminUsers] = useState<{ id: string; name: string } | null>(null);
  const [managingCoupons, setManagingCoupons] = useState<{ id: string; name: string } | null>(null);
  const [selectedInstitutionForAudit, setSelectedInstitutionForAudit] = useState<{ id: string; name: string } | null>(null);
  const [activeTab, setActiveTab] = useState('institutions');

  // Fetch pending link requests count
  const { stats: linkRequestsStats } = useAdminInstitutionLinkRequests({
    statusFilter: 'pending',
    tenantId: tenantFilter || undefined,
  });

  // Calcular stats filtradas por tenant
  const filteredStats = {
    totalAdmins: institutionUsersData?.length || 0,
    activeCoupons: institutionCouponsData?.filter((c: any) => c.is_active).length || 0,
    totalCoupons: institutionCouponsData?.length || 0,
    // Profissionais e alunos continuam globais
    totalProfessionals: stats.total,
    totalStudents: uncataloguedStats.affectedPatients,
  };

  const selectedTenantName = tenants.find(t => t.id === selectedTenantId)?.name;

  // Contar pacientes por instituição
  const { patientInstitutions: allPatientInstitutions } = useInstitutionPatients();
  const getPatientCount = (institutionId: string) => {
    return allPatientInstitutions?.filter(
      (pi: any) => pi.institution_id === institutionId
    ).length || 0;
  };

  const filteredInstitutions = institutions.filter((institution) => {
    const matchesSearch = institution.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesType =
      typeFilter === 'all' || institution.type === typeFilter;
    const matchesPartnership =
      partnershipFilter === 'all' ||
      (partnershipFilter === 'yes' && institution.has_partnership) ||
      (partnershipFilter === 'no' && !institution.has_partnership);
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && institution.is_active) ||
      (statusFilter === 'inactive' && !institution.is_active);

    return matchesSearch && matchesType && matchesPartnership && matchesStatus;
  });

  const handleCreate = (data: Omit<EducationalInstitution, 'id' | 'created_at' | 'updated_at'>) => {
    createInstitution(data);
    setIsCreateModalOpen(false);
  };

  const handleToggleActive = (institution: EducationalInstitution) => {
    updateInstitution({
      id: institution.id,
      is_active: !institution.is_active,
    });
  };

  const handleFetchAllLogos = async () => {
    setIsFetchingLogos(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('Não autenticado');
      }

      const response = await supabase.functions.invoke('fetch-institution-logos', {
        body: { fetchAll: true },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      const { summary } = response.data;
      toast({
        title: 'Busca de logos concluída',
        description: `${summary.found} logos encontrados, ${summary.notFound} não encontrados.`,
      });
    } catch (error) {
      console.error('Error fetching logos:', error);
      toast({
        title: 'Erro ao buscar logos',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      });
    } finally {
      setIsFetchingLogos(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Instituições de Ensino</h1>
            <p className="text-muted-foreground mt-2">
              Gerencie instituições de ensino, parcerias e vínculos com profissionais e alunos
            </p>
          </div>
          <div className="flex items-center gap-4">
            <AdminTenantSelector />
            <Button onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Nova Instituição
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList>
            <TabsTrigger value="institutions">
              <Building2 className="h-4 w-4 mr-2" />
              Instituições
            </TabsTrigger>
            <TabsTrigger value="requests">
              <FileCheck className="h-4 w-4 mr-2" />
              Solicitações
              {linkRequestsStats.pending > 0 && (
                <Badge className="ml-2 bg-yellow-500 text-white" variant="secondary">
                  {linkRequestsStats.pending}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="metrics">
              <BarChart3 className="h-4 w-4 mr-2" />
              Métricas
            </TabsTrigger>
            <TabsTrigger value="audit">
              <FileText className="h-4 w-4 mr-2" />
              Auditoria
            </TabsTrigger>
          </TabsList>

          <TabsContent value="institutions" className="space-y-6">

        {/* Cards de Estatísticas */}
        <div className="grid gap-4 md:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Catalogadas</CardTitle>
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.public} públicas, {stats.private} privadas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Não Catalogadas</CardTitle>
              <AlertTriangle className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-warning">{uncataloguedStats.total}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Variações digitadas livremente
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Admins Institucionais
              </CardTitle>
              <UserCog className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{filteredStats.totalAdmins}</div>
              <p className="text-xs text-muted-foreground">
                Usuários administradores
              </p>
              {selectedTenantId !== 'all' && (
                <p className="text-xs text-muted-foreground mt-1">
                  Filtrado: {selectedTenantName}
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Cupons Ativos
              </CardTitle>
              <Ticket className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{filteredStats.activeCoupons} / {filteredStats.totalCoupons}</div>
              <p className="text-xs text-muted-foreground">
                Promoções em andamento
              </p>
              {selectedTenantId !== 'all' && (
                <p className="text-xs text-muted-foreground mt-1">
                  Filtrado: {selectedTenantName}
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Com Parceria</CardTitle>
              <Handshake className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.withPartnership}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Instituições parceiras
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4 md:flex-row">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nome..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              <Select value={typeFilter} onValueChange={(value: any) => setTypeFilter(value)}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  <SelectItem value="public">Públicas</SelectItem>
                  <SelectItem value="private">Privadas</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={partnershipFilter}
                onValueChange={(value: any) => setPartnershipFilter(value)}
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="yes">Com parceria</SelectItem>
                  <SelectItem value="no">Sem parceria</SelectItem>
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos status</SelectItem>
                  <SelectItem value="active">Ativas</SelectItem>
                  <SelectItem value="inactive">Inativas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Seção: Instituições Não Catalogadas */}
        {uncataloguedStats.total > 0 && (
          <Card className="border-warning">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-warning" />
                Instituições Não Catalogadas
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Estas instituições foram digitadas livremente por pacientes e não estão no catálogo oficial.
                Você pode catalogá-las, vinculá-las a instituições existentes ou ignorá-las.
              </p>
            </CardHeader>
            <CardContent>
              <UncataloguedInstitutionsTable
                institutions={uncatalogued}
                isLoading={isLoadingUncatalogued}
                onCatalogue={(customName, officialData) => {
                  catalogueInstitution({ customName, officialData });
                }}
                onLink={(customName, targetInstitutionId) => {
                  linkInstitution({ customName, targetInstitutionId });
                }}
                isCataloguing={isCataloguing}
                isLinking={isLinking}
              />
            </CardContent>
          </Card>
        )}

        {/* Tabela de Instituições Catalogadas */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Instituições Catalogadas</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={handleFetchAllLogos}
              disabled={isFetchingLogos}
            >
              {isFetchingLogos ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Image className="mr-2 h-4 w-4" />
              )}
              {isFetchingLogos ? 'Buscando...' : 'Buscar Logos Automaticamente'}
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p>Carregando...</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12"></TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Parceria</TableHead>
                    <TableHead>Permissões</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInstitutions.map((institution) => (
                    <TableRow key={institution.id}>
                      <TableCell>
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={institution.logo_url || undefined} alt={institution.name} />
                          <AvatarFallback className="bg-muted">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                          </AvatarFallback>
                        </Avatar>
                      </TableCell>
                      <TableCell className="font-medium">{institution.name}</TableCell>
                      <TableCell>
                        <Badge variant={institution.type === 'public' ? 'default' : 'secondary'}>
                          {institution.type === 'public' ? 'Pública' : 'Privada'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {institution.has_partnership ? (
                          <Badge variant="default">Sim</Badge>
                        ) : (
                          <Badge variant="outline">Não</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {institution.can_manage_users && (
                            <Badge variant="outline" className="text-xs gap-1">
                              <Users className="h-3 w-3" />
                              Usuários
                            </Badge>
                          )}
                          {institution.can_manage_coupons && (
                            <Badge variant="outline" className="text-xs gap-1">
                              <Ticket className="h-3 w-3" />
                              Cupons
                            </Badge>
                          )}
                          {institution.can_manage_professionals && (
                            <Badge variant="outline" className="text-xs gap-1">
                              <Briefcase className="h-3 w-3" />
                              Profissionais
                            </Badge>
                          )}
                          {!institution.can_manage_users && 
                           !institution.can_manage_coupons && 
                           !institution.can_manage_professionals && (
                            <span className="text-xs text-muted-foreground">Nenhuma</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={institution.is_active}
                          onCheckedChange={() => handleToggleActive(institution)}
                          disabled={isUpdating}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {institution.has_partnership && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setManagingCoupons({ id: institution.id, name: institution.name })}
                              title="Gerenciar Cupons"
                            >
                              <Ticket className="h-4 w-4 text-primary" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setManagingUsers({ id: institution.id, name: institution.name })}
                            title="Vincular Pacientes e Profissionais"
                          >
                            <Users className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setManagingAdminUsers({ id: institution.id, name: institution.name })}
                            title="Gerenciar Usuários Administrativos"
                          >
                            <UserCog className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedInstitutionForAudit({ id: institution.id, name: institution.name });
                              setActiveTab('audit');
                            }}
                            title="Ver Histórico de Auditoria"
                          >
                            <FileText className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setEditingInstitution(institution)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteInstitution(institution.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
          </TabsContent>

          <TabsContent value="requests" className="space-y-6">
            <InstitutionLinkRequestsTab tenantId={tenantFilter} />
          </TabsContent>

          <TabsContent value="metrics" className="space-y-6">
            <InstitutionMetricsDashboard />
          </TabsContent>

          <TabsContent value="audit" className="space-y-6">
            {selectedInstitutionForAudit ? (
              <InstitutionAuditLog
                institutionId={selectedInstitutionForAudit.id}
                institutionName={selectedInstitutionForAudit.name}
              />
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center h-64 text-center">
                  <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Selecione uma Instituição</h3>
                  <p className="text-sm text-muted-foreground">
                    Clique no ícone de auditoria <FileText className="h-4 w-4 inline" /> ao lado de uma instituição para visualizar seu histórico
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Modais */}
      <EditInstitutionModal
        institution={editingInstitution}
        isOpen={!!editingInstitution}
        onClose={() => setEditingInstitution(null)}
        onSave={updateInstitution}
        isSaving={isUpdating}
      />

      <EditInstitutionModal
        institution={null}
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSave={(data) => handleCreate(data as any)}
        isSaving={isUpdating}
      />

      <ManageInstitutionUsersModal
        institution={managingUsers}
        isOpen={!!managingUsers}
        onClose={() => setManagingUsers(null)}
      />

      <ManageInstitutionAdminUsersModal
        institution={managingAdminUsers}
        isOpen={!!managingAdminUsers}
        onClose={() => setManagingAdminUsers(null)}
        tenantId={selectedTenantId === 'all' ? null : selectedTenantId}
      />

      <ManageInstitutionCouponsModal
        institution={managingCoupons}
        isOpen={!!managingCoupons}
        onClose={() => setManagingCoupons(null)}
        tenantId={tenantFilter}
      />
    </AdminLayout>
  );
}
