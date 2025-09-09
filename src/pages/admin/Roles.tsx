import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Shield, User, Crown, Settings, Trash2, Plus } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useUserManagement } from "@/hooks/useUserManagement";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface UserWithRoles {
  user_id: string;
  email: string;
  nome: string;
  roles: string[];
  created_at: string;
}

const roleIcons = {
  'super_admin': Crown,
  'admin': Shield,
  'moderator': Settings,
  'user': User
};

const roleLabels = {
  'super_admin': 'Super Admin',
  'admin': 'Administrador',
  'moderator': 'Moderador',
  'user': 'Usuário'
};

const roleColors = {
  'super_admin': 'default',
  'admin': 'secondary',
  'moderator': 'outline',
  'user': 'secondary'
} as const;

const Roles = () => {
  const [isAddRoleOpen, setIsAddRoleOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<string>('');
  const { toast } = useToast();
  const { manageUserRole, loading } = useUserManagement();

  const { data: usersWithRoles, isLoading, refetch } = useQuery({
    queryKey: ['admin-users-roles'],
    queryFn: async () => {
      // Buscar usuários com perfis
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, email, nome, created_at');

      if (profilesError) throw profilesError;

      // Buscar todas as roles
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) throw rolesError;

      // Combinar dados
      const usersWithRoles = profiles?.map(profile => {
        const userRoles = roles?.filter(role => role.user_id === profile.user_id)?.map(role => role.role) || [];
        return {
          user_id: profile.user_id,
          email: profile.email,
          nome: profile.nome,
          roles: userRoles,
          created_at: profile.created_at
        };
      }) || [];

      return usersWithRoles.filter(user => user.roles.length > 0) as UserWithRoles[];
    }
  });

  const { data: availableUsers } = useQuery({
    queryKey: ['available-users-for-roles'],
    queryFn: async () => {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('user_id, email, nome');

      if (error) throw error;
      return profiles || [];
    }
  });

  const handleAddRole = async () => {
    if (!selectedUserId || !selectedRole) {
      toast({
        title: "Erro",
        description: "Selecione um usuário e uma role.",
        variant: "destructive",
      });
      return;
    }

    try {
      await manageUserRole(selectedUserId, 'add', selectedRole);
      toast({
        title: "Sucesso",
        description: "Role adicionada com sucesso.",
      });
      setIsAddRoleOpen(false);
      setSelectedUserId('');
      setSelectedRole('');
      refetch();
    } catch (error) {
      console.error('Erro ao adicionar role:', error);
    }
  };

  const handleRemoveRole = async (userId: string, role: string) => {
    try {
      await manageUserRole(userId, 'remove', role);
      toast({
        title: "Sucesso",
        description: "Role removida com sucesso.",
      });
      refetch();
    } catch (error) {
      console.error('Erro ao remover role:', error);
    }
  };

  const getRoleIcon = (role: string) => {
    const IconComponent = roleIcons[role as keyof typeof roleIcons] || User;
    return <IconComponent className="h-4 w-4" />;
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Gerenciamento de Roles</h1>
            <p className="text-muted-foreground">
              Gerencie as permissões e roles dos usuários do sistema
            </p>
          </div>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-full" />
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Gerenciamento de Roles</h1>
            <p className="text-muted-foreground">
              Gerencie as permissões e roles dos usuários do sistema
            </p>
          </div>
          
          <Dialog open={isAddRoleOpen} onOpenChange={setIsAddRoleOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Role
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adicionar Role a Usuário</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="user-select">Usuário</Label>
                  <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um usuário" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableUsers?.map((user) => (
                        <SelectItem key={user.user_id} value={user.user_id}>
                          {user.nome} ({user.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="role-select">Role</Label>
                  <Select value={selectedRole} onValueChange={setSelectedRole}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Administrador</SelectItem>
                      <SelectItem value="moderator">Moderador</SelectItem>
                      <SelectItem value="super_admin">Super Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsAddRoleOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleAddRole} disabled={loading}>
                    {loading ? 'Adicionando...' : 'Adicionar'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Lista de Usuários com Roles */}
        <div className="space-y-4">
          {usersWithRoles?.map((user) => (
            <Card key={user.user_id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{user.nome}</CardTitle>
                    <CardDescription>{user.email}</CardDescription>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Desde: {new Date(user.created_at).toLocaleDateString('pt-BR')}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Roles Ativas</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {user.roles.map((role) => (
                        <div key={role} className="flex items-center gap-2">
                          <Badge 
                            variant={roleColors[role as keyof typeof roleColors] || 'secondary'}
                            className="flex items-center gap-1"
                          >
                            {getRoleIcon(role)}
                            {roleLabels[role as keyof typeof roleLabels] || role}
                          </Badge>
                          
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-destructive hover:text-destructive">
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Remover Role</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Tem certeza que deseja remover a role "{roleLabels[role as keyof typeof roleLabels] || role}" 
                                  do usuário {user.nome}? Esta ação não pode ser desfeita.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleRemoveRole(user.user_id, role)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Remover
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {usersWithRoles?.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Shield className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhum usuário com roles encontrado</h3>
              <p className="text-muted-foreground text-center">
                Não há usuários com roles administrativas no sistema ainda.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
};

export default Roles;