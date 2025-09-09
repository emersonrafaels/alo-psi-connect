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
import { Eye, Mail, Phone, User, CheckCircle, XCircle, Search, DollarSign, Clock, Users, UserCheck, UserX } from "lucide-react";
import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";

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
}

const Professionals = () => {
  const [selectedProfessional, setSelectedProfessional] = useState<Professional | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const { toast } = useToast();

  const { data: professionals, isLoading, refetch } = useQuery({
    queryKey: ['admin-professionals'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profissionais')
        .select('*')
        .order('display_name');
      
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
    if (!professionals) return { total: 0, active: 0, inactive: 0 };
    
    const total = professionals.length;
    const active = professionals.filter(p => p.ativo).length;
    const inactive = total - active;
    
    return { total, active, inactive };
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
            title="Total de Profissionais"
            value={stats.total}
            icon={Users}
            description="Total cadastrado"
          />
          <StatsCard
            title="Profissionais Ativos"
            value={stats.active}
            icon={UserCheck}
            description="Disponíveis para agendamento"
          />
          <StatsCard
            title="Profissionais Inativos"
            value={stats.inactive}
            icon={UserX}
            description="Não disponíveis"
          />
          <StatsCard
            title="Taxa de Ativação"
            value={`${stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0}%`}
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

                <div className="flex items-center justify-between pt-4 border-t border-border">
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
      </div>
    </AdminLayout>
  );
};

export default Professionals;