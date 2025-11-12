import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Mail } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useUserManagement } from '@/hooks/useUserManagement';

interface Props {
  institution: { id: string; name: string } | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ManageInstitutionUsersModal = ({ institution, isOpen, onClose }: Props) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { createInstitutionalUser, loading } = useUserManagement();
  
  const [newUserEmail, setNewUserEmail] = useState('');
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newUserData, setNewUserData] = useState({
    nome: '',
    email: '',
    password: '',
    institutionRole: 'viewer' as 'admin' | 'viewer'
  });

  // Buscar usuários vinculados
  const { data: institutionUsers } = useQuery({
    queryKey: ['institution-users', institution?.id],
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
        .eq('institution_id', institution!.id);

      if (error) throw error;
      return data;
    },
    enabled: !!institution,
  });

  // Adicionar usuário
  const addUserMutation = useMutation({
    mutationFn: async (email: string) => {
      // 1. Buscar user_id pelo email
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('email', email)
        .single();

      if (profileError) throw new Error('Usuário não encontrado');

      // 2. Adicionar role institution_admin
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({ user_id: profile.user_id, role: 'institution_admin' });

      if (roleError && !roleError.message.includes('duplicate')) throw roleError;

      // 3. Vincular à instituição
      const { error: institutionError } = await supabase
        .from('institution_users')
        .insert({
          user_id: profile.user_id,
          institution_id: institution!.id,
          role: 'admin',
        });

      if (institutionError) throw institutionError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['institution-users'] });
      toast({ title: 'Usuário adicionado com sucesso' });
      setNewUserEmail('');
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
        institutionId: institution!.id,
      });
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['institution-users'] });
      toast({ title: 'Usuário criado e vinculado com sucesso' });
      setIsCreatingNew(false);
      setNewUserData({ nome: '', email: '', password: '', institutionRole: 'viewer' });
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
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('institution_users')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['institution-users'] });
      toast({ title: 'Usuário removido' });
    },
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            Gerenciar Usuários - {institution?.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Toggle entre adicionar existente e criar novo */}
          <div className="flex gap-2 border-b pb-2">
            <Button
              variant={!isCreatingNew ? 'default' : 'outline'}
              size="sm"
              onClick={() => setIsCreatingNew(false)}
            >
              Adicionar Usuário Existente
            </Button>
            <Button
              variant={isCreatingNew ? 'default' : 'outline'}
              size="sm"
              onClick={() => setIsCreatingNew(true)}
            >
              Criar Novo Usuário
            </Button>
          </div>

          {/* Formulário condicional */}
          {!isCreatingNew ? (
            // Formulário atual (adicionar por email)
            <div className="flex gap-2">
              <Input
                placeholder="Email do usuário..."
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
              />
              <Button
                onClick={() => addUserMutation.mutate(newUserEmail)}
                disabled={!newUserEmail || addUserMutation.isPending}
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar
              </Button>
            </div>
          ) : (
            // NOVO: Formulário de criação
            <div className="space-y-3 border p-4 rounded-lg bg-muted/30">
              <div>
                <Label htmlFor="nome">Nome Completo</Label>
                <Input
                  id="nome"
                  placeholder="Ex: João Silva"
                  value={newUserData.nome}
                  onChange={(e) => setNewUserData(prev => ({ ...prev, nome: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="joao@instituicao.edu.br"
                  value={newUserData.email}
                  onChange={(e) => setNewUserData(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Mínimo 8 caracteres"
                  value={newUserData.password}
                  onChange={(e) => setNewUserData(prev => ({ ...prev, password: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="role">Nível de Acesso</Label>
                <Select 
                  value={newUserData.institutionRole} 
                  onValueChange={(value: 'admin' | 'viewer') => 
                    setNewUserData(prev => ({ ...prev, institutionRole: value }))
                  }
                >
                  <SelectTrigger id="role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="viewer">Visualizador</SelectItem>
                    <SelectItem value="admin">Administrador</SelectItem>
                  </SelectContent>
                </Select>
                <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                  <p><strong>Visualizador:</strong> Pode apenas visualizar profissionais e alunos vinculados à instituição. Acesso somente leitura.</p>
                  <p><strong>Administrador:</strong> Pode visualizar dados e gerenciar cupons promocionais da instituição (criar, editar, desativar).</p>
                </div>
              </div>
              <Button 
                onClick={() => createUserMutation.mutate()}
                disabled={
                  createUserMutation.isPending || 
                  loading ||
                  !newUserData.nome || 
                  !newUserData.email || 
                  !newUserData.password ||
                  newUserData.password.length < 8
                }
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                {createUserMutation.isPending || loading ? 'Criando...' : 'Criar e Vincular Usuário'}
              </Button>
            </div>
          )}

          {/* Lista de usuários */}
          <div className="space-y-2">
            {institutionUsers?.map((user: any) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{user.profiles.nome}</p>
                    <p className="text-sm text-muted-foreground">{user.profiles.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge 
                    variant={user.role === 'admin' ? 'default' : 'secondary'}
                    className={user.role === 'admin' ? 'bg-primary' : 'bg-muted'}
                  >
                    {user.role === 'admin' ? 'Administrador' : 'Visualizador'}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeUserMutation.mutate(user.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {(!institutionUsers || institutionUsers.length === 0) && (
            <p className="text-center text-muted-foreground py-4">
              Nenhum usuário vinculado a esta instituição
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
