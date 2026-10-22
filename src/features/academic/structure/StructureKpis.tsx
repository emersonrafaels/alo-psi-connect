import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { UserCheck, Users } from 'lucide-react';
import { AcademicLevel, AcademicUnit } from '@/features/academic/hierarchy';
import { LEVEL_ICONS, LEVEL_PLURALS, countOf, joinList } from './levelMeta';

interface Props {
  levels: AcademicLevel[];
  units: AcademicUnit[];
  totalStudents: number;
  placedTotal: number;
}

const Kpi = ({ label, icon: Icon, value, children }: { label: string; icon: typeof Users; value: string; children?: React.ReactNode }) => (
  <Card className="p-4 sm:p-5">
    <div className="flex items-center justify-between gap-2 text-sm text-muted-foreground">
      <span>{label}</span>
      <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary"><Icon className="h-3.5 w-3.5" aria-hidden /></span>
    </div>
    <div className="mt-2 text-2xl font-bold tracking-tight tabular-nums">{value}</div>
    <div className="mt-1 text-xs text-muted-foreground">{children}</div>
  </Card>
);

export const StructureKpis = ({ levels, units, totalStudents, placedTotal }: Props) => {
  const fmt = (n: number) => n.toLocaleString('pt-BR');
  const countAt = (l: AcademicLevel) => units.filter((u) => u.level === l).length;
  const top = levels[0];
  const middle = levels.slice(1, -1);
  const pct = totalStudents ? (placedTotal / totalStudents) * 100 : 0;
  const pctLabel = pct.toLocaleString('pt-BR', { maximumFractionDigits: 1 });

  return (
    <section aria-label="Indicadores da estrutura" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <Kpi label="Alunos da instituição" icon={Users} value={fmt(totalStudents)}>Vinculados ao portal</Kpi>
      <Kpi label="Alunos em turmas" icon={UserCheck} value={fmt(placedTotal)}>
        <span className="font-medium text-foreground">{pctLabel}%</span> do total
        <Progress value={pct} className="mt-2 h-1.5" aria-label={`${pctLabel}% dos alunos estão em turmas`} />
      </Kpi>
      {levels.length > 1 && (
        <Kpi label={LEVEL_PLURALS[top][0].toUpperCase() + LEVEL_PLURALS[top].slice(1)} icon={LEVEL_ICONS[top]} value={fmt(countAt(top))}>
          Primeiro nível da estrutura
        </Kpi>
      )}
      <Kpi label="Turmas" icon={LEVEL_ICONS.class} value={fmt(countAt('class'))}>
        {middle.length ? joinList(middle.map((l) => countOf(countAt(l), l))) : 'Onde os alunos são vinculados'}
      </Kpi>
    </section>
  );
};
