import { describe, expect, it } from 'vitest';
import { emptyStudentFilters, filterStudents, type StudentFilters } from './studentFilters';

const students = [
  { patientId: '1', riskLevel: 'critical' as const, lastTriageStatus: 'pending', entryCount: 7, criticalKeywordFlag: { severity: 'grave' as const, hits: 1, lastDate: '2026-10-26' } },
  { patientId: '2', riskLevel: 'alert' as const, lastTriageStatus: 'in_progress', entryCount: 3 },
  { patientId: '3', riskLevel: 'attention' as const, lastTriageStatus: null, entryCount: 0 },
  { patientId: '4', riskLevel: 'healthy' as const, lastTriageStatus: 'resolved', entryCount: 2 },
  { patientId: '5', riskLevel: 'no_data' as const, lastTriageStatus: null, entryCount: 0 },
];
const names = (id: string) => `Aluno #${id}`;
const overdue = new Set(['2']);
const apply = (changes: Partial<StudentFilters>) => filterStudents(students, { ...emptyStudentFilters, ...changes }, names, overdue).map((student) => student.patientId);

describe('all-students filters', () => {
  it('includes all five levels regardless of triage eligibility', () => { expect(apply({})).toEqual(['1', '2', '3', '4', '5']); });
  it('filters a single risk level', () => { expect(apply({ risk: ['alert'] })).toEqual(['2']); });
  it('filters several risk levels at once', () => { expect(apply({ risk: ['critical', 'alert'] })).toEqual(['1', '2']); });
  it('filters several statuses at once', () => { expect(apply({ status: ['none', 'resolved'] })).toEqual(['3', '4', '5']); });
  it('filters several activity options at once', () => {
    expect(apply({ activity: ['without'] })).toEqual(['3', '5']);
    expect(apply({ activity: ['with', 'without'] })).toEqual(['1', '2', '3', '4', '5']);
  });
  it('filters several signals at once', () => { expect(apply({ signal: ['keywords', 'overdue'] })).toEqual(['1', '2']); });
  it('combines multi-select risk with status and activity', () => { expect(apply({ risk: ['alert', 'attention'], status: ['active', 'none'], activity: ['with'] })).toEqual(['2']); });
  it('searches only the anonymized label', () => { expect(apply({ search: ' aluno #3 ' })).toEqual(['3']); });
});
