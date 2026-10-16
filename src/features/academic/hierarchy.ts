export type AcademicLevel = 'unit' | 'course' | 'shift' | 'class';

export const LEVEL_ORDER: AcademicLevel[] = ['unit', 'course', 'shift', 'class'];

export const LEVEL_LABELS: Record<AcademicLevel, string> = {
  unit: 'Unidade',
  course: 'Curso',
  shift: 'Turno',
  class: 'Turma',
};

export const HIERARCHY_MODELS: { id: string; label: string; levels: AcademicLevel[] }[] = [
  { id: 'full', label: 'Unidade > Curso > Turno > Turma', levels: ['unit', 'course', 'shift', 'class'] },
  { id: 'course', label: 'Curso > Turno > Turma', levels: ['course', 'shift', 'class'] },
  { id: 'shift', label: 'Turno > Turma', levels: ['shift', 'class'] },
  { id: 'class', label: 'Somente Turma', levels: ['class'] },
];

export const normalizeLevels = (levels?: string[] | null): AcademicLevel[] => {
  const valid = LEVEL_ORDER.filter((l) => levels?.includes(l));
  return valid.includes('class') ? valid : LEVEL_ORDER;
};

/** Level a new item at `level` must have as parent, or null if it is the top active level. */
export const parentLevelFor = (level: AcademicLevel, active: AcademicLevel[]): AcademicLevel | null => {
  const i = active.indexOf(level);
  if (i <= 0) return null;
  return active[i - 1];
};

export interface AcademicUnit {
  id: string;
  institution_id: string;
  parent_id: string | null;
  level: AcademicLevel;
  name: string;
  sort_order: number;
}

/** Path of active-level names from top to the given unit. */
export const buildPath = (unitId: string, units: AcademicUnit[], active: AcademicLevel[]): AcademicUnit[] => {
  const byId = new Map(units.map((u) => [u.id, u]));
  const path: AcademicUnit[] = [];
  let cur = byId.get(unitId);
  while (cur) {
    if (active.includes(cur.level)) path.unshift(cur);
    cur = cur.parent_id ? byId.get(cur.parent_id) : undefined;
  }
  return path;
};

/** Units visible at `level` under the chosen parent, respecting the active model. */
export const childrenOf = (
  level: AcademicLevel,
  parentId: string | null,
  units: AcademicUnit[],
  active: AcademicLevel[],
): AcademicUnit[] => {
  const parentLevel = parentLevelFor(level, active);
  return units
    .filter((u) => u.level === level)
    .filter((u) => (parentLevel ? u.parent_id === parentId : true))
    .sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name));
};
