import type { StudentRiskData } from '@/hooks/useStudentTriage';

export type StudentMultiFilter =
  | 'risk' | 'status' | 'activity' | 'signal'
  | 'unit' | 'course' | 'shift' | 'class'
  | 'gender' | 'ageRange';

export interface StudentFilters {
  /** An empty array means "no restriction" for that facet. */
  risk: string[];
  status: string[];
  activity: string[];
  signal: string[];
  unit: string[];
  course: string[];
  shift: string[];
  class: string[];
  gender: string[];
  ageRange: string[];
  search: string;
}

export const emptyStudentFilters: StudentFilters = {
  risk: [], status: [], activity: [], signal: [],
  unit: [], course: [], shift: [], class: [],
  gender: [], ageRange: [],
  search: '',
};

/** Academic path of a student, keyed by hierarchy level (names, not ids). */
export interface AcademicPath {
  unit?: string;
  course?: string;
  shift?: string;
  class?: string;
}

const statusMatches: Record<string, (status: string | null) => boolean> = {
  none: (status) => status === null,
  pending: (status) => status === 'pending',
  active: (status) => status === 'triaged' || status === 'in_progress',
  resolved: (status) => status === 'resolved',
};

export const AGE_RANGES: { id: string; label: string }[] = [
  { id: 'under18', label: 'Menor de 18' },
  { id: '18-24', label: '18 a 24' },
  { id: '25-34', label: '25 a 34' },
  { id: '35-44', label: '35 a 44' },
  { id: '45plus', label: '45 ou mais' },
  { id: 'unknown', label: 'Não informado' },
];

/** Age band for a birth date (ISO string); 'unknown' when missing or invalid. */
export function ageRangeOf(birthDate: string | null | undefined, now: Date = new Date()): string {
  if (!birthDate) return 'unknown';
  const birth = new Date(`${birthDate}T00:00:00`);
  if (Number.isNaN(birth.getTime())) return 'unknown';
  let age = now.getFullYear() - birth.getFullYear();
  const beforeBirthday =
    now.getMonth() < birth.getMonth() ||
    (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate());
  if (beforeBirthday) age -= 1;
  if (age < 0 || age > 120) return 'unknown';
  if (age < 18) return 'under18';
  if (age <= 24) return '18-24';
  if (age <= 34) return '25-34';
  if (age <= 44) return '35-44';
  return '45plus';
}

export const GENDER_LABELS: Record<string, string> = {
  feminino: 'Feminino',
  masculino: 'Masculino',
  nao_binario: 'Não binário',
  prefiro_nao_dizer: 'Prefere não dizer',
  unknown: 'Não informado',
};

export const genderKeyOf = (gender: string | null | undefined): string => gender || 'unknown';

function anySelected(selected: string[], matches: (value: string) => boolean) {
  return selected.length === 0 || selected.some(matches);
}

export function filterStudents<T extends Pick<StudentRiskData, 'patientId' | 'riskLevel' | 'lastTriageStatus' | 'entryCount' | 'criticalKeywordFlag'>>(
  students: T[],
  filters: StudentFilters,
  nameOf: (id: string) => string,
  overdueIds: Set<string>,
  academicOf?: (patientId: string) => AcademicPath | undefined,
  now: Date = new Date(),
): T[] {
  const search = filters.search.trim().toLocaleLowerCase('pt-BR');
  return students.filter((student) => {
    if (!anySelected(filters.risk, (risk) => risk === student.riskLevel)) return false;
    const status = student.lastTriageStatus;
    if (!anySelected(filters.status, (value) => statusMatches[value]?.(status) ?? false)) return false;
    if (!anySelected(filters.activity, (value) => (value === 'with' ? student.entryCount > 0 : student.entryCount === 0))) return false;
    if (!anySelected(filters.signal, (value) => (value === 'keywords' ? !!student.criticalKeywordFlag : overdueIds.has(student.patientId)))) return false;

    const path = academicOf?.(student.patientId);
    if (!anySelected(filters.unit, (value) => path?.unit === value)) return false;
    if (!anySelected(filters.course, (value) => path?.course === value)) return false;
    if (!anySelected(filters.shift, (value) => path?.shift === value)) return false;
    if (!anySelected(filters.class, (value) => path?.class === value)) return false;

    const gender = genderKeyOf((student as { gender?: string | null }).gender);
    if (!anySelected(filters.gender, (value) => value === gender)) return false;
    const ageRange = ageRangeOf((student as { birthDate?: string | null }).birthDate, now);
    if (!anySelected(filters.ageRange, (value) => value === ageRange)) return false;

    return !search || nameOf(student.patientId).toLocaleLowerCase('pt-BR').includes(search);
  });
}
