import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Mail } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Props {
  institution: { id: string; name: string } | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ManageInstitutionUsersModal = ({ institution, isOpen, onClose }: Props) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newUserEmail, setNewUserEmail] = useState('');

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
          {/* Adicionar novo usuário */}
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
                  <Badge>{user.role}</Badge>
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
