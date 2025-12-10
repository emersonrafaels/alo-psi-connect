import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, X, Search, Shield, User, Stethoscope, Info, RefreshCw, Eye, EyeOff } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { useUserManagement } from '@/hooks/useUserManagement';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useInstitutionAudit } from '@/hooks/useInstitutionAudit';

interface Props {
  institution: { id: string; name: string } | null;
  isOpen: boolean;
  onClose: () => void;
  tenantId?: string | null;
}

export function ManageInstitutionAdminUsersModal({ institution, isOpen, onClose, tenantId }: Props) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { createInstitutionalUser, loading: creatingUser } = useUserManagement();
  const { logAction } = useInstitutionAudit(institution?.id);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const [newUserRole, setNewUserRole] = useState<'admin' | 'viewer'>('admin');
  const [selectedTenantId, setSelectedTenantId] = useState<string>(tenantId || '');
  const [showPassword, setShowPassword] = useState(false);

  // Fetch tenants list
  const { data: tenants } = useQuery({
    queryKey: ['tenants-list-for-admin-creation'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tenants')
        .select('id, name, slug')
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      return data || [];
    },
    enabled: isOpen,
  });

  // Função para atualizar todas as listas
  const handleRefreshAll = () => {
    queryClient.invalidateQueries({ queryKey: ['institution-users', institution?.id] });
    queryClient.invalidateQueries({ queryKey: ['available-admin-users', institution?.id] });
    
    toast({
      title: '🔄 Listas atualizadas',
      description: 'Todos os dados foram recarregados.',
    });
  };

  // Buscar usuários vinculados à instituição (ativos e inativos)
  const { data: institutionUsers, isLoading: loadingUsers } = useQuery({
    queryKey: ['institution-users', institution?.id, tenantId],
    queryFn: async () => {
      if (!institution?.id) return [];
      
      let query = supabase
        .from('institution_users')
        .select(`
          id,
          user_id,
          role,
          is_active,
          profiles!institution_users_user_id_fkey(
            nome,
            email
          )
        `)
        .eq('institution_id', institution.id);
      
      if (tenantId) {
        query = query.eq('tenant_id', tenantId);
      }
      
      const { data, error } = await query
        .order('is_active', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!institution?.id && isOpen,
  });

  // Buscar usuários disponíveis para adicionar (apenas usuários com roles administrativos)
  const { data: availableUsers, isLoading: loadingAvailableUsers } = useQuery({
    queryKey: ['available-admin-users', institution?.id, searchTerm, tenantId],
    queryFn: async () => {
      if (!institution?.id) return [];

      // Primeiro, buscar todos os user_ids que têm roles administrativos
      const { data: userRolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) throw rolesError;

      const adminUserIds = userRolesData?.map(ur => ur.user_id) || [];
      
      if (adminUserIds.length === 0) return [];

      // Buscar TODOS os user_ids vinculados (ativos e inativos) para excluir, filtrando por tenant se fornecido
      let linkedUsersQuery = supabase
        .from('institution_users')
        .select('user_id')
        .eq('institution_id', institution.id);
      
      if (tenantId) {
        linkedUsersQuery = linkedUsersQuery.eq('tenant_id', tenantId);
      }
      
      const { data: allLinkedUsers, error: linkedError } = await linkedUsersQuery;

      if (linkedError) throw linkedError;

      const excludedUserIds = allLinkedUsers?.map(u => u.user_id) || [];
      const filteredAdminIds = adminUserIds.filter(id => !excludedUserIds.includes(id));

      if (filteredAdminIds.length === 0) return [];

      // Construir query base
      let query = supabase
        .from('profiles')
        .select('id, user_id, nome, email, tipo_usuario')
        .in('user_id', filteredAdminIds);

      // Aplicar filtro de busca apenas se houver searchTerm
      if (searchTerm && searchTerm.trim().length > 0) {
        query = query.ilike('nome', `%${searchTerm}%`);
      }

      // Executar query com limite
      const { data: profilesData, error: profilesError } = await query.limit(20);

      if (profilesError) throw profilesError;

      // Combinar dados de profiles com roles
      return profilesData?.map(profile => {
        const userRole = userRolesData?.find(ur => ur.user_id === profile.user_id);
        return {
          ...profile,
          role: userRole?.role || 'admin'
        };
      }) || [];
    },
    enabled: !!institution?.id && isOpen,
  });

  // Mutation para adicionar usuário existente
  const addUserMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: 'admin' | 'viewer' }) => {
      const { data: insertData, error } = await supabase
        .from('institution_users')
        .insert({
          institution_id: institution!.id,
          user_id: userId,
          role,
          is_active: true,
          tenant_id: tenantId,
        })
        .select()
        .single();

      if (error) throw error;

      // Buscar dados do usuário para enviar email
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('email, nome')
        .eq('user_id', userId)
        .single();

      // Enviar notificação com dados corretos usando tenantId prop
      if (userProfile) {
        try {
          await supabase.functions.invoke('notify-institution-link', {
            body: {
              userEmail: userProfile.email,
              userName: userProfile.nome,
              institutionName: institution!.name,
              role: role,
              tenantId: tenantId || null,
            }
          });
          console.log('📧 Email de notificação enviado para', userProfile.email);
        } catch (emailError) {
          console.error('Erro ao enviar email:', emailError);
          // Não bloqueia o fluxo se o email falhar
        }
      }

      return { insertData, userId, role };
    },
    onSuccess: async (data) => {
      queryClient.invalidateQueries({ queryKey: ['institution-users', institution?.id] });
      queryClient.invalidateQueries({ queryKey: ['available-admin-users', institution?.id] });
      
      // Log da ação de adição
      await logAction({
        action_type: 'link_admin',
        entity_type: 'admin_user',
        entity_id: data.insertData.id,
        metadata: {
          user_id: data.userId,
          role: data.role,
        },
      });
      
      setSearchTerm('');
      toast({
        title: 'Usuário adicionado',
        description: 'O usuário foi adicionado à instituição com sucesso.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao adicionar usuário',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Mutation para criar novo usuário
  const createUserMutation = useMutation({
    mutationFn: async () => {
      if (!institution) return;

      const result = await createInstitutionalUser({
        email: newUserEmail,
        password: newUserPassword,
        nome: newUserName,
        institutionId: institution.id,
        institutionRole: newUserRole,
        tenantId: selectedTenantId || tenantId || undefined,
      });

      return { email: newUserEmail, nome: newUserName, role: newUserRole, password: newUserPassword };
    },
    onSuccess: async (data) => {
      queryClient.invalidateQueries({ queryKey: ['institution-users'] });
      
      // Log da ação de criação
      if (data) {
        await logAction({
          action_type: 'create_admin',
          entity_type: 'admin_user',
          metadata: {
            email: data.email,
            nome: data.nome,
            role: data.role,
          },
        });

        // Enviar email de notificação usando selectedTenantId ou tenantId prop
        try {
          await supabase.functions.invoke('notify-institution-link', {
            body: {
              userEmail: data.email,
              userName: data.nome,
              institutionName: institution!.name,
              role: data.role,
              tenantId: selectedTenantId || tenantId || null,
              isNewUser: true,
              temporaryPassword: data.password,
            }
          });
          console.log('📧 Email de notificação enviado para', data.email);
        } catch (emailError) {
          console.error('Erro ao enviar email:', emailError);
          // Não bloqueia o fluxo se o email falhar
        }
      }
      
      setNewUserEmail('');
      setNewUserPassword('');
      setNewUserName('');
      setNewUserRole('admin');
      toast({
        title: 'Usuário criado',
        description: 'O novo usuário foi criado e vinculado à instituição.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao criar usuário',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Mutation para remover usuário (desativar)
  const removeUserMutation = useMutation({
    mutationFn: async (linkId: string) => {
      // Buscar dados antes de remover
      const { data: linkData } = await supabase
        .from('institution_users')
        .select('user_id, role, profiles!institution_users_user_id_fkey(nome, email)')
        .eq('id', linkId)
        .single();

      const { error } = await supabase
        .from('institution_users')
        .update({ is_active: false })
        .eq('id', linkId);

      if (error) throw error;
      
      return { linkId, linkData };
    },
    onSuccess: async (data) => {
      queryClient.invalidateQueries({ queryKey: ['institution-users', institution?.id] });
      queryClient.invalidateQueries({ queryKey: ['available-admin-users', institution?.id] });
      
      // Log da ação de remoção
      await logAction({
        action_type: 'unlink_admin',
        entity_type: 'admin_user',
        entity_id: data.linkId,
        metadata: {
          user_id: data.linkData?.user_id,
          role: data.linkData?.role,
          nome: data.linkData?.profiles?.nome,
          email: data.linkData?.profiles?.email,
        },
      });
      
      toast({
        title: 'Acesso removido',
        description: 'O acesso administrativo foi removido com sucesso.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao remover acesso',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Mutation para reativar usuário
  const reactivateUserMutation = useMutation({
    mutationFn: async (linkId: string) => {
      // Buscar dados antes de reativar
      const { data: linkData } = await supabase
        .from('institution_users')
        .select('user_id, role, profiles!institution_users_user_id_fkey(nome, email)')
        .eq('id', linkId)
        .single();

      const { error } = await supabase
        .from('institution_users')
        .update({ is_active: true })
        .eq('id', linkId);

      if (error) throw error;
      
      return { linkId, linkData };
    },
    onSuccess: async (data) => {
      queryClient.invalidateQueries({ queryKey: ['institution-users', institution?.id] });
      queryClient.invalidateQueries({ queryKey: ['available-admin-users', institution?.id] });
      
      // Log da ação de reativação
      await logAction({
        action_type: 'reactivate_admin',
        entity_type: 'admin_user',
        entity_id: data.linkId,
        metadata: {
          user_id: data.linkData?.user_id,
          role: data.linkData?.role,
          nome: data.linkData?.profiles?.nome,
          email: data.linkData?.profiles?.email,
        },
      });

      // Enviar email de notificação de reativação usando tenantId prop
      if (data.linkData?.profiles) {
        try {
          await supabase.functions.invoke('notify-institution-link', {
            body: {
              userEmail: data.linkData.profiles.email,
              userName: data.linkData.profiles.nome,
              institutionName: institution!.name,
              role: data.linkData.role,
              tenantId: tenantId || null,
            }
          });
          console.log('📧 Email de reativação enviado para', data.linkData.profiles.email);
        } catch (emailError) {
          console.error('Erro ao enviar email de reativação:', emailError);
          // Não bloqueia o fluxo se o email falhar
        }
      }
      
      toast({
        title: 'Acesso reativado',
        description: 'O acesso administrativo foi reativado com sucesso.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao reativar acesso',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  if (!institution) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between pr-12">
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Gerenciar Acesso Administrativo - {institution.name}
            </DialogTitle>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefreshAll}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Atualizar
            </Button>
          </div>
        </DialogHeader>

        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Usuários com acesso administrativo podem gerenciar a instituição no sistema.
            Este é diferente do vínculo institucional de pacientes e profissionais.
          </AlertDescription>
        </Alert>

        <Tabs defaultValue="manage" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="manage">Gerenciar Usuários</TabsTrigger>
            <TabsTrigger value="link">Vincular Usuários</TabsTrigger>
            <TabsTrigger value="create">Criar Novo</TabsTrigger>
          </TabsList>

          <TabsContent value="manage" className="overflow-auto space-y-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <h3 className="font-semibold">Usuários com Acesso Administrativo</h3>
                <Badge variant="secondary">{institutionUsers?.length || 0}</Badge>
              </div>
              
              <ScrollArea className="h-[300px] rounded-md border p-4">
                {loadingUsers ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : institutionUsers && institutionUsers.length > 0 ? (
                  <div className="space-y-2">
                    {institutionUsers.map((link: any) => (
                      <div 
                        key={link.id} 
                        className={`flex items-center justify-between p-3 rounded-lg border ${
                          !link.is_active ? 'bg-muted/50 opacity-70' : ''
                        }`}
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{link.profiles.nome}</p>
                            {!link.is_active && (
                              <Badge variant="outline" className="gap-1 text-muted-foreground">
                                Inativo
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{link.profiles.email}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Badge variant={link.role === 'admin' ? 'default' : 'secondary'} className="gap-1">
                                  <Shield className="h-3 w-3" />
                                  {link.role === 'admin' ? 'Admin' : 'Visualizador'}
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{link.role === 'admin' ? 'Administrador com acesso total' : 'Visualizador com acesso limitado'}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          
                          {link.is_active ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeUserMutation.mutate(link.id)}
                              disabled={removeUserMutation.isPending}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => reactivateUserMutation.mutate(link.id)}
                              disabled={reactivateUserMutation.isPending}
                            >
                              {reactivateUserMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                'Reativar'
                              )}
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    Nenhum usuário administrativo vinculado
                  </p>
                )}
              </ScrollArea>
            </div>
          </TabsContent>

          <TabsContent value="link" className="overflow-auto space-y-4">
            <div className="space-y-3">
              <h3 className="font-semibold">Adicionar Usuários Administrativos</h3>
              
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Filtrar usuários por nome (opcional)..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              <ScrollArea className="h-[300px] rounded-md border p-4">
                {loadingAvailableUsers ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : availableUsers && availableUsers.length > 0 ? (
                  <div className="space-y-2">
                    {availableUsers.map((user: any) => (
                      <div key={user.id} className="flex items-center justify-between p-3 rounded-lg border">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{user.nome}</p>
                            <Badge variant="outline" className="gap-1 capitalize">
                              <Shield className="h-3 w-3" />
                              {user.role === 'super_admin' ? 'Super Admin' : 
                               user.role === 'institution_admin' ? 'Admin Institucional' :
                               user.role === 'admin' ? 'Admin' :
                               user.role}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => addUserMutation.mutate({ userId: user.user_id, role: 'admin' })}
                          disabled={addUserMutation.isPending}
                        >
                          {addUserMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            'Adicionar'
                          )}
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : searchTerm.length > 2 ? (
                  <p className="text-center text-muted-foreground py-8">
                    Nenhum usuário encontrado
                  </p>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    Nenhum usuário administrativo disponível para vincular
                  </p>
                )}
              </ScrollArea>
            </div>
          </TabsContent>

          <TabsContent value="create" className="overflow-auto space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newUserName">Nome completo</Label>
                <Input
                  id="newUserName"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  placeholder="Nome do usuário"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="newUserEmail">Email</Label>
                <Input
                  id="newUserEmail"
                  type="email"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  placeholder="email@exemplo.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="newUserPassword">Senha</Label>
                <div className="relative">
                  <Input
                    id="newUserPassword"
                    type={showPassword ? "text" : "password"}
                    value={newUserPassword}
                    onChange={(e) => setNewUserPassword(e.target.value)}
                    placeholder="Senha segura"
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="newUserRole">Nível de acesso</Label>
                <Select value={newUserRole} onValueChange={(value: any) => setNewUserRole(value)}>
                  <SelectTrigger id="newUserRole">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin (acesso total)</SelectItem>
                    <SelectItem value="viewer">Visualizador (apenas visualização)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  <strong>Admin:</strong> Pode gerenciar usuários, cupons e profissionais da instituição. 
                  <strong className="ml-2">Visualizador:</strong> Pode apenas visualizar informações sem permissão de edição.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="newUserTenant">Tenant *</Label>
                <Select value={selectedTenantId} onValueChange={setSelectedTenantId}>
                  <SelectTrigger id="newUserTenant">
                    <SelectValue placeholder="Selecione o tenant" />
                  </SelectTrigger>
                  <SelectContent>
                    {tenants?.map((tenant) => (
                      <SelectItem key={tenant.id} value={tenant.id}>
                        {tenant.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  O tenant define em qual plataforma (Rede Bem Estar, Medcos, etc.) o usuário terá acesso.
                </p>
              </div>

              <Button
                onClick={() => createUserMutation.mutate()}
                disabled={!newUserEmail || !newUserPassword || !newUserName || !selectedTenantId || createUserMutation.isPending || creatingUser}
                className="w-full"
              >
                {createUserMutation.isPending || creatingUser ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Criando usuário...
                  </>
                ) : (
                  'Criar e Vincular Usuário'
                )}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
