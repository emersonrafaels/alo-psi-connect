import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CheckCircle2, XCircle, AlertCircle, Edit, Trash2, Plus } from 'lucide-react';
import { ParsedUserWithValidation } from '@/hooks/useBulkUserValidation';
import { UserEditDialog } from './UserEditDialog';

interface BulkImportReviewTableProps {
  users: ParsedUserWithValidation[];
  onEdit: (id: string, updatedUser: Partial<ParsedUserWithValidation>) => void;
  onRemove: (id: string) => void;
  onAdd: () => void;
}

type FilterType = 'all' | 'valid' | 'errors' | 'warnings';

export const BulkImportReviewTable = ({ users, onEdit, onRemove, onAdd }: BulkImportReviewTableProps) => {
  const [filter, setFilter] = useState<FilterType>('all');
  const [editingUser, setEditingUser] = useState<ParsedUserWithValidation | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const validUsers = users.filter(u => u.validation.isValid);
  const errorUsers = users.filter(u => !u.validation.isValid);
  const warningUsers = users.filter(u => u.validation.isValid && u.validation.warnings.length > 0);

  const filteredUsers = users.filter(user => {
    if (filter === 'valid') return user.validation.isValid;
    if (filter === 'errors') return !user.validation.isValid;
    if (filter === 'warnings') return user.validation.isValid && user.validation.warnings.length > 0;
    return true;
  });

  const handleEditClick = (user: ParsedUserWithValidation) => {
    setEditingUser(user);
    setDialogOpen(true);
  };

  const handleSave = (id: string, updatedUser: Partial<ParsedUserWithValidation>) => {
    onEdit(id, updatedUser);
  };

  const getStatusIcon = (user: ParsedUserWithValidation) => {
    if (!user.validation.isValid) {
      return <XCircle className="h-5 w-5 text-destructive" />;
    }
    if (user.validation.warnings.length > 0) {
      return <AlertCircle className="h-5 w-5 text-yellow-500" />;
    }
    return <CheckCircle2 className="h-5 w-5 text-green-500" />;
  };

  const getStatusBadge = (user: ParsedUserWithValidation) => {
    if (!user.validation.isValid) {
      return <Badge variant="destructive">Erro</Badge>;
    }
    if (user.validation.warnings.length > 0) {
      return <Badge className="bg-yellow-500 hover:bg-yellow-600">Aviso</Badge>;
    }
    return <Badge className="bg-green-500 hover:bg-green-600">Válido</Badge>;
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>2. Revisar Dados Importados</CardTitle>
          <CardDescription>
            Revise e ajuste os dados antes de confirmar a importação. Clique em um usuário para editá-lo.
          </CardDescription>

          {/* Estatísticas e filtros */}
          <div className="flex flex-wrap gap-2 mt-4">
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('all')}
            >
              Todos ({users.length})
            </Button>
            <Button
              variant={filter === 'valid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('valid')}
              className={filter === 'valid' ? '' : 'border-green-500 text-green-600 hover:bg-green-50'}
            >
              <CheckCircle2 className="h-4 w-4 mr-1" />
              Válidos ({validUsers.length})
            </Button>
            <Button
              variant={filter === 'warnings' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('warnings')}
              className={filter === 'warnings' ? '' : 'border-yellow-500 text-yellow-600 hover:bg-yellow-50'}
            >
              <AlertCircle className="h-4 w-4 mr-1" />
              Avisos ({warningUsers.length})
            </Button>
            <Button
              variant={filter === 'errors' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('errors')}
              className={filter === 'errors' ? '' : 'border-destructive text-destructive hover:bg-destructive/10'}
            >
              <XCircle className="h-4 w-4 mr-1" />
              Com Erros ({errorUsers.length})
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          <div className="border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">Status</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>CPF</TableHead>
                    <TableHead>Instituição</TableHead>
                    <TableHead className="w-24">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                        Nenhum usuário encontrado com este filtro
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((user) => (
                      <TableRow
                        key={user.id}
                        className={!user.validation.isValid ? 'bg-destructive/5' : ''}
                      >
                        <TableCell>
                          <div className="flex items-center justify-center">
                            {getStatusIcon(user)}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          <div className="flex flex-col">
                            <span>{user.nome}</span>
                            {!user.validation.isValid && (
                              <span className="text-xs text-destructive mt-1">
                                {user.validation.errors[0]}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          {getStatusBadge(user)}
                          {' '}
                          <Badge variant="outline" className="ml-1">
                            {user.tipo_usuario}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {user.cpf || '-'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {user.instituicao || '-'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEditClick(user)}
                              title="Editar usuário"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => onRemove(user.id)}
                              title="Remover da importação"
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Botão adicionar novo */}
          <Button
            variant="outline"
            className="mt-4 w-full sm:w-auto"
            onClick={onAdd}
          >
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Usuário Manualmente
          </Button>

          {/* Resumo de validações */}
          {errorUsers.length > 0 && (
            <div className="mt-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <h4 className="font-semibold text-destructive mb-2 flex items-center gap-2">
                <XCircle className="h-4 w-4" />
                {errorUsers.length} usuário(s) com erros não serão importados
              </h4>
              <p className="text-sm text-muted-foreground">
                Corrija os erros ou remova estes usuários para prosseguir
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <UserEditDialog
        user={editingUser}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSave={handleSave}
      />
    </>
  );
};
