import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Plus, Trash2, Search, UserPlus, Loader2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useUserManagement } from '@/hooks/useUserManagement';
import { useDebounce } from '@/hooks/useDebounce';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Props {
  institution: { id: string; name: string } | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ManageInstitutionUsersModal = ({ institution, isOpen, onClose }: Props) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { createInstitutionalUser, loading } = useUserManagement();
  
  const [activeTab, setActiveTab] = useState<'manage' | 'create'>('manage');
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 300);
  const [newUserData, setNewUserData] = useState({
    nome: '',
    email: '',
    password: '',
    institutionRole: 'viewer' as 'admin' | 'viewer'
  });

  if (!institution) return null;

  // Buscar usuários vinculados
  const { data: institutionUsers, isLoading: loadingLinked } = useQuery({
    queryKey: ['institution-users', institution.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('institution_users')
        .select(`
          id,
          user_id,
          role,
          is_active,
          profiles!inner(nome, email)
        `)
        .eq('institution_id', institution.id);

      if (error) throw error;
      return data;
    },
    enabled: !!institution,
  });

  // Buscar todos os usuários disponíveis (não vinculados)
  const { data: availableUsers, isLoading: loadingAvailable } = useQuery({
    queryKey: ['available-users', institution.id, debouncedSearch],
    queryFn: async () => {
      let query = supabase
        .from('profiles')
        .select('id, user_id, nome, email, tipo_usuario')
        .order('nome');
      
      if (debouncedSearch) {
        query = query.or(`nome.ilike.%${debouncedSearch}%,email.ilike.%${debouncedSearch}%`);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      
      // Filtrar usuários que já estão vinculados
      const linkedUserIds = institutionUsers?.map(u => u.user_id) || [];
      return data?.filter(u => !linkedUserIds.includes(u.user_id)) || [];
    },
    enabled: !!institution && activeTab === 'manage',
  });

  // Buscar tenant_id da instituição (opcional)
  const institutionData = { tenant_id: null };

  // Adicionar usuário existente
  const addUserMutation = useMutation({
    mutationFn: async ({ userId, userName, userEmail }: { userId: string; userName: string; userEmail: string }) => {
      // 1. Adicionar role institution_admin
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({ user_id: userId, role: 'institution_admin' });

      if (roleError && !roleError.message.includes('duplicate')) throw roleError;

      // 2. Vincular à instituição
      const { error: institutionError } = await supabase
        .from('institution_users')
        .insert({
          user_id: userId,
          institution_id: institution.id,
          role: 'admin',
        });

      if (institutionError) throw institutionError;

      // 3. Enviar email de notificação
      try {
        await supabase.functions.invoke('notify-institution-link', {
          body: {
            userEmail,
            userName,
            institutionName: institution.name,
            role: 'admin',
            tenantId: institutionData?.tenant_id,
          },
        });
      } catch (emailError) {
        console.error('Erro ao enviar email:', emailError);
        // Não falhar a operação se o email não enviar
      }

      return { userName, userEmail };
    },
    onSuccess: ({ userName }) => {
      queryClient.invalidateQueries({ queryKey: ['institution-users'] });
      queryClient.invalidateQueries({ queryKey: ['available-users'] });
      toast({ 
        title: 'Usuário adicionado com sucesso',
        description: `${userName} foi vinculado à instituição e receberá um email de notificação.`,
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

  // Criar novo usuário institucional
  const createUserMutation = useMutation({
    mutationFn: async () => {
      const result = await createInstitutionalUser({
        ...newUserData,
        institutionId: institution.id,
      });
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['institution-users'] });
      toast({ title: 'Usuário criado e vinculado com sucesso' });
      setActiveTab('manage');
      setNewUserData({
        nome: '',
        email: '',
        password: '',
        institutionRole: 'viewer'
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

  // Remover usuário
  const removeUserMutation = useMutation({
    mutationFn: async (institutionUserId: string) => {
      const { error } = await supabase
        .from('institution_users')
        .delete()
        .eq('id', institutionUserId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['institution-users'] });
      queryClient.invalidateQueries({ queryKey: ['available-users'] });
      toast({ title: 'Usuário removido com sucesso' });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao remover usuário',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Gerenciar Usuários - {institution.name}</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'manage' | 'create')} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="manage">Gerenciar Usuários</TabsTrigger>
            <TabsTrigger value="create">Criar Novo</TabsTrigger>
          </TabsList>

          {/* TAB: GERENCIAR USUÁRIOS */}
          <TabsContent value="manage" className="space-y-6">
            {/* SEÇÃO: Usuários Vinculados */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground">
                  Usuários Vinculados {institutionUsers && `(${institutionUsers.length})`}
                </h3>
              </div>

              {loadingLinked ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : !institutionUsers || institutionUsers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p className="text-sm">Nenhum usuário vinculado ainda</p>
                </div>
              ) : (
                <ScrollArea className="h-[200px] rounded-md border">
                  <div className="p-4 space-y-3">
                    {institutionUsers.map((user: any) => (
                      <div
                        key={user.id}
                        className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex-1">
                          <p className="font-medium text-sm">{user.profiles.nome}</p>
                          <p className="text-xs text-muted-foreground">{user.profiles.email}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                            {user.role === 'admin' ? 'Admin' : 'Visualizador'}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeUserMutation.mutate(user.id)}
                            disabled={removeUserMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </div>

            <Separator />

            {/* SEÇÃO: Adicionar Usuários Existentes */}
            <div className="space-y-3">
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-foreground">Adicionar Usuários Existentes</h3>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nome ou email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {loadingAvailable ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : !availableUsers || availableUsers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p className="text-sm">
                    {debouncedSearch 
                      ? 'Nenhum usuário encontrado com esse termo'
                      : 'Todos os usuários já estão vinculados'}
                  </p>
                </div>
              ) : (
                <ScrollArea className="h-[250px] rounded-md border">
                  <div className="p-4 space-y-2">
                    {availableUsers.map((user: any) => (
                      <div
                        key={user.id}
                        className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{user.nome}</p>
                          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {user.tipo_usuario || 'paciente'}
                          </Badge>
                          <Button
                            size="sm"
                            onClick={() => addUserMutation.mutate({
                              userId: user.user_id,
                              userName: user.nome,
                              userEmail: user.email
                            })}
                            disabled={addUserMutation.isPending}
                          >
                            {addUserMutation.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <UserPlus className="h-4 w-4 mr-1" />
                                Adicionar
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </div>
          </TabsContent>

          {/* TAB: CRIAR NOVO USUÁRIO */}
          <TabsContent value="create" className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome Completo</Label>
                <Input
                  id="nome"
                  value={newUserData.nome}
                  onChange={(e) => setNewUserData({ ...newUserData, nome: e.target.value })}
                  placeholder="Nome do usuário"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={newUserData.email}
                  onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
                  placeholder="email@exemplo.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  value={newUserData.password}
                  onChange={(e) => setNewUserData({ ...newUserData, password: e.target.value })}
                  placeholder="Mínimo 6 caracteres"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Função na Instituição</Label>
                <Select
                  value={newUserData.institutionRole}
                  onValueChange={(value: 'admin' | 'viewer') =>
                    setNewUserData({ ...newUserData, institutionRole: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Administrador</SelectItem>
                    <SelectItem value="viewer">Visualizador</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={() => createUserMutation.mutate()}
                disabled={loading || createUserMutation.isPending || !newUserData.nome || !newUserData.email || !newUserData.password}
                className="w-full"
              >
                {(loading || createUserMutation.isPending) ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Criando...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Criar e Vincular Usuário
                  </>
                )}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
