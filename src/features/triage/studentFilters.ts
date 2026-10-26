import type { StudentRiskData } from '@/hooks/useStudentTriage';

export type StudentMultiFilter = 'risk' | 'status' | 'activity' | 'signal';

export interface StudentFilters {
  /** An empty array means "no restriction" for that facet. */
  risk: string[];
  status: string[];
  activity: string[];
  signal: string[];
  search: string;
}

export const emptyStudentFilters: StudentFilters = { risk: [], status: [], activity: [], signal: [], search: '' };

const statusMatches: Record<string, (status: string | null) => boolean> = {
  none: (status) => status === null,
  pending: (status) => status === 'pending',
  active: (status) => status === 'triaged' || status === 'in_progress',
  resolved: (status) => status === 'resolved',
};

function anySelected(selected: string[], matches: (value: string) => boolean) {
  return selected.length === 0 || selected.some(matches);
}

export function filterStudents<T extends Pick<StudentRiskData, 'patientId' | 'riskLevel' | 'lastTriageStatus' | 'entryCount' | 'criticalKeywordFlag'>>(
  students: T[], filters: StudentFilters, nameOf: (id: string) => string, overdueIds: Set<string>,
): T[] {
  const search = filters.search.trim().toLocaleLowerCase('pt-BR');
  return students.filter((student) => {
    if (!anySelected(filters.risk, (risk) => risk === student.riskLevel)) return false;
    const status = student.lastTriageStatus;
    if (!anySelected(filters.status, (value) => statusMatches[value]?.(status) ?? false)) return false;
    if (!anySelected(filters.activity, (value) => (value === 'with' ? student.entryCount > 0 : student.entryCount === 0))) return false;
    if (!anySelected(filters.signal, (value) => (value === 'keywords' ? !!student.criticalKeywordFlag : overdueIds.has(student.patientId)))) return false;
    return !search || nameOf(student.patientId).toLocaleLowerCase('pt-BR').includes(search);
  });
}
