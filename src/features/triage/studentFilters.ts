import type { StudentRiskData } from '@/hooks/useStudentTriage';

export interface StudentFilters {
  risk: string;
  status: string;
  activity: string;
  signal: string;
  search: string;
}
export const emptyStudentFilters: StudentFilters = { risk: 'all', status: 'all', activity: 'all', signal: 'all', search: '' };

export function filterStudents<T extends Pick<StudentRiskData, 'patientId' | 'riskLevel' | 'lastTriageStatus' | 'entryCount' | 'criticalKeywordFlag'>>(
  students: T[], filters: StudentFilters, nameOf: (id: string) => string, overdueIds: Set<string>,
): T[] {
  const search = filters.search.trim().toLocaleLowerCase('pt-BR');
  return students.filter((student) => {
    if (filters.risk !== 'all' && student.riskLevel !== filters.risk) return false;
    const status = student.lastTriageStatus;
    if (filters.status === 'none' && status !== null) return false;
    if (filters.status === 'pending' && status !== 'pending') return false;
    if (filters.status === 'active' && status !== 'triaged' && status !== 'in_progress') return false;
    if (filters.status === 'resolved' && status !== 'resolved') return false;
    if (filters.activity === 'with' && student.entryCount === 0) return false;
    if (filters.activity === 'without' && student.entryCount > 0) return false;
    if (filters.signal === 'keywords' && !student.criticalKeywordFlag) return false;
    if (filters.signal === 'overdue' && !overdueIds.has(student.patientId)) return false;
    return !search || nameOf(student.patientId).toLocaleLowerCase('pt-BR').includes(search);
  });
}