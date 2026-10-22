import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { ChevronRight, Info } from 'lucide-react';
import { AcademicLevel, HIERARCHY_MODELS, LEVEL_LABELS, LEVEL_ORDER } from '@/features/academic/hierarchy';
import { cn } from '@/lib/utils';
import { LEVEL_ICONS } from './levelMeta';

/** Ladder of the four possible levels; the ones a model skips stay visible as dashed placeholders. */
const ModelLadder = ({ levels }: { levels: AcademicLevel[] }) => (
  <span className="flex flex-wrap items-center gap-1" aria-hidden>
    {LEVEL_ORDER.map((l, i) => {
      const on = levels.includes(l);
      const Icon = LEVEL_ICONS[l];
      return (
        <span key={l} className="flex items-center gap-1">
          {i > 0 && <ChevronRight className={cn('h-3 w-3', on ? 'text-muted-foreground' : 'text-muted-foreground/30')} />}
          <span className={cn(
            'inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs',
            on ? 'bg-primary/10 font-medium text-primary' : 'border border-dashed text-muted-foreground/50 line-through decoration-muted-foreground/40',
          )}>
            <Icon className="h-3 w-3" />{LEVEL_LABELS[l]}
          </span>
        </span>
      );
    })}
  </span>
);

export const ModelPicker = ({ levels, onChange }: { levels: AcademicLevel[]; onChange: (levels: AcademicLevel[]) => void }) => {
  const model = HIERARCHY_MODELS.find((m) => m.levels.join() === levels.join())?.id ?? 'full';
  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg">Modelo de hierarquia</CardTitle>
        <CardDescription>Escolha quais níveis sua instituição usa para organizar os alunos.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <RadioGroup value={model} onValueChange={(v) => onChange(HIERARCHY_MODELS.find((m) => m.id === v)!.levels)} className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {HIERARCHY_MODELS.map((m) => (
            <Label
              key={m.id} htmlFor={`model-${m.id}`}
              className="flex cursor-pointer items-start gap-3 rounded-lg border p-3 font-normal hover:border-primary/40 has-[:checked]:border-primary has-[:checked]:bg-primary/[0.04] has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring"
            >
              <RadioGroupItem id={`model-${m.id}`} value={m.id} className="mt-0.5" />
              <span className="space-y-2">
                <span className="block text-sm font-semibold">{m.levels.length === 1 ? 'Só turmas' : `${m.levels.length} níveis`}</span>
                <ModelLadder levels={m.levels} />
              </span>
            </Label>
          ))}
        </RadioGroup>
        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          <Info className="h-3.5 w-3.5 shrink-0" aria-hidden />
          Trocar o modelo só muda a organização; cadastros e vínculos são mantidos e voltam se o nível for reativado.
        </p>
      </CardContent>
    </Card>
  );
};
