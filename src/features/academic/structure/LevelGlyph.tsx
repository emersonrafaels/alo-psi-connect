import { AcademicLevel } from '@/features/academic/hierarchy';
import { cn } from '@/lib/utils';
import { DEPTH_TINT, LEVEL_ICONS } from './levelMeta';

export const LevelGlyph = ({ level, depth, className, iconClassName }: { level: AcademicLevel; depth: number; className?: string; iconClassName?: string }) => {
  const Icon = LEVEL_ICONS[level];
  return (
    <span className={cn('inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md', DEPTH_TINT[depth] ?? DEPTH_TINT[3], className)}>
      <Icon className={cn('h-3.5 w-3.5', iconClassName)} aria-hidden />
    </span>
  );
};
