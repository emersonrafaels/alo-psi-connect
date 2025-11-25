import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Users, Trash2 } from 'lucide-react';
import { GroupSession } from '@/hooks/useGroupSessions';
import { getSessionTypeLabel } from '../SessionTypeIcon';

interface GroupSessionsTableProps {
  sessions: GroupSession[];
  onEdit: (session: GroupSession) => void;
  onViewRegistrants: (session: GroupSession) => void;
  onDelete: (sessionId: string) => void;
}

export const GroupSessionsTable = ({
  sessions,
  onEdit,
  onViewRegistrants,
  onDelete,
}: GroupSessionsTableProps) => {
  const getStatusBadge = (status: string) => {
    const variants = {
      draft: 'secondary',
      scheduled: 'default',
      live: 'success',
      completed: 'outline',
      cancelled: 'destructive',
    };

    const labels = {
      draft: 'Rascunho',
      scheduled: 'Agendado',
      live: 'Ao Vivo',
      completed: 'Realizado',
      cancelled: 'Cancelado',
    };

    return (
      <Badge variant={variants[status as keyof typeof variants] as any}>
        {labels[status as keyof typeof labels]}
      </Badge>
    );
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Título</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Data</TableHead>
            <TableHead>Horário</TableHead>
            <TableHead>Inscritos</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sessions.map((session) => (
            <TableRow key={session.id}>
              <TableCell className="font-medium max-w-xs truncate">
                {session.title}
              </TableCell>
              <TableCell>{getSessionTypeLabel(session.session_type)}</TableCell>
              <TableCell>
                {format(new Date(session.session_date), 'dd/MM/yyyy', { locale: ptBR })}
              </TableCell>
              <TableCell>{session.start_time.substring(0, 5)}</TableCell>
              <TableCell>
                <span className={
                  session.current_registrations >= session.max_participants 
                    ? 'text-destructive font-semibold' 
                    : ''
                }>
                  {session.current_registrations}/{session.max_participants}
                </span>
              </TableCell>
              <TableCell>{getStatusBadge(session.status)}</TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onViewRegistrants(session)}
                  >
                    <Users className="h-4 w-4 mr-1" />
                    Inscritos
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onEdit(session)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => onDelete(session.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
          {sessions.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                Nenhum encontro cadastrado
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};
