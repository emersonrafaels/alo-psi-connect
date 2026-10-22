import { describe, it, expect } from 'vitest';
import { buildPriorities, buildActions } from './priorities';

const base = { lastTriageStatus: null, moodTrend: null } as const;

describe('buildPriorities', () => {
  it('grave keyword comes first, then critical pending, then overdue follow-up', () => {
    const list = buildPriorities([
      { ...base, patientId: 'fu', riskLevel: 'attention', lastTriageStatus: 'triaged', overdueFollowUp: true },
      { ...base, patientId: 'crit', riskLevel: 'critical' },
      { ...base, patientId: 'grave', riskLevel: 'healthy', criticalSeverity: 'grave' },
    ], 15);
    expect(list.map((p) => p.student.patientId)).toEqual(['grave', 'crit', 'fu']);
  });
  it('healthy students without signals are not listed', () => {
    expect(buildPriorities([{ ...base, patientId: 'h', riskLevel: 'healthy' }], 15)).toEqual([]);
  });
});

describe('buildActions', () => {
  it('only shows actions that have students', () => {
    expect(buildActions({ criticalPending: 2, overdueFollowUps: 0, keywordStudents: 0, noData: 5 }).map((a) => a.key)).toEqual(['critical', 'no_data']);
  });
});
