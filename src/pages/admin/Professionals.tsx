import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { StatsCard } from "@/components/admin/StatsCard";
import { EditProfessionalModal } from "@/components/admin/EditProfessionalModal";
import { ImageAssociationModal } from "@/components/admin/ImageAssociationModal";
import { UnavailabilityManager } from "@/components/admin/UnavailabilityManager";
import { Eye, Mail, Phone, User, CheckCircle, XCircle, Search, DollarSign, Clock, Users, UserCheck, UserX, Edit, Images, Calendar, Trash2 } from "lucide-react";
import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { useUserManagement } from "@/hooks/useUserManagement";
import { useAdminTenant } from '@/contexts/AdminTenantContext';

interface Professional {
  id: number;
  display_name: string;
  email_secundario?: string;
  telefone?: string;
  profissao?: string;
  resumo_profissional?: string;
  ativo: boolean;
  foto_perfil_url?: string;
  user_email: string;
  crp_crm?: string;
  preco_consulta?: number;
  tempo_consulta?: number;
  profile_id: string;
  profiles?: {
    user_id: string;
  };
}

const Professionals = () => {
  const [selectedProfessional, setSelectedProfessional] = useState<Professional | null>(null);
  const [editingProfessional, setEditingProfessional] = useState<Professional | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [imageAssociationOpen, setImageAssociationOpen] = useState(false);
  const [unavailabilityModalOpen, setUnavailabilityModalOpen] = useState(false);
  const [selectedProfessionalForUnavailability, setSelectedProfessionalForUnavailability] = useState<Professional | null>(null);
  const [deletingProfessional, setDeletingProfessional] = useState<Professional | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletionReason, setDeletionReason] = useState("");
  const { toast } = useToast();
  const { tenantFilter } = useAdminTenant();
  const { deleteUser, loading: deleteLoading } = useUserManagement();

  const { data: professionals, isLoading, refetch } = useQuery({
    queryKey: ['admin-professionals', tenantFilter],
    queryFn: async () => {
      let query = supabase
        .from('profissionais')
        .select(`
          *,
          profile_id,
          profiles!inner(user_id),
          professional_tenants!inner(
            tenant_id,
            is_featured,
            featured_order
          )
        `)
        .order('display_name');
      
      if (tenantFilter) {
        query = query.eq('professional_tenants.tenant_id', tenantFilter);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data as Professional[];
    }
  });

  const filteredProfessionals = useMemo(() => {
    if (!professionals) return [];
    
    return professionals.filter(professional => {
      const matchesSearch = 
        professional.display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        professional.user_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        professional.profissao?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = 
        statusFilter === "all" ||
        (statusFilter === "active" && professional.ativo) ||
        (statusFilter === "inactive" && !professional.ativo);
      
      return matchesSearch && matchesStatus;
    });
  }, [professionals, searchTerm, statusFilter]);

  const stats = useMemo(() => {
    if (!professionals) return { 
      totalRegistered: 0,
      available: 0,
      inactive: 0,
      availabilityRate: 0
    };
    
    const totalRegistered = professionals.length;
    const available = professionals.filter(p => p.ativo).length;
    const inactive = totalRegistered - available;
    const availabilityRate = totalRegistered > 0 
      ? Math.round((available / totalRegistered) * 100) 
      : 0;
    
    return { 
      totalRegistered, 
      available, 
      inactive,
      availabilityRate 
    };
  }, [professionals]);

  const handleToggleStatus = async (professionalId: number, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('profissionais')
        .update({ ativo: !currentStatus })
        .eq('id', professionalId);

      if (error) throw error;

      toast({
        title: "Status atualizado",
        description: `Profissional ${!currentStatus ? 'ativado' : 'desativado'} com sucesso.`,
      });

      refetch();
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar status do profissional.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteProfessional = async () => {
    if (!deletingProfessional) return;

    const userId = deletingProfessional.profiles?.user_id || null;
    const profileId = deletingProfessional.profile_id;

    const result = await deleteUser(
      userId,
      profileId,
      deletionReason || 'Removido pelo administrador'
    );

    if (result.success) {
      toast({
        title: "Profissional deletado",
        description: "O profissional foi removido completamente do sistema.",
      });
      setDeleteDialogOpen(false);
      setDeletingProfessional(null);
      setDeletionReason("");
      refetch();
    } else {
      toast({
        title: "Erro ao deletar",
        description: result.error || "Erro desconhecido ao deletar profissional.",
        variant: "destructive",
      });
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Profissionais</h1>
            <p className="text-muted-foreground">
              Gerencie os profissionais cadastrados na plataforma
            </p>
          </div>
          
          {/* Stats cards skeleton */}
          <div className="grid gap-4 md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-4" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-12" />
                </CardContent>
              </Card>
            ))}
          </div>
          
          {/* Search and filters skeleton */}
          <div className="flex gap-4">
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-10 w-32" />
          </div>
          
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Profissionais</h1>
          <p className="text-muted-foreground">
            Gerencie os profissionais cadastrados na plataforma
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <StatsCard
            title="Cadastrados no Site"
            value={stats.totalRegistered}
            icon={Users}
            description="Total vinculados ao tenant"
          />
          <StatsCard
            title="Disponíveis no Site"
            value={stats.available}
            icon={UserCheck}
            description="Ativos para agendamento"
          />
          <StatsCard
            title="Inativos"
            value={stats.inactive}
            icon={UserX}
            description="Não disponíveis"
          />
          <StatsCard
            title="Taxa de Disponibilidade"
            value={`${stats.availabilityRate}%`}
            icon={CheckCircle}
            description="Profissionais ativos"
          />
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Buscar profissionais..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            {["all", "active", "inactive"].map((filter) => (
              <Button
                key={filter}
                variant={statusFilter === filter ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter(filter as typeof statusFilter)}
              >
                {filter === "all" && "Todos"}
                {filter === "active" && "Ativos"}
                {filter === "inactive" && "Inativos"}
              </Button>
            ))}
            <Button
              variant="outline"
              onClick={() => setImageAssociationOpen(true)}
              size="sm"
              className="ml-2"
            >
              <Images className="h-4 w-4 mr-2" />
              Associar Imagens S3
            </Button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filteredProfessionals?.map((professional) => (
            <Card key={professional.id} className="hover:shadow-lg transition-all duration-200 border-muted">
              <CardHeader className="pb-4">
                <div className="flex items-start space-x-4">
                  <Avatar className="h-16 w-16 border-2 border-border">
                    <AvatarImage src={professional.foto_perfil_url} />
                    <AvatarFallback className="text-lg font-semibold">
                      {getInitials(professional.display_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-xl font-bold text-foreground mb-1">
                          {professional.display_name}
                        </CardTitle>
                        <CardDescription className="text-base font-medium">
                          {professional.profissao || 'Profissão não informada'}
                        </CardDescription>
                        {professional.crp_crm && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {professional.crp_crm}
                          </p>
                        )}
                      </div>
                      <Badge 
                        variant={professional.ativo ? "default" : "secondary"} 
                        className="ml-2 shrink-0"
                      >
                        {professional.ativo ? (
                          <CheckCircle className="h-3 w-3 mr-1" />
                        ) : (
                          <XCircle className="h-3 w-3 mr-1" />
                        )}
                        {professional.ativo ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center text-muted-foreground">
                    <Mail className="h-4 w-4 mr-3 text-primary shrink-0" />
                    <span className="text-sm truncate">{professional.user_email}</span>
                  </div>
                  {professional.telefone && (
                    <div className="flex items-center text-muted-foreground">
                      <Phone className="h-4 w-4 mr-3 text-primary shrink-0" />
                      <span className="text-sm">{professional.telefone}</span>
                    </div>
                  )}
                  
                  {/* Professional Details */}
                  <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border">
                    {professional.preco_consulta && (
                      <div className="flex items-center">
                        <DollarSign className="h-4 w-4 mr-2 text-green-600" />
                        <div>
                          <p className="text-xs text-muted-foreground">Preço</p>
                          <p className="text-sm font-medium">R$ {professional.preco_consulta}</p>
                        </div>
                      </div>
                    )}
                    {professional.tempo_consulta && (
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-2 text-blue-600" />
                        <div>
                          <p className="text-xs text-muted-foreground">Duração</p>
                          <p className="text-sm font-medium">{professional.tempo_consulta}min</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-3 pt-4 border-t border-border">
                  <div className="flex items-center space-x-3">
                    <label htmlFor={`status-${professional.id}`} className="text-sm font-medium text-foreground">
                      Status:
                    </label>
                    <Switch
                      id={`status-${professional.id}`}
                      checked={professional.ativo}
                      onCheckedChange={() => handleToggleStatus(professional.id, professional.ativo)}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingProfessional(professional)}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Editar
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedProfessionalForUnavailability(professional);
                        setUnavailabilityModalOpen(true);
                      }}
                    >
                      <Calendar className="h-4 w-4 mr-1" />
                      Bloqueios
                    </Button>
                    
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedProfessional(professional)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Ver Detalhes
                        </Button>
                      </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle className="flex items-center space-x-3">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={professional.foto_perfil_url} />
                            <AvatarFallback>{getInitials(professional.display_name)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="text-xl font-semibold">{professional.display_name}</h3>
                            <p className="text-muted-foreground">{professional.profissao}</p>
                          </div>
                        </DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">Email Principal</label>
                            <p className="text-sm">{professional.user_email}</p>
                          </div>
                          {professional.email_secundario && (
                            <div>
                              <label className="text-sm font-medium text-muted-foreground">Email Secundário</label>
                              <p className="text-sm">{professional.email_secundario}</p>
                            </div>
                          )}
                          {professional.telefone && (
                            <div>
                              <label className="text-sm font-medium text-muted-foreground">Telefone</label>
                              <p className="text-sm">{professional.telefone}</p>
                            </div>
                          )}
                          {professional.crp_crm && (
                            <div>
                              <label className="text-sm font-medium text-muted-foreground">CRP/CRM</label>
                              <p className="text-sm">{professional.crp_crm}</p>
                            </div>
                          )}
                          {professional.preco_consulta && (
                            <div>
                              <label className="text-sm font-medium text-muted-foreground">Preço da Consulta</label>
                              <p className="text-sm">R$ {professional.preco_consulta}</p>
                            </div>
                          )}
                          {professional.tempo_consulta && (
                            <div>
                              <label className="text-sm font-medium text-muted-foreground">Tempo da Consulta</label>
                              <p className="text-sm">{professional.tempo_consulta} minutos</p>
                            </div>
                          )}
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">Status</label>
                            <Badge variant={professional.ativo ? "default" : "secondary"} className="ml-2">
                              {professional.ativo ? 'Ativo' : 'Inativo'}
                            </Badge>
                          </div>
                        </div>
                        {professional.resumo_profissional && (
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">Resumo Profissional</label>
                            <p className="text-sm mt-1 p-3 bg-muted rounded-md">{professional.resumo_profissional}</p>
                          </div>
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>
                    
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        setDeletingProfessional(professional);
                        setDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Deletar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredProfessionals?.length === 0 && professionals && professionals.length > 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Search className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhum profissional encontrado</h3>
              <p className="text-muted-foreground text-center">
                Não há profissionais que correspondam aos filtros selecionados.
              </p>
            </CardContent>
          </Card>
        )}

        {professionals?.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <User className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhum profissional encontrado</h3>
              <p className="text-muted-foreground text-center">
                Não há profissionais cadastrados no sistema ainda.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Edit Professional Modal */}
        <EditProfessionalModal
          professional={editingProfessional}
          open={!!editingProfessional}
          onOpenChange={(open) => !open && setEditingProfessional(null)}
          onSuccess={refetch}
        />

        {/* Image Association Modal */}
        <ImageAssociationModal
          open={imageAssociationOpen}
          onOpenChange={setImageAssociationOpen}
        />

        {/* Unavailability Management Modal */}
        <Dialog open={unavailabilityModalOpen} onOpenChange={setUnavailabilityModalOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                Gerenciar Indisponibilidades - {selectedProfessionalForUnavailability?.display_name}
              </DialogTitle>
            </DialogHeader>
            {selectedProfessionalForUnavailability && (
              <UnavailabilityManager 
                professionalId={selectedProfessionalForUnavailability.id}
                professionalName={selectedProfessionalForUnavailability.display_name}
              />
            )}
          </DialogContent>
        </Dialog>

        {/* Delete Professional Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar Deleção de Profissional</AlertDialogTitle>
              <AlertDialogDescription className="space-y-2">
                <p>
                  Tem certeza que deseja deletar permanentemente o profissional{' '}
                  <strong className="text-foreground">{deletingProfessional?.display_name}</strong>?
                </p>
                <div className="bg-destructive/10 border border-destructive/20 rounded-md p-3 mt-2">
                  <p className="text-sm text-destructive font-medium">⚠️ Esta ação é IRREVERSÍVEL e removerá:</p>
                  <ul className="text-sm text-destructive/90 mt-2 space-y-1 list-disc list-inside">
                    <li>Perfil profissional e todos os dados pessoais</li>
                    <li>Todos os agendamentos (passados e futuros)</li>
                    <li>Horários de atendimento e bloqueios</li>
                    <li>Vínculos com tenants</li>
                    <li>Eventos de calendário do Google</li>
                  </ul>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            
            <div className="py-4">
              <label className="text-sm font-medium text-foreground">
                Motivo da deleção (opcional)
              </label>
              <Textarea
                value={deletionReason}
                onChange={(e) => setDeletionReason(e.target.value)}
                placeholder="Ex: Solicitação do profissional, duplicidade, violação de termos, etc."
                className="mt-2"
                rows={3}
              />
            </div>
            
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleteLoading}>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteProfessional}
                disabled={deleteLoading}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleteLoading ? 'Deletando...' : 'Deletar Permanentemente'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
};

export default Professionals;