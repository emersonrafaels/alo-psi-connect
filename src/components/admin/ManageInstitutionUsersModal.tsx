import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Trash2, Search, Loader2, User, Stethoscope, Info, Users } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useDebounce } from '@/hooks/useDebounce';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Props {
  institution: { id: string; name: string } | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ManageInstitutionUsersModal = ({ institution, isOpen, onClose }: Props) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [activeTab, setActiveTab] = useState<'patients' | 'professionals' | 'add'>('patients');
  const [searchTerm, setSearchTerm] = useState('');
  const [userTypeFilter, setUserTypeFilter] = useState<'all' | 'paciente' | 'profissional'>('all');
  const debouncedSearch = useDebounce(searchTerm, 300);

  // Função helper para traduzir tipos de relacionamento
  const getRelationshipTypeLabel = (type: string): string => {
    const labels: Record<string, string> = {
      'employee': 'Funcionário',
      'partner': 'Parceiro',
      'supervisor': 'Supervisor'
    };
    return labels[type] || type;
  };

  // Invalidar cache quando o modal abrir
  useEffect(() => {
    if (isOpen && institution) {
      console.log('[ManageInstitutionUsersModal] Modal opened, invalidating cache for institution:', institution.id);
      queryClient.invalidateQueries({ queryKey: ['institution-patients', institution.id] });
      queryClient.invalidateQueries({ queryKey: ['institution-professionals', institution.id] });
    }
  }, [isOpen, institution?.id, queryClient]);

  // Buscar pacientes vinculados
  const { data: linkedPatients, isLoading: loadingPatients, error: patientsError } = useQuery({
    queryKey: ['institution-patients', institution?.id],
    queryFn: async () => {
      if (!institution) return [];
      
      console.log('[ManageInstitutionUsersModal] Fetching linked patients for institution:', institution.id);
      
      // Buscar super admins para excluir
      const { data: superAdmins } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'super_admin');
      
      const superAdminIds = superAdmins?.map(sa => sa.user_id) || [];
      
      const { data, error } = await supabase
        .from('patient_institutions')
        .select(`
          id,
          patient_id,
          created_at,
          enrollment_date,
          pacientes!inner(
            id,
            profile_id,
            profiles!inner(nome, email, user_id, tipo_usuario)
          )
        `)
        .eq('institution_id', institution.id);
      
      if (error) {
        console.error('[ManageInstitutionUsersModal] Error fetching patients:', {
          error,
          message: error.message,
          code: error.code,
          hint: error.hint,
          institutionId: institution.id
        });
        throw error;
      }
      
      console.log('[ManageInstitutionUsersModal] Successfully fetched patients:', {
        count: data?.length || 0,
        institutionId: institution.id,
        sampleData: data?.[0],
        sampleCreatedAt: data?.[0]?.created_at,
        sampleCreatedAtType: typeof data?.[0]?.created_at,
      });
      
      // Filtrar super admins e usuários com tipo_usuario = 'admin'
      return data?.filter(p => 
        !superAdminIds.includes(p.pacientes.profiles.user_id) &&
        p.pacientes.profiles.tipo_usuario !== 'admin'
      ) || [];
    },
    enabled: !!institution,
    retry: 1,
  });

  // Buscar profissionais vinculados
  const { data: linkedProfessionals, isLoading: loadingProfessionals, error: professionalsError } = useQuery({
    queryKey: ['institution-professionals', institution?.id],
    queryFn: async () => {
      if (!institution) return [];
      
      console.log('[ManageInstitutionUsersModal] Fetching linked professionals for institution:', institution.id);
      
      // Buscar super admins para excluir
      const { data: superAdmins } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'super_admin');
      
      const superAdminIds = superAdmins?.map(sa => sa.user_id) || [];
      
      const { data, error } = await supabase
        .from('professional_institutions')
        .select(`
          id,
          professional_id,
          relationship_type,
          created_at,
          profissionais!inner(
            id,
            profile_id,
            profissao,
            profiles!inner(nome, email, user_id, tipo_usuario)
          )
        `)
        .eq('institution_id', institution.id);
      
      if (error) {
        console.error('[ManageInstitutionUsersModal] Error fetching professionals:', {
          error,
          message: error.message,
          code: error.code,
          hint: error.hint,
          institutionId: institution.id
        });
        throw error;
      }
      
      console.log('[ManageInstitutionUsersModal] Raw professional data:', {
        count: data?.length || 0,
        institutionId: institution.id,
        fullSampleData: JSON.stringify(data?.[0], null, 2),
        sampleCreatedAt: data?.[0]?.created_at,
        sampleCreatedAtType: typeof data?.[0]?.created_at,
      });
      
      // Filtrar super admins e usuários com tipo_usuario = 'admin'
      const filtered = data?.filter(p => 
        !superAdminIds.includes(p.profissionais.profiles.user_id) &&
        p.profissionais.profiles.tipo_usuario !== 'admin'
      ) || [];
      
      console.log('[ManageInstitutionUsersModal] Filtered professional data:', {
        count: filtered.length,
        sampleFiltered: JSON.stringify(filtered[0], null, 2),
      });
      
      return filtered;
    },
    enabled: !!institution,
    retry: 1,
  });

  // Buscar todos os usuários disponíveis (não vinculados)
  const { data: availableUsers, isLoading: loadingAvailable } = useQuery({
    queryKey: ['available-users', institution?.id, debouncedSearch, userTypeFilter],
    queryFn: async () => {
      if (!institution) return [];
      
      // Buscar super admins para excluir
      const { data: superAdmins } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'super_admin');
      
      const superAdminIds = superAdmins?.map(sa => sa.user_id) || [];
      
      let query = supabase
        .from('profiles')
        .select('id, user_id, nome, email, tipo_usuario')
        .neq('tipo_usuario', 'admin') // Não mostrar admins do sistema
        .order('nome');
      
      if (superAdminIds.length > 0) {
        query = query.not('user_id', 'in', `(${superAdminIds.join(',')})`);
      }
      
      if (debouncedSearch) {
        query = query.or(`nome.ilike.%${debouncedSearch}%,email.ilike.%${debouncedSearch}%`);
      }
      
      if (userTypeFilter !== 'all') {
        query = query.eq('tipo_usuario', userTypeFilter);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      
      // Filtrar usuários que já estão vinculados como PACIENTES ou PROFISSIONAIS
      const linkedPatientUserIds = linkedPatients?.map(p => p.pacientes.profiles.user_id) || [];
      const linkedProfessionalUserIds = linkedProfessionals?.map(p => p.profissionais.profiles.user_id) || [];
      const allLinkedUserIds = [...linkedPatientUserIds, ...linkedProfessionalUserIds];
      
      return data?.filter(u => !allLinkedUserIds.includes(u.user_id)) || [];
    },
    enabled: !!institution && activeTab === 'add',
  });

  // Mutation para remover paciente
  const removePatientMutation = useMutation({
    mutationFn: async (linkId: string) => {
      const { error } = await supabase
        .from('patient_institutions')
        .delete()
        .eq('id', linkId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['institution-patients'] });
      queryClient.invalidateQueries({ queryKey: ['available-users'] });
      toast({ title: 'Paciente removido', description: 'Vínculo desativado com sucesso.' });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao remover paciente',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Mutation para remover profissional
  const removeProfessionalMutation = useMutation({
    mutationFn: async (linkId: string) => {
      const { error } = await supabase
        .from('professional_institutions')
        .delete()
        .eq('id', linkId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['institution-professionals'] });
      queryClient.invalidateQueries({ queryKey: ['available-users'] });
      toast({ title: 'Profissional removido', description: 'Vínculo removido com sucesso.' });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao remover profissional',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Mutation para adicionar vínculo
  const addUserLinkMutation = useMutation({
    mutationFn: async ({ profileId, userType }: { profileId: string; userType: 'paciente' | 'profissional' }) => {
      if (!institution) throw new Error('Instituição não selecionada');
      
      const { data: result, error } = await supabase.functions.invoke('link-user-to-institution', {
        body: {
          institutionId: institution.id,
          profileId: profileId,
          userType: userType
        }
      });
      
      if (error) throw error;
      if (!result?.success) throw new Error(result?.error || 'Erro ao vincular usuário');
      
      return result;
    },
    onSuccess: (result, variables) => {
      // Invalidar queries para forçar atualização
      if (variables.userType === 'paciente') {
        queryClient.invalidateQueries({ queryKey: ['institution-patients', institution?.id] });
      } else {
        queryClient.invalidateQueries({ queryKey: ['institution-professionals', institution?.id] });
      }
      queryClient.invalidateQueries({ queryKey: ['available-users', institution?.id] });
      
      // Mensagem apropriada
      if (result.alreadyLinked) {
        toast({ 
          title: 'Usuário já vinculado', 
          description: 'Este usuário já está vinculado a esta instituição.' 
        });
      } else {
        toast({ 
          title: 'Vínculo criado', 
          description: 'Usuário vinculado com sucesso.' 
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao criar vínculo',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Early return após TODOS os hooks serem declarados
  if (!institution) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Gerenciar Vínculos - {institution.name}
          </DialogTitle>
        </DialogHeader>
        
        <Alert className="mb-4">
          <Info className="h-4 w-4" />
          <AlertDescription>
            Vincule pacientes e profissionais à sua instituição. 
            Este vínculo permite que eles sejam associados à instituição no sistema.
          </AlertDescription>
        </Alert>

        {/* Error alerts with suggestions */}
        {(patientsError || professionalsError) && (
          <Alert variant="destructive" className="mb-4">
            <Info className="h-4 w-4" />
            <AlertDescription className="space-y-2">
              <p className="font-semibold">Erro ao carregar dados:</p>
              {patientsError && (
                <p className="text-sm">
                  Pacientes: {patientsError.message}
                  {(patientsError as any).code === 'PGRST116' && ' (Possível problema de permissões RLS)'}
                </p>
              )}
              {professionalsError && (
                <p className="text-sm">
                  Profissionais: {professionalsError.message}
                  {(professionalsError as any).code === 'PGRST116' && ' (Possível problema de permissões RLS)'}
                </p>
              )}
              <div className="flex gap-2 mt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    queryClient.invalidateQueries({ queryKey: ['institution-patients'] });
                    queryClient.invalidateQueries({ queryKey: ['institution-professionals'] });
                    toast({
                      title: 'Dados atualizados',
                      description: 'As consultas foram recarregadas.',
                    });
                  }}
                >
                  Tentar Novamente
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    toast({
                      title: 'Ação necessária',
                      description: 'Por favor, faça logout e login novamente para atualizar suas permissões.',
                      duration: 5000,
                    });
                  }}
                >
                  Preciso fazer Logout/Login?
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'patients' | 'professionals' | 'add')} className="w-full flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="patients">Pacientes</TabsTrigger>
            <TabsTrigger value="professionals">Profissionais</TabsTrigger>
            <TabsTrigger value="add">Adicionar Vínculo</TabsTrigger>
          </TabsList>

          {/* Tab: Pacientes */}
          <TabsContent value="patients" className="flex-1 space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <User className="h-4 w-4 text-primary" />
                  Pacientes Vinculados {linkedPatients && `(${linkedPatients.length})`}
                </h3>
              </div>

              {loadingPatients ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : !linkedPatients || linkedPatients.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p className="text-sm">Nenhum paciente vinculado</p>
                </div>
              ) : (
                <ScrollArea className="h-[400px] rounded-md border">
                  <div className="p-4 space-y-3">
                    {linkedPatients.map((link) => (
                      <div key={link.id} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{link.pacientes.profiles.nome}</p>
                          <p className="text-xs text-muted-foreground">{link.pacientes.profiles.email}</p>
                          <p className="text-xs text-muted-foreground">
                            Vinculado em: {
                              link.created_at 
                                ? new Date(link.created_at).toLocaleDateString('pt-BR')
                                : 'Data não disponível'
                            }
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removePatientMutation.mutate(link.id)}
                          disabled={removePatientMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </div>
          </TabsContent>

          {/* Tab: Profissionais */}
          <TabsContent value="professionals" className="flex-1 space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <Stethoscope className="h-4 w-4 text-primary" />
                  Profissionais Vinculados {linkedProfessionals && `(${linkedProfessionals.length})`}
                </h3>
              </div>

              {loadingProfessionals ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : !linkedProfessionals || linkedProfessionals.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p className="text-sm">Nenhum profissional vinculado</p>
                </div>
              ) : (
                <ScrollArea className="h-[400px] rounded-md border">
                  <div className="p-4 space-y-3">
                    {linkedProfessionals.map((link) => (
                      <div key={link.id} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{link.profissionais.profiles.nome}</p>
                          <p className="text-xs text-muted-foreground">{link.profissionais.profiles.email}</p>
                          <p className="text-xs text-muted-foreground">
                            Vinculado em: {
                              link.created_at 
                                ? new Date(link.created_at).toLocaleDateString('pt-BR')
                                : 'Data não disponível'
                            }
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">{link.profissionais.profissao}</Badge>
                            <Badge variant="secondary" className="text-xs">{getRelationshipTypeLabel(link.relationship_type)}</Badge>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeProfessionalMutation.mutate(link.id)}
                          disabled={removeProfessionalMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </div>
          </TabsContent>

          {/* Tab: Adicionar Vínculo */}
          <TabsContent value="add" className="flex-1 space-y-4">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <Label htmlFor="search">Buscar usuário</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="search"
                      placeholder="Buscar por nome ou email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="w-48">
                  <Label htmlFor="type-filter">Tipo</Label>
                  <Select value={userTypeFilter} onValueChange={(v: any) => setUserTypeFilter(v)}>
                    <SelectTrigger id="type-filter">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="paciente">Pacientes</SelectItem>
                      <SelectItem value="profissional">Profissionais</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />
                  Usuários Disponíveis
                </h3>

                {loadingAvailable ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : !availableUsers || availableUsers.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p className="text-sm">Nenhum usuário disponível</p>
                    <p className="text-xs mt-1">Todos os usuários já estão vinculados ou não há usuários cadastrados</p>
                  </div>
                ) : (
                  <ScrollArea className="h-[400px] rounded-md border">
                    <div className="p-4 space-y-3">
                      {availableUsers.map((user) => (
                        <div key={user.id} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                          <div className="flex-1">
                            <p className="font-medium text-sm">{user.nome}</p>
                            <p className="text-xs text-muted-foreground">{user.email}</p>
                            <Badge variant="outline" className="text-xs mt-1">
                              {user.tipo_usuario === 'paciente' ? 'Paciente' : 'Profissional'}
                            </Badge>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => addUserLinkMutation.mutate({
                              profileId: user.id,
                              userType: user.tipo_usuario as 'paciente' | 'profissional'
                            })}
                            disabled={addUserLinkMutation.isPending}
                          >
                            Vincular
                          </Button>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
