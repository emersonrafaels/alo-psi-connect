import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Eye, Mail, Phone, MapPin, User, CheckCircle, XCircle } from "lucide-react";
import { useState } from "react";
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
}

const Professionals = () => {
  const [selectedProfessional, setSelectedProfessional] = useState<Professional | null>(null);
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
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {professionals?.map((professional) => (
            <Card key={professional.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-4">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={professional.foto_perfil_url} />
                    <AvatarFallback>{getInitials(professional.display_name)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg truncate">{professional.display_name}</CardTitle>
                    <CardDescription className="truncate">{professional.profissao || 'Profissão não informada'}</CardDescription>
                  </div>
                  <Badge variant={professional.ativo ? "default" : "secondary"}>
                    {professional.ativo ? (
                      <CheckCircle className="h-3 w-3 mr-1" />
                    ) : (
                      <XCircle className="h-3 w-3 mr-1" />
                    )}
                    {professional.ativo ? 'Ativo' : 'Inativo'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm">
                  <div className="flex items-center text-muted-foreground">
                    <Mail className="h-4 w-4 mr-2" />
                    <span className="truncate">{professional.user_email}</span>
                  </div>
                  {professional.telefone && (
                    <div className="flex items-center text-muted-foreground">
                      <Phone className="h-4 w-4 mr-2" />
                      <span>{professional.telefone}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <label htmlFor={`status-${professional.id}`} className="text-sm font-medium">
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