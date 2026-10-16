import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Pencil, Plus, Trash2, Check, X } from 'lucide-react';
import { AcademicLevel, AcademicUnit, HIERARCHY_MODELS, LEVEL_LABELS, childrenOf } from '@/features/academic/hierarchy';
import { useAcademicStructure } from '@/hooks/useAcademicStructure';

const InlineAdd = ({ label, onAdd }: { label: string; onAdd: (name: string) => void }) => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  if (!open) return <Button variant="ghost" size="sm" onClick={() => setOpen(true)}><Plus className="h-3.5 w-3.5 mr-1" />{label}</Button>;
  const submit = () => { if (name.trim()) { onAdd(name.trim()); setName(''); setOpen(false); } };
  return (
    <div className="flex gap-2 items-center">
      <Input autoFocus value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && submit()} placeholder={label} className="h-8 max-w-xs" />
      <Button size="icon" className="h-8 w-8" onClick={submit} aria-label="Salvar"><Check className="h-4 w-4" /></Button>
      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setOpen(false)} aria-label="Cancelar"><X className="h-4 w-4" /></Button>
    </div>
  );
};

export const AcademicStructureManager = ({ institutionId }: { institutionId?: string }) => {
  const { levels, units, setLevels, saveUnit, deleteUnit } = useAcademicStructure(institutionId);
  const [editing, setEditing] = useState<{ id: string; name: string } | null>(null);
  const model = HIERARCHY_MODELS.find((m) => m.levels.join() === levels.join())?.id ?? 'full';

  const renderLevel = (depth: number, parentId: string | null): JSX.Element => {
    const level = levels[depth];
    const items = childrenOf(level, parentId, units, levels);
    return (
      <div className={depth > 0 ? 'ml-4 border-l pl-4 space-y-2' : 'space-y-2'}>
        {items.map((u: AcademicUnit) => (
          <div key={u.id} className="space-y-2">
            <div className="flex items-center gap-2 group">
              <span className="text-[10px] uppercase tracking-wide text-muted-foreground w-14">{LEVEL_LABELS[level]}</span>
              {editing?.id === u.id ? (
                <>
                  <Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} className="h-8 max-w-xs" />
                  <Button size="icon" className="h-8 w-8" onClick={() => { saveUnit.mutate({ id: u.id, level, name: editing.name, parent_id: u.parent_id }); setEditing(null); }}><Check className="h-4 w-4" /></Button>
                </>
              ) : (
                <>
                  <span className="font-medium">{u.name}</span>
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditing({ id: u.id, name: u.name })} aria-label="Editar"><Pencil className="h-3.5 w-3.5" /></Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" aria-label="Remover"
                    onClick={() => confirm(`Remover "${u.name}" e tudo abaixo dele?`) && deleteUnit.mutate(u.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                </>
              )}
            </div>
            {depth < levels.length - 1 && renderLevel(depth + 1, u.id)}
          </div>
        ))}
        <InlineAdd label={`Adicionar ${LEVEL_LABELS[level].toLowerCase()}`} onAdd={(name) => saveUnit.mutate({ level, name, parent_id: parentId })} />
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Modelo de hierarquia</CardTitle>
          <CardDescription>Escolha quais níveis sua instituição usa para organizar os alunos.</CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup value={model} onValueChange={(v) => setLevels.mutate(HIERARCHY_MODELS.find((m) => m.id === v)!.levels)} className="grid gap-3 md:grid-cols-2">
            {HIERARCHY_MODELS.map((m) => (
              <Label key={m.id} htmlFor={`model-${m.id}`} className="flex items-center gap-3 rounded-lg border p-3 cursor-pointer has-[:checked]:border-primary">
                <RadioGroupItem id={`model-${m.id}`} value={m.id} />
                <span>{m.label}</span>
              </Label>
            ))}
          </RadioGroup>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Estrutura acadêmica</CardTitle>
          <CardDescription>Cadastre os itens de cada nível. Itens de níveis desativados ficam guardados.</CardDescription>
        </CardHeader>
        <CardContent>{renderLevel(0, null)}</CardContent>
      </Card>
    </div>
  );
};
