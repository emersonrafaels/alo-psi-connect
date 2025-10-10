import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { UserManagementModal } from '@/components/admin/UserManagementModal';
import { RoleManagementDialog } from '@/components/admin/RoleManagementDialog';
import { UserTypeManagementDialog } from '@/components/admin/UserTypeManagementDialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useUserManagement } from '@/hooks/useUserManagement';
import { DeletedUsersTable } from '@/components/admin/DeletedUsersTable';
import { useEmailResend } from '@/hooks/useEmailResend';
import { Users as UsersIcon, User, Calendar, Settings, Trash2, Mail, KeyRound } from 'lucide-react';
import { useAdminTenant } from '@/contexts/AdminTenantContext';

interface UserProfile {
  id: string;
  nome: string;
  email: string;
  tipo_usuario: string;
  created_at: string;
  data_nascimento?: string;
  genero?: string;
  user_id?: string;
  roles?: string[];
}

export default function AdminUsers() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [selectedUserName, setSelectedUserName] = useState<string>('');
  const [selectedUserType, setSelectedUserType] = useState<string>('');
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [typeDialogOpen, setTypeDialogOpen] = useState(false);
  const { deleteUser } = useUserManagement();
  const { resendEmailConfirmation, resendPasswordReset, loading: emailLoading } = useEmailResend();
  const { tenantFilter } = useAdminTenant();

  useEffect(() => {
    fetchUsers();
  }, [tenantFilter]);

  const fetchUsers = async () => {
    try {
      // Get profiles with their roles, applying tenant filter
      let profilesQuery = supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (tenantFilter) {
        profilesQuery = profilesQuery.eq('tenant_id', tenantFilter);
      }

      const { data: profiles, error: profilesError } = await profilesQuery;

      if (profilesError) {
        console.error('Erro ao buscar perfis:', profilesError);
        return;
      }

      // Get all user roles
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) {
        console.error('Erro ao buscar roles:', rolesError);
      }

      // Combine profiles with roles
      const usersWithRoles = (profiles || []).map(profile => {
        const userRoles = roles?.filter(role => role.user_id === profile.user_id).map(role => role.role) || [];
        return { ...profile, roles: userRoles };
      });

      setUsers(usersWithRoles);
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleManagement = (userId: string, userName: string) => {
    setSelectedUserId(userId);
    setSelectedUserName(userName);
    setRoleDialogOpen(true);
  };

  const handleTypeManagement = (userId: string, userName: string, userType: string) => {
    setSelectedUserId(userId);
    setSelectedUserName(userName);
    setSelectedUserType(userType);
    setTypeDialogOpen(true);
  };

  const handleDeleteUser = async (userId: string) => {
    const result = await deleteUser(userId);
    if (result.success) {
      fetchUsers();
    }
  };

  const getRolesBadges = (roles: string[]) => {
    if (!roles || roles.length === 0) {
      return <Badge variant="outline">Sem roles admin</Badge>;
    }

    return roles.map(role => (
      <Badge 
        key={role} 
        variant={role === 'super_admin' ? 'destructive' : role === 'admin' ? 'default' : 'secondary'}
      >
        {role}
      </Badge>
    ));
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Usuários</h2>
          <p className="text-muted-foreground">Gerenciar perfis de usuários da plataforma</p>
        </div>
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      </div>
    );
  }

  const pacientes = users.filter(user => user.tipo_usuario === 'paciente');
  const profissionais = users.filter(user => user.tipo_usuario === 'profissional');
  const adminsWithRoles = users.filter(user => user.roles && user.roles.length > 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Usuários</h2>
        <p className="text-muted-foreground">
          Gerenciar perfis de usuários da plataforma
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
            <UsersIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pacientes</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pacientes.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Profissionais</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{profissionais.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Administradores</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{adminsWithRoles.length}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Gestão de Usuários</CardTitle>
          <UserManagementModal onUserCreated={fetchUsers} />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {users.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center space-x-4 mb-2">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{user.nome}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                    {user.tipo_usuario === 'paciente' && (
                      <Badge variant="secondary">Paciente</Badge>
                    )}
                    {user.tipo_usuario === 'profissional' && (
                      <Badge variant="outline">Profissional</Badge>
                    )}
                    {user.tipo_usuario === 'admin' && (
                      <Badge variant="default">Administrador</Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 mb-2 ml-14">
                    <span className="text-sm text-muted-foreground">Roles Admin:</span>
                    <div className="flex gap-1">
                      {getRolesBadges(user.roles || [])}
                    </div>
                  </div>
                  
                  <div className="flex gap-4 text-sm text-muted-foreground ml-14">
                    <span>Cadastrado em {new Date(user.created_at).toLocaleDateString('pt-BR')}</span>
                    {user.data_nascimento && (
                      <span>Nascimento: {new Date(user.data_nascimento).toLocaleDateString('pt-BR')}</span>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => resendEmailConfirmation(user.email)}
                    disabled={emailLoading}
                    className="gap-2"
                  >
                    <Mail className="h-4 w-4" />
                    Reenviar Confirmação
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => resendPasswordReset(user.email)}
                    disabled={emailLoading}
                    className="gap-2"
                  >
                    <KeyRound className="h-4 w-4" />
                    Reset Senha
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRoleManagement(user.user_id || '', user.nome)}
                    className="gap-2"
                  >
                    <Settings className="h-4 w-4" />
                    Gerenciar Roles
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleTypeManagement(user.user_id || '', user.nome, user.tipo_usuario)}
                    className="gap-2"
                  >
                    <User className="h-4 w-4" />
                    Gerenciar Tipo
                  </Button>
                  
                  <AlertDialog>
                     <AlertDialogTrigger asChild>
                       <Button variant="outline" size="sm" className="gap-2 text-destructive hover:text-destructive">
                         <Trash2 className="h-4 w-4" />
                         Deletar
                       </Button>
                     </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                       <AlertDialogTitle>Deletar usuário completamente</AlertDialogTitle>
                         <AlertDialogDescription>
                           <strong>ATENÇÃO:</strong> Tem certeza que deseja deletar completamente o usuário {user.nome}? 
                           Esta ação irá remover TODOS os dados do usuário do sistema e não pode ser desfeita.
                           Todos os agendamentos serão cancelados e o usuário não conseguirá mais fazer login.
                         </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                         <AlertDialogAction
                           onClick={() => handleDeleteUser(user.user_id || '')}
                           className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                         >
                           Deletar Completamente
                         </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Deleted Users Table */}
      <DeletedUsersTable />

      {/* Role Management Dialog */}
      <RoleManagementDialog
        open={roleDialogOpen}
        onOpenChange={setRoleDialogOpen}
        userId={selectedUserId}
        userName={selectedUserName}
        onRoleUpdated={fetchUsers}
      />

      {/* User Type Management Dialog */}
      <UserTypeManagementDialog
        open={typeDialogOpen}
        onOpenChange={setTypeDialogOpen}
        userId={selectedUserId}
        userName={selectedUserName}
        currentType={selectedUserType}
        onTypeUpdated={fetchUsers}
      />
    </div>
  );
}