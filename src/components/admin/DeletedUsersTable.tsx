import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Trash2 } from 'lucide-react';

interface DeletedUser {
  id: string;
  original_user_id: string;
  email: string;
  nome: string;
  tipo_usuario: string;
  deleted_at: string;
  deletion_reason: string;
  user_data: any;
}

export const DeletedUsersTable = () => {
  const [deletedUsers, setDeletedUsers] = useState<DeletedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchDeletedUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('deleted_users')
        .select('*')
        .order('deleted_at', { ascending: false });

      if (error) {
        throw error;
      }

      setDeletedUsers(data || []);
    } catch (error: any) {
      console.error('Error fetching deleted users:', error);
      toast({
        title: "Erro ao carregar usuários deletados",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeletedUsers();
  }, []);

  const getUserTypeBadge = (tipo: string) => {
    const variants = {
      paciente: "secondary",
      profissional: "default",
      admin: "destructive"
    } as const;

    return (
      <Badge variant={variants[tipo as keyof typeof variants] || "outline"}>
        {tipo === 'paciente' ? 'Paciente' : 
         tipo === 'profissional' ? 'Profissional' : 
         tipo === 'admin' ? 'Admin' : tipo}
      </Badge>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trash2 className="h-5 w-5" />
            Usuários Deletados
          </CardTitle>
          <CardDescription>
            Histórico de usuários removidos do sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trash2 className="h-5 w-5" />
          Usuários Deletados ({deletedUsers.length})
        </CardTitle>
        <CardDescription>
          Histórico de usuários removidos do sistema para auditoria
        </CardDescription>
      </CardHeader>
      <CardContent>
        {deletedUsers.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Nenhum usuário foi deletado ainda.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Deletado em</TableHead>
                <TableHead>Motivo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {deletedUsers.map((deletedUser) => (
                <TableRow key={deletedUser.id}>
                  <TableCell className="font-medium">
                    {deletedUser.nome}
                  </TableCell>
                  <TableCell>{deletedUser.email}</TableCell>
                  <TableCell>
                    {getUserTypeBadge(deletedUser.tipo_usuario)}
                  </TableCell>
                  <TableCell>
                    {format(new Date(deletedUser.deleted_at), 'dd/MM/yyyy HH:mm', {
                      locale: ptBR
                    })}
                  </TableCell>
                  <TableCell className="max-w-xs truncate" title={deletedUser.deletion_reason}>
                    {deletedUser.deletion_reason || 'Sem motivo especificado'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};