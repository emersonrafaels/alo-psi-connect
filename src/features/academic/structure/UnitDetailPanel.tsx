import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { AcademicLevel, AcademicUnit, LEVEL_LABELS, buildPath, childrenOf } from '@/features/academic/hierarchy';
import { cn } from '@/lib/utils';
import { LEVEL_PLURALS } from './levelMeta';
import { LevelGlyph } from './LevelGlyph';

interface Props {
  unit: AcademicUnit | null;
  levels: AcademicLevel[];
  units: AcademicUnit[];
  studentCount: Map<string, number>;
  onAddChild: (level: AcademicLevel, parentId: string) => void;
  onRename: (unit: AcademicUnit) => void;
  onDelete: (unit: AcademicUnit) => void;
}

export const UnitDetailPanel = ({ unit, levels, units, studentCount, onAddChild, onRename, onDelete }: Props) => {
  if (!unit) {
    return (
      <Card className="p-5 text-sm text-muted-foreground lg:sticky lg:top-24">
        Selecione um item na árvore para ver onde ele fica na estrutura e quantos alunos tem.
      </Card>
    );
  }

  const depth = levels.indexOf(unit.level);
  const childLevel = levels[depth + 1] as AcademicLevel | undefined;
  const childTotal = childLevel ? childrenOf(childLevel, unit.id, units, levels).length : 0;
  const path = buildPath(unit.id, units, levels);
  const count = studentCount.get(unit.id) ?? 0;

  return (
    <Card className="p-5 lg:sticky lg:top-24" aria-live="polite" aria-label={`Detalhes de ${unit.name}`}>
      <div className="flex items-start gap-3 border-b pb-4">
        <LevelGlyph level={unit.level} depth={depth} className="h-11 w-11 rounded-xl" iconClassName="h-5 w-5" />
        <div className="min-w-0">
          <h2 className="break-words text-lg font-semibold leading-tight tracking-tight">{unit.name}</h2>
          <p className="text-sm text-muted-foreground">{LEVEL_LABELS[unit.level]}</p>
        </div>
      </div>

      <div className="my-4 grid grid-cols-2 divide-x rounded-lg border bg-muted/30 py-3 text-center">
        <div>
          <p className="text-xl font-bold tabular-nums text-primary">{count.toLocaleString('pt-BR')}</p>
          <p className="text-xs text-muted-foreground">{count === 1 ? 'aluno vinculado' : 'alunos vinculados'}</p>
        </div>
        <div>
          {childLevel ? (
            <>
              <p className="text-xl font-bold tabular-nums text-primary">{childTotal.toLocaleString('pt-BR')}</p>
              <p className="text-xs text-muted-foreground">{childTotal === 1 ? LEVEL_LABELS[childLevel].toLowerCase() : LEVEL_PLURALS[childLevel]}</p>
            </>
          ) : (
            <>
              <p className="text-xl font-bold text-muted-foreground">—</p>
              <p className="text-xs text-muted-foreground">Último nível</p>
            </>
          )}
        </div>
      </div>

      {path.length > 1 && (
        <div className="mb-5">
          <h3 className="mb-2 text-sm font-medium">Onde fica</h3>
          <ol className="space-y-1.5">
            {path.map((p, i) => (
              <li key={p.id} className={cn('flex items-center gap-2 text-sm', i === path.length - 1 ? 'font-semibold' : 'text-muted-foreground')} style={{ paddingLeft: i * 10 }}>
                <LevelGlyph level={p.level} depth={i} className="h-6 w-6" iconClassName="h-3 w-3" />
                <span className="truncate">{p.name}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      <div className="flex flex-col gap-2">
        {childLevel && (
          <Button onClick={() => onAddChild(childLevel, unit.id)}><Plus className="mr-1.5 h-4 w-4" />Adicionar {LEVEL_LABELS[childLevel].toLowerCase()}</Button>
        )}
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" onClick={() => onRename(unit)}><Pencil className="mr-1.5 h-4 w-4" />Renomear</Button>
          <Button variant="outline" className="text-destructive hover:text-destructive" onClick={() => onDelete(unit)}><Trash2 className="mr-1.5 h-4 w-4" />Remover</Button>
        </div>
      </div>
    </Card>
  );
};
