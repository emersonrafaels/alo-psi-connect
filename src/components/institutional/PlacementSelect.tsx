import { useEffect, useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { AcademicLevel, AcademicUnit, LEVEL_LABELS, buildPath, childrenOf } from '@/features/academic/hierarchy';

interface Props {
  levels: AcademicLevel[];
  units: AcademicUnit[];
  initialClassId?: string | null;
  /** Called with the final selected id of the deepest level reached (class when complete). */
  onChange: (selection: Partial<Record<AcademicLevel, string>>) => void;
  requireComplete?: boolean;
}

export const PlacementSelect = ({ levels, units, initialClassId, onChange }: Props) => {
  const [sel, setSel] = useState<Partial<Record<AcademicLevel, string>>>({});

  useEffect(() => {
    const init: Partial<Record<AcademicLevel, string>> = {};
    if (initialClassId) buildPath(initialClassId, units, levels).forEach((u) => (init[u.level] = u.id));
    setSel(init);
    onChange(init);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialClassId, levels.join(','), units.length]);

  const pick = (idx: number, id: string) => {
    const next: Partial<Record<AcademicLevel, string>> = {};
    levels.slice(0, idx).forEach((l) => sel[l] && (next[l] = sel[l]));
    if (id !== '__all') next[levels[idx]] = id;
    setSel(next);
    onChange(next);
  };

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {levels.map((level, idx) => {
        const parentId = idx > 0 ? sel[levels[idx - 1]] ?? null : null;
        const disabled = idx > 0 && !parentId;
        const opts = disabled ? [] : childrenOf(level, parentId, units, levels);
        return (
          <div key={level} className="space-y-1.5">
            <Label className="text-xs">{LEVEL_LABELS[level]}</Label>
            <Select value={sel[level] ?? '__all'} onValueChange={(v) => pick(idx, v)} disabled={disabled}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__all">{disabled ? `Escolha ${LEVEL_LABELS[levels[idx - 1]].toLowerCase()}` : 'Todos'}</SelectItem>
                {opts.map((o) => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        );
      })}
    </div>
  );
};
