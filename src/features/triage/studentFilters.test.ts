import { describe, expect, it } from 'vitest';
import { emptyStudentFilters, filterStudents } from './studentFilters';

const students = [
  { patientId: '1', riskLevel: 'critical' as const, lastTriageStatus: 'pending', entryCount: 7, criticalKeywordFlag: { severity: 'grave' as const, hits: 1, lastDate: '2026-10-26' } },
  { patientId: '2', riskLevel: 'alert' as const, lastTriageStatus: 'in_progress', entryCount: 3 },
  { patientId: '3', riskLevel: 'attention' as const, lastTriageStatus: null, entryCount: 0 },
  { patientId: '4', riskLevel: 'healthy' as const, lastTriageStatus: 'resolved', entryCount: 2 },
  { patientId: '5', riskLevel: 'no_data' as const, lastTriageStatus: null, entryCount: 0 },
];
const names = (id: string) => `Aluno #${id}`;
const overdue = new Set(['2']);
const apply = (changes: Partial<typeof emptyStudentFilters>) => filterStudents(students, { ...emptyStudentFilters, ...changes }, names, overdue).map((student) => student.patientId);

describe('all-students filters', () => {
  it('includes all five levels regardless of triage eligibility', () => { expect(apply({})).toEqual(['1', '2', '3', '4', '5']); });
  it('filters Alerta', () => { expect(apply({ risk: 'alert' })).toEqual(['2']); });
  it('filters Atenção', () => { expect(apply({ risk: 'attention' })).toEqual(['3']); });
  it('combines risk with status and activity', () => { expect(apply({ risk: 'alert', status: 'active', activity: 'with' })).toEqual(['2']); expect(apply({ risk: 'alert', status: 'resolved' })).toEqual([]); });
  it('filters students without records', () => { expect(apply({ activity: 'without' })).toEqual(['3', '5']); });
  it('filters overdue follow-ups', () => { expect(apply({ signal: 'overdue' })).toEqual(['2']); });
  it('filters detected critical signals', () => { expect(apply({ signal: 'keywords' })).toEqual(['1']); });
  it('searches only the anonymized label', () => { expect(apply({ search: ' aluno #3 ' })).toEqual(['3']); });
  it('filters students without a triage separately from pending', () => { expect(apply({ status: 'none' })).toEqual(['3', '5']); expect(apply({ status: 'pending' })).toEqual(['1']); });
});