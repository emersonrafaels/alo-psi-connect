import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { UserManagementModal } from '@/components/admin/UserManagementModal';
import { RoleManagementDialog } from '@/components/admin/RoleManagementDialog';
import { UserTypeManagementDialog } from '@/components/admin/UserTypeManagementDialog';
import { UserInstitutionsManager } from '@/components/admin/UserInstitutionsManager';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useUserManagement } from '@/hooks/useUserManagement';
import { DeletedUsersTable } from '@/components/admin/DeletedUsersTable';
import { useEmailResend } from '@/hooks/useEmailResend';
import { Users as UsersIcon, User, Calendar, Settings, Trash2, Mail, KeyRound, Stethoscope, Heart, AlertCircle, Building2, MoreVertical, Search } from 'lucide-react';
import { useAdminTenant } from '@/contexts/AdminTenantContext';
import { useToast } from '@/hooks/use-toast';
import { useUserSearch } from '@/hooks/useUserSearch';
import { UserSearchBar } from '@/components/admin/UserSearchBar';

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
  institutionLinks?: Array<{ name: string; type: string }>;
}

export default function AdminUsers() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [selectedUserName, setSelectedUserName] = useState<string>('');
  const [selectedUserType, setSelectedUserType] = useState<string>('');
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [typeDialogOpen, setTypeDialogOpen] = useState(false);
  const [institutionsModalOpen, setInstitutionsModalOpen] = useState(false);
  const [selectedUserForInstitutions, setSelectedUserForInstitutions] = useState<UserProfile | null>(null);
  const [deletionInfo, setDeletionInfo] = useState<{
    appointmentsCount: number;
    isProfessional: boolean;
    isPatient: boolean;
  } | null>(null);
  const { deleteUser, cleanupOrphanProfiles } = useUserManagement();
  const { resendEmailConfirmation, resendPasswordReset, loading: emailLoading } = useEmailResend();
  const { tenantFilter } = useAdminTenant();
  const { toast } = useToast();
  const { filteredUsers, filters, setFilters, activeFiltersCount } = useUserSearch(users);

  useEffect(() => {
    fetchUsers();
  }, [tenantFilter]);

  // Query para profissionais específicos do tenant
  const { data: tenantProfessionals } = useQuery({
    queryKey: ['tenant-professionals-count', tenantFilter],
    queryFn: async () => {
      if (!tenantFilter) {
        // Se "Todos os Tenants", retorna total de profissionais
        const { count } = await supabase
          .from('profissionais')
          .select('*', { count: 'exact', head: true });
        return count || 0;
      }
      
      // Se tenant específico, conta apenas os associados
      const { count } = await supabase
        .from('professional_tenants')
        .select('professional_id', { count: 'exact', head: true })
        .eq('tenant_id', tenantFilter);
      
      return count || 0;
    }
  });

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

      // Buscar prévia de vínculos institucionais
      const { data: institutionLinks } = await supabase
        .from('institution_users')
        .select('user_id, educational_institutions(name)');

      const { data: patientLinks } = await supabase
        .from('patient_institutions')
        .select(`
          pacientes!inner(profile_id),
          educational_institutions(name)
        `);

      const { data: professionalLinks } = await supabase
        .from('professional_institutions')
        .select(`
          profissionais!inner(profile_id),
          educational_institutions(name)
        `);

      // Combine profiles with roles and institution links
      const usersWithRoles = (profiles || []).map(profile => {
        const userRoles = roles?.filter(role => role.user_id === profile.user_id).map(role => role.role) || [];
        
        // Mapear vínculos institucionais
        const adminLinks = institutionLinks?.filter(l => l.user_id === profile.user_id) || [];
        const patientLinksForUser = patientLinks?.filter((l: any) => l.pacientes?.profile_id === profile.id) || [];
        const profLinksForUser = professionalLinks?.filter((l: any) => l.profissionais?.profile_id === profile.id) || [];

        const allLinks = [
          ...adminLinks.map((l: any) => ({ name: l.educational_institutions?.name, type: 'admin' })),
          ...patientLinksForUser.map((l: any) => ({ name: l.educational_institutions?.name, type: 'patient' })),
          ...profLinksForUser.map((l: any) => ({ name: l.educational_institutions?.name, type: 'professional' }))
        ];

        return { ...profile, roles: userRoles, institutionLinks: allLinks };
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

  const handleManageInstitutions = (user: UserProfile) => {
    setSelectedUserForInstitutions(user);
    setInstitutionsModalOpen(true);
  };

  const handleDeleteUser = async (userId: string | null, profileId: string) => {
    const result = await deleteUser(userId, profileId);
    if (result.success) {
      fetchUsers();
    }
  };

  const fetchDeletionInfo = async (user: UserProfile) => {
    try {
      // Determinar se é profissional
      const isProfessional = user.tipo_usuario === 'profissional';
      const isPatient = user.tipo_usuario === 'paciente';
      
      let totalAppointments = 0;

      // Buscar agendamentos como paciente
      if (user.user_id) {
        const { count: patientCount } = await supabase
          .from('agendamentos')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.user_id)
          .neq('status', 'cancelado');
        
        totalAppointments += patientCount || 0;
      }

      // Buscar agendamentos como profissional
      if (isProfessional) {
        const { data: prof } = await supabase
          .from('profissionais')
          .select('id')
          .eq('profile_id', user.id)
          .maybeSingle();
        
        if (prof) {
          const { count: professionalCount } = await supabase
            .from('agendamentos')
            .select('id', { count: 'exact', head: true })
            .eq('professional_id', prof.id)
            .neq('status', 'cancelado');
          
          totalAppointments += professionalCount || 0;
        }
      }

      setDeletionInfo({
        appointmentsCount: totalAppointments,
        isProfessional,
        isPatient
      });
    } catch (error) {
      console.error('Erro ao buscar informações de deleção:', error);
      setDeletionInfo({
        appointmentsCount: 0,
        isProfessional: user.tipo_usuario === 'profissional',
        isPatient: user.tipo_usuario === 'paciente'
      });
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

  const pacientes = filteredUsers.filter(user => user.tipo_usuario === 'paciente');
  const profissionais = filteredUsers.filter(user => user.tipo_usuario === 'profissional');
  const adminsWithRoles = filteredUsers.filter(user => user.roles && user.roles.length > 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Usuários</h2>
        <p className="text-muted-foreground">
          Gerenciar perfis de usuários da plataforma
        </p>
      </div>

      <UserSearchBar
        filters={filters}
        onFiltersChange={setFilters}
        activeFiltersCount={activeFiltersCount}
      />

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
            <UsersIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
            {activeFiltersCount > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                {filteredUsers.length} filtrado{filteredUsers.length !== 1 ? 's' : ''}
              </p>
            )}
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
            <div className="text-2xl font-bold">
              {tenantProfessionals ?? profissionais.length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {tenantFilter ? 'Vinculados ao tenant' : 'Total na plataforma'}
            </p>
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
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Gestão de Usuários</CardTitle>
            <div className="flex items-center gap-3">
              {activeFiltersCount > 0 && (
                <span className="text-sm text-muted-foreground">
                  Exibindo {filteredUsers.length} de {users.length} usuários
                </span>
              )}
              <UserManagementModal onUserCreated={fetchUsers} />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredUsers.length === 0 ? (
              <div className="text-center py-12">
                <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-medium">Nenhum usuário encontrado</p>
                <p className="text-sm text-muted-foreground">
                  Tente ajustar os filtros ou termos de pesquisa
                </p>
              </div>
            ) : (
              filteredUsers.map((user) => (
              <div
                key={user.id}
                className="flex items-start justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors gap-4"
              >
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 flex-wrap">
                        <p className="font-medium">{user.nome}</p>
                        {user.tipo_usuario === 'paciente' && (
                          <Badge variant="secondary" className="flex items-center gap-1 text-xs">
                            <Heart className="h-3 w-3" />
                            Paciente
                          </Badge>
                        )}
                        {user.tipo_usuario === 'profissional' && (
                          <Badge variant="default" className="flex items-center gap-1 text-xs">
                            <Stethoscope className="h-3 w-3" />
                            Profissional
                          </Badge>
                        )}
                        {user.tipo_usuario === 'admin' && (
                          <Badge variant="destructive" className="text-xs">Administrador</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                      <Building2 className="h-3 w-3" />
                      Instituições:
                    </span>
                    <div className="flex gap-1 flex-wrap">
                      {!user.institutionLinks || user.institutionLinks.length === 0 ? (
                        <Badge variant="outline" className="text-xs">Nenhuma</Badge>
                      ) : (
                        <>
                          {user.institutionLinks.slice(0, 2).map((link, idx) => (
                            <Badge
                              key={idx}
                              variant={
                                link.type === 'admin' ? 'default' :
                                link.type === 'patient' ? 'secondary' :
                                'outline'
                              }
                              className="text-xs"
                            >
                              {link.name}
                            </Badge>
                          ))}
                          {user.institutionLinks.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{user.institutionLinks.length - 2} mais
                            </Badge>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm text-muted-foreground">Roles Admin:</span>
                    <div className="flex gap-1 flex-wrap">
                      {getRolesBadges(user.roles || [])}
                    </div>
                  </div>

                  <div className="flex gap-4 text-sm text-muted-foreground flex-wrap">
                    <span>Cadastrado em {new Date(user.created_at).toLocaleDateString('pt-BR')}</span>
                    {user.data_nascimento && (
                      <span>Nascimento: {new Date(user.data_nascimento).toLocaleDateString('pt-BR')}</span>
                    )}
                  </div>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2">
                      <MoreVertical className="h-4 w-4" />
                      Ações
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>Ações do Usuário</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    
                    <DropdownMenuItem 
                      onClick={() => resendEmailConfirmation(user.email)} 
                      disabled={emailLoading}
                    >
                      <Mail className="h-4 w-4 mr-2" />
                      Reenviar Confirmação
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem 
                      onClick={() => resendPasswordReset(user.email)} 
                      disabled={emailLoading}
                    >
                      <KeyRound className="h-4 w-4 mr-2" />
                      Reset Senha
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem onClick={() => handleRoleManagement(user.user_id || '', user.nome)}>
                      <Settings className="h-4 w-4 mr-2" />
                      Gerenciar Roles
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem onClick={() => handleTypeManagement(user.user_id || '', user.nome, user.tipo_usuario)}>
                      <User className="h-4 w-4 mr-2" />
                      Gerenciar Tipo
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem onClick={() => handleManageInstitutions(user)}>
                      <Building2 className="h-4 w-4 mr-2" />
                      Gerenciar Instituições
                    </DropdownMenuItem>
                    
                    <DropdownMenuSeparator />
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <DropdownMenuItem
                          onSelect={(e) => {
                            e.preventDefault();
                            fetchDeletionInfo(user);
                          }}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Deletar Usuário
                        </DropdownMenuItem>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Confirmar Deleção</AlertDialogTitle>
                          <AlertDialogDescription className="space-y-2">
                            <p>Você está prestes a deletar <strong>{user.nome}</strong> ({user.email}).</p>
                            
                            {deletionInfo && (
                              <>
                                {deletionInfo.appointmentsCount > 0 && (
                                  <div className="p-3 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-md">
                                    <div className="flex items-start gap-2">
                                      <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5" />
                                      <div className="text-sm text-amber-800 dark:text-amber-200">
                                        <p className="font-semibold">Atenção: Agendamentos Ativos</p>
                                        <p>Este usuário possui <strong>{deletionInfo.appointmentsCount}</strong> agendamento(s) ativo(s). Todos serão cancelados automaticamente.</p>
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {(deletionInfo.isProfessional || deletionInfo.isPatient) && (
                                  <div className="p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-md">
                                    <div className="text-sm text-blue-800 dark:text-blue-200">
                                      <p className="font-semibold">Perfil Associado:</p>
                                      <p>
                                        {deletionInfo.isProfessional && 'Perfil de profissional será deletado.'}
                                        {deletionInfo.isPatient && 'Perfil de paciente será deletado.'}
                                      </p>
                                    </div>
                                  </div>
                                )}
                              </>
                            )}
                            
                            <p className="text-destructive font-medium mt-3">Esta ação não pode ser desfeita!</p>
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteUser(user.user_id || null, user.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Confirmar Deleção
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))
            )}
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

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-destructive">⚠️ Limpeza de Perfis de Teste</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-4">
              Deleta perfis que não têm user_id associado (órfãos criados por testes ou erros de registro).
            </p>
            <Button
              variant="destructive"
              onClick={async () => {
                if (confirm('Tem certeza que deseja deletar TODOS os perfis de teste órfãos? Esta ação não pode ser desfeita!')) {
                  const result = await cleanupOrphanProfiles('test-%@test.com');
                  if (result.success) {
                    toast({
                      title: "Perfis deletados",
                      description: `${result.data?.deletedCount || 0} perfis de teste órfãos foram removidos.`,
                    });
                    fetchUsers();
                  }
                }
              }}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Limpar Perfis de Teste Órfãos
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Modal de Gerenciamento de Instituições */}
      {selectedUserForInstitutions && (
        <UserInstitutionsManager
          user={{
            id: selectedUserForInstitutions.id,
            userId: selectedUserForInstitutions.user_id || '',
            nome: selectedUserForInstitutions.nome,
            email: selectedUserForInstitutions.email,
            tipo_usuario: selectedUserForInstitutions.tipo_usuario,
          }}
          isOpen={institutionsModalOpen}
          onClose={() => {
            setInstitutionsModalOpen(false);
            setSelectedUserForInstitutions(null);
            fetchUsers(); // Refresh para atualizar badges
          }}
        />
      )}
    </div>
  );
}