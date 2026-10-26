import { describe, it, expect } from 'vitest';
import { buildPriorities, buildActions, isAwaitingTriage, type Risk } from './priorities';

const base = { lastTriageStatus: null, moodTrend: null } as const;

describe('pending triage eligibility', () => {
  it.each(['alert', 'attention', 'healthy', 'no_data'] as Risk[])('excludes %s even without a triage or with pending status', (riskLevel) => {
    expect(isAwaitingTriage({ riskLevel, lastTriageStatus: null })).toBe(false);
    expect(isAwaitingTriage({ riskLevel, lastTriageStatus: 'pending' })).toBe(false);
  });
  it('includes only Em Risco without a triage or with pending status', () => {
    expect(isAwaitingTriage({ riskLevel: 'critical', lastTriageStatus: null })).toBe(true);
    expect(isAwaitingTriage({ riskLevel: 'critical', lastTriageStatus: 'pending' })).toBe(true);
  });
  it.each(['triaged', 'in_progress', 'resolved'])('keeps Em Risco with %s outside the pending queue', (lastTriageStatus) => {
    expect(isAwaitingTriage({ riskLevel: 'critical', lastTriageStatus })).toBe(false);
  });
});

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
