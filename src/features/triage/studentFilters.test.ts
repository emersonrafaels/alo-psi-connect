import { describe, expect, it } from 'vitest';
import { ageRangeOf, emptyStudentFilters, filterStudents, type AcademicPath, type StudentFilters } from './studentFilters';

const students = [
  { patientId: '1', riskLevel: 'critical' as const, lastTriageStatus: 'pending', entryCount: 7, criticalKeywordFlag: { severity: 'grave' as const, hits: 1, lastDate: '2026-10-26' }, gender: 'feminino', birthDate: '2006-05-10' },
  { patientId: '2', riskLevel: 'alert' as const, lastTriageStatus: 'in_progress', entryCount: 3, gender: 'masculino', birthDate: '2000-01-15' },
  { patientId: '3', riskLevel: 'attention' as const, lastTriageStatus: null, entryCount: 0, gender: 'nao_binario', birthDate: '1990-07-20' },
  { patientId: '4', riskLevel: 'healthy' as const, lastTriageStatus: 'resolved', entryCount: 2, gender: null, birthDate: null },
  { patientId: '5', riskLevel: 'no_data' as const, lastTriageStatus: null, entryCount: 0, gender: 'feminino', birthDate: '1975-03-01' },
];
const paths: Record<string, AcademicPath> = {
  '1': { unit: 'Contagem', course: 'Medicina', shift: 'Manhã', class: 'M1-A' },
  '2': { unit: 'Contagem', course: 'Enfermagem', shift: 'Tarde', class: 'E2-B' },
  '3': { unit: 'Montes Claros', course: 'Medicina', shift: 'Manhã', class: 'M1-B' },
  '4': { unit: 'Montes Claros', course: 'Psicologia', shift: 'Noite', class: 'P3-A' },
  // '5' has no placement
};
const academicOf = (id: string) => paths[id];
const NOW = new Date('2026-10-26T12:00:00');
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

  const applyAcademic = (changes: Partial<StudentFilters>) =>
    filterStudents(students, { ...emptyStudentFilters, ...changes }, names, overdue, academicOf, NOW).map((student) => student.patientId);

  it('filters by unit', () => { expect(applyAcademic({ unit: ['Contagem'] })).toEqual(['1', '2']); });
  it('filters by course and shift together', () => { expect(applyAcademic({ course: ['Medicina'], shift: ['Manhã'] })).toEqual(['1', '3']); });
  it('filters by several classes at once', () => { expect(applyAcademic({ class: ['M1-A', 'P3-A'] })).toEqual(['1', '4']); });
  it('excludes students without placement when an academic filter is active', () => { expect(applyAcademic({ unit: ['Contagem', 'Montes Claros'] })).toEqual(['1', '2', '3', '4']); });
  it('filters by gender including not informed', () => {
    expect(applyAcademic({ gender: ['feminino'] })).toEqual(['1', '5']);
    expect(applyAcademic({ gender: ['unknown'] })).toEqual(['4']);
  });
  it('filters by age range', () => {
    expect(applyAcademic({ ageRange: ['under18'] })).toEqual([]); // 2006-05-10 is 20 at NOW
    expect(applyAcademic({ ageRange: ['18-24'] })).toEqual(['1']);
    expect(applyAcademic({ ageRange: ['25-34'] })).toEqual(['2']);
    expect(applyAcademic({ ageRange: ['35-44'] })).toEqual(['3']);
    expect(applyAcademic({ ageRange: ['45plus', 'unknown'] })).toEqual(['4', '5']);
  });
  it('combines academic with cadastral filters', () => { expect(applyAcademic({ unit: ['Contagem'], gender: ['masculino'] })).toEqual(['2']); });
});

describe('ageRangeOf', () => {
  const now = new Date('2026-10-26T12:00:00');
  it('handles missing or invalid dates', () => {
    expect(ageRangeOf(null, now)).toBe('unknown');
    expect(ageRangeOf('not-a-date', now)).toBe('unknown');
  });
  it('respects whether the birthday already happened this year', () => {
    expect(ageRangeOf('2008-10-26', now)).toBe('18-24'); // turns 18 today
    expect(ageRangeOf('2008-10-27', now)).toBe('under18');
    expect(ageRangeOf('2008-10-25', now)).toBe('18-24');
  });
});
