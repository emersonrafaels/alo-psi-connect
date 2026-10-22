import { BookOpen, Building2, Clock, Users, type LucideIcon } from 'lucide-react';
import { AcademicLevel, LEVEL_LABELS } from '@/features/academic/hierarchy';

export const LEVEL_ICONS: Record<AcademicLevel, LucideIcon> = { unit: Building2, course: BookOpen, shift: Clock, class: Users };
export const LEVEL_PLURALS: Record<AcademicLevel, string> = { unit: 'unidades', course: 'cursos', shift: 'turnos', class: 'turmas' };
/** "Todas as unidades" / "Todos os cursos" — unidade and turma are feminine in Portuguese. */
export const allOf = (level: AcademicLevel) => `${level === 'unit' || level === 'class' ? 'Todas as' : 'Todos os'} ${LEVEL_PLURALS[level]}`;

// Each step down the tree fades the tenant's primary color, so depth reads at a glance.
export const DEPTH_TINT = ['bg-primary/15 text-primary', 'bg-primary/10 text-primary', 'bg-primary/[0.07] text-primary/90', 'bg-muted text-muted-foreground'];
export const DEPTH_RAIL = ['border-primary/40', 'border-primary/25', 'border-primary/15', 'border-border'];

export const countOf = (n: number, level: AcademicLevel) => `${n.toLocaleString('pt-BR')} ${n === 1 ? LEVEL_LABELS[level].toLowerCase() : LEVEL_PLURALS[level]}`;
/** "a, b e c" */
export const joinList = (items: string[]) => (items.length < 2 ? items.join('') : `${items.slice(0, -1).join(', ')} e ${items[items.length - 1]}`);
export const studentsLabel = (n: number) => `${n.toLocaleString('pt-BR')} ${n === 1 ? 'aluno' : 'alunos'}`;
