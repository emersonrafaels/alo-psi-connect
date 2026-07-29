import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ShieldCheck, Search, UserPlus, Trash2, Loader2, Users } from 'lucide-react';
import { useRadarAccessGrants, useProfileSearch } from '@/hooks/useRadarAccess';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function RadarAccess() {
  const { grants, isLoading, grant, revoke } = useRadarAccessGrants();
  const [term, setTerm] = useState('');
  const [note, setNote] = useState('');
  const [selected, setSelected] = useState<{ user_id: string; nome: string | null; email: string | null } | null>(null);
  const [toRevoke, setToRevoke] = useState<string | null>(null);

  const { data: results = [], isFetching } = useProfileSearch(term);

  const handleGrant = () => {
    if (!selected?.user_id) return;
    grant.mutate(
      { userId: selected.user_id, note },
      {
        onSuccess: () => {
          setSelected(null);
          setTerm('');
          setNote('');
        },
      }
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold">Acesso ao Radar Institucional</h1>
          <p className="text-sm text-muted-foreground">
            Administradores do site, administradores de instituição e facilitadores já têm acesso automático.
            Aqui você libera o Radar para usuários específicos.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <UserPlus className="h-4 w-4" /> Liberar acesso a um usuário
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={term}
              onChange={(e) => {
                setTerm(e.target.value);
                setSelected(null);
              }}
              placeholder="Buscar por nome ou e-mail (mínimo 3 caracteres)"
              className="pl-9"
            />
          </div>

          {term.trim().length >= 3 && !selected && (
            <div className="rounded-lg border divide-y max-h-64 overflow-auto">
              {isFetching && (
                <div className="p-3 text-sm text-muted-foreground flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" /> Buscando...
                </div>
              )}
              {!isFetching && results.length === 0 && (
                <div className="p-3 text-sm text-muted-foreground">Nenhum usuário encontrado.</div>
              )}
              {results.map((p: any) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setSelected({ user_id: p.user_id, nome: p.nome, email: p.email })}
                  className="w-full text-left p-3 hover:bg-muted/60 transition-colors"
                >
                  <div className="font-medium text-sm">{p.nome || 'Sem nome'}</div>
                  <div className="text-xs text-muted-foreground">{p.email}</div>
                </button>
              ))}
            </div>
          )}

          {selected && (
            <div className="rounded-lg border p-4 space-y-3 bg-muted/30">
              <div>
                <div className="font-medium text-sm">{selected.nome || 'Sem nome'}</div>
                <div className="text-xs text-muted-foreground">{selected.email}</div>
              </div>
              <Input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Observação (opcional). Ex: parceria em avaliação"
              />
              <div className="flex gap-2">
                <Button onClick={handleGrant} disabled={grant.isPending}>
                  {grant.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Liberar acesso
                </Button>
                <Button variant="ghost" onClick={() => setSelected(null)}>
                  Cancelar
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4" /> Usuários com acesso liberado
            <Badge variant="secondary">{grants.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-10 flex justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : grants.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              Nenhum acesso liberado manualmente ainda.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Observação</TableHead>
                    <TableHead>Liberado por</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {grants.map((g) => (
                    <TableRow key={g.id}>
                      <TableCell>
                        <div className="font-medium text-sm">{g.profile?.nome || 'Sem nome'}</div>
                        <div className="text-xs text-muted-foreground">{g.profile?.email}</div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-[240px] truncate">
                        {g.note || '—'}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{g.granted_by_name || '—'}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(g.created_at), "dd 'de' MMM yyyy", { locale: ptBR })}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => setToRevoke(g.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!toRevoke} onOpenChange={(open) => !open && setToRevoke(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover acesso ao Radar?</AlertDialogTitle>
            <AlertDialogDescription>
              O usuário deixará de ver o Radar Institucional no menu e não poderá abrir a página, a menos que tenha
              acesso por outro papel.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (toRevoke) revoke.mutate(toRevoke);
                setToRevoke(null);
              }}
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
