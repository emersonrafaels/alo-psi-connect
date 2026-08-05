import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Brain, Info, Save, Search, ShieldCheck, Users } from 'lucide-react';
import {
  useInstitutionBuddyViewers,
  useInstitutionBuddyStudents,
  useSaveInstitutionBuddyAccess,
} from '@/hooks/useInstitutionBuddyAccess';

interface Props {
  institutionId: string;
}

interface ListItem {
  id: string;
  title: string;
  subtitle: string | null;
  badge?: string | null;
}

function SelectionList({
  icon,
  title,
  description,
  items,
  selected,
  onToggle,
  onSelectAll,
  onClear,
  emptyLabel,
  loading,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  items: ListItem[];
  selected: Set<string>;
  onToggle: (id: string) => void;
  onSelectAll: () => void;
  onClear: () => void;
  emptyLabel: string;
  loading: boolean;
}) {
  const [term, setTerm] = useState('');

  const filtered = useMemo(() => {
    const t = term.trim().toLowerCase();
    if (!t) return items;
    return items.filter(
      (i) => i.title.toLowerCase().includes(t) || (i.subtitle ?? '').toLowerCase().includes(t)
    );
  }, [items, term]);

  const selectedCount = items.filter((i) => selected.has(i.id)).length;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              {icon}
              {title}
            </CardTitle>
            <CardDescription className="mt-1">{description}</CardDescription>
          </div>
          <Badge variant={selectedCount > 0 ? 'default' : 'secondary'} className="shrink-0">
            {selectedCount} de {items.length} liberados
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou e-mail..."
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              className="pl-8"
            />
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" onClick={onSelectAll}>
              Selecionar todos
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={onClear}>
              Limpar
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">{emptyLabel}</p>
        ) : (
          <div className="space-y-1 max-h-80 overflow-y-auto pr-1">
            {filtered.map((item) => (
              <label
                key={item.id}
                className="flex items-center gap-3 p-2.5 rounded-md hover:bg-muted/60 cursor-pointer transition-colors"
              >
                <Checkbox
                  checked={selected.has(item.id)}
                  onCheckedChange={() => onToggle(item.id)}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{item.title}</p>
                  {item.subtitle && (
                    <p className="text-xs text-muted-foreground truncate">{item.subtitle}</p>
                  )}
                </div>
                {item.badge && (
                  <Badge variant="outline" className="text-[10px] shrink-0">
                    {item.badge}
                  </Badge>
                )}
              </label>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function InstitutionBuddyAccessTab({ institutionId }: Props) {
  const { data: viewers = [], isLoading: loadingViewers } = useInstitutionBuddyViewers(institutionId);
  const { data: students = [], isLoading: loadingStudents } = useInstitutionBuddyStudents(institutionId);
  const save = useSaveInstitutionBuddyAccess(institutionId);

  const [selectedViewers, setSelectedViewers] = useState<Set<string>>(new Set());
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());

  useEffect(() => {
    setSelectedViewers(new Set(viewers.filter((v) => v.enabled).map((v) => v.user_id)));
  }, [viewers]);

  useEffect(() => {
    setSelectedStudents(new Set(students.filter((s) => s.enabled).map((s) => s.patient_id)));
  }, [students]);

  const toggle = (set: Set<string>, id: string) => {
    const next = new Set(set);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    return next;
  };

  const dirty =
    viewers.some((v) => v.enabled !== selectedViewers.has(v.user_id)) ||
    students.some((s) => s.enabled !== selectedStudents.has(s.patient_id));

  return (
    <div className="space-y-6">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Por padrão nada é liberado. Os usuários institucionais marcados abaixo poderão ver, no portal
          da instituição, o Buddy apenas dos alunos marcados — em modo somente leitura.
        </AlertDescription>
      </Alert>

      <div className="grid gap-6 lg:grid-cols-2">
        <SelectionList
          icon={<ShieldCheck className="h-4 w-4 text-primary" />}
          title="Usuários institucionais"
          description="Quem pode ver o Buddy dos alunos desta instituição."
          items={viewers.map((v) => ({
            id: v.user_id,
            title: v.nome ?? v.email ?? v.user_id,
            subtitle: v.email,
            badge: v.role === 'admin' ? 'Administrador' : v.role,
          }))}
          selected={selectedViewers}
          onToggle={(id) => setSelectedViewers((prev) => toggle(prev, id))}
          onSelectAll={() => setSelectedViewers(new Set(viewers.map((v) => v.user_id)))}
          onClear={() => setSelectedViewers(new Set())}
          emptyLabel="Nenhum usuário institucional ativo encontrado."
          loading={loadingViewers}
        />

        <SelectionList
          icon={<Users className="h-4 w-4 text-primary" />}
          title="Alunos"
          description="De quais alunos o Buddy fica visível para os usuários liberados."
          items={students.map((s) => ({
            id: s.patient_id,
            title: s.nome ?? s.email ?? s.patient_id,
            subtitle: s.email,
          }))}
          selected={selectedStudents}
          onToggle={(id) => setSelectedStudents((prev) => toggle(prev, id))}
          onSelectAll={() => setSelectedStudents(new Set(students.map((s) => s.patient_id)))}
          onClear={() => setSelectedStudents(new Set())}
          emptyLabel="Nenhum aluno vinculado a esta instituição."
          loading={loadingStudents}
        />
      </div>

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <p className="text-sm text-muted-foreground flex items-center gap-2">
          <Brain className="h-4 w-4" />
          {selectedViewers.size} usuário(s) verão o Buddy de {selectedStudents.size} aluno(s).
        </p>
        <Button
          onClick={() =>
            save.mutate({
              viewerIds: Array.from(selectedViewers),
              patientIds: Array.from(selectedStudents),
            })
          }
          disabled={!dirty || save.isPending}
        >
          <Save className="h-4 w-4 mr-2" />
          {save.isPending ? 'Salvando...' : 'Salvar acessos'}
        </Button>
      </div>
    </div>
  );
}
