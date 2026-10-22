import { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AcademicLevel, AcademicUnit, LEVEL_LABELS, buildPath, parentLevelFor } from '@/features/academic/hierarchy';

export type UnitFormState =
  | { mode: 'create'; level?: AcademicLevel; parentId?: string | null }
  | { mode: 'rename'; unit: AcademicUnit };

interface Props {
  state: UnitFormState | null;
  levels: AcademicLevel[];
  units: AcademicUnit[];
  onClose: () => void;
  onSubmit: (value: { id?: string; level: AcademicLevel; name: string; parent_id: string | null }) => void;
}

export const UnitFormDialog = ({ state, levels, units, onClose, onSubmit }: Props) => {
  const [level, setLevel] = useState<AcademicLevel>(levels[0]);
  const [parentId, setParentId] = useState<string>('');
  const [name, setName] = useState('');

  useEffect(() => {
    if (!state) return;
    if (state.mode === 'rename') { setLevel(state.unit.level); setName(state.unit.name); return; }
    setLevel(state.level ?? levels[0]);
    setParentId(state.parentId ?? '');
    setName('');
  }, [state, levels]);

  const parentLevel = parentLevelFor(level, levels);
  const parentOptions = useMemo(
    () => (parentLevel ? units.filter((u) => u.level === parentLevel)
      .map((u) => ({ id: u.id, label: buildPath(u.id, units, levels).map((p) => p.name).join(' › ') }))
      .sort((a, b) => a.label.localeCompare(b.label, 'pt-BR')) : []),
    [parentLevel, units, levels],
  );

  const isRename = state?.mode === 'rename';
  const needsParent = !isRename && !!parentLevel;
  const canSubmit = !!name.trim() && (!needsParent || parentOptions.some((o) => o.id === parentId));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!state || !canSubmit) return;
    if (state.mode === 'rename') onSubmit({ id: state.unit.id, level: state.unit.level, name: name.trim(), parent_id: state.unit.parent_id });
    else onSubmit({ level, name: name.trim(), parent_id: needsParent ? parentId : null });
  };

  return (
    <Dialog open={!!state} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={submit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>{isRename ? `Renomear ${LEVEL_LABELS[level].toLowerCase()}` : 'Novo cadastro'}</DialogTitle>
            <DialogDescription>{isRename ? 'O novo nome aparece em toda a estrutura e nos filtros de alunos.' : 'Inclua um item na estrutura acadêmica da instituição.'}</DialogDescription>
          </DialogHeader>

          {!isRename && levels.length > 1 && (
            <div className="space-y-2">
              <Label htmlFor="unit-level">Tipo</Label>
              <Select value={level} onValueChange={(v) => { setLevel(v as AcademicLevel); setParentId(''); }}>
                <SelectTrigger id="unit-level"><SelectValue /></SelectTrigger>
                <SelectContent>{levels.map((l) => <SelectItem key={l} value={l}>{LEVEL_LABELS[l]}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          )}

          {needsParent && parentLevel && (
            <div className="space-y-2">
              <Label htmlFor="unit-parent">Dentro de qual {LEVEL_LABELS[parentLevel].toLowerCase()}</Label>
              {parentOptions.length ? (
                <Select value={parentId} onValueChange={setParentId}>
                  <SelectTrigger id="unit-parent"><SelectValue placeholder="Escolha" /></SelectTrigger>
                  <SelectContent>{parentOptions.map((o) => <SelectItem key={o.id} value={o.id}>{o.label}</SelectItem>)}</SelectContent>
                </Select>
              ) : (
                <p className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
                  Cadastre primeiro um item do nível {LEVEL_LABELS[parentLevel]}.
                </p>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="unit-name">Nome</Label>
            <Input id="unit-name" autoFocus value={name} onChange={(e) => setName(e.target.value)} maxLength={80} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={!canSubmit}>{isRename ? 'Salvar nome' : 'Salvar cadastro'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
