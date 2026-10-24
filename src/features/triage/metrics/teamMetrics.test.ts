import { describe, it, expect } from 'vitest';
import {
  computeBreakdowns, computeHeadline, computeOutcomes, median, percentile, periodWindows, scope, weeklyFlow,
  type MetricsRecord, type MetricsStudent,
} from './teamMetrics';

const NOW = new Date(2026, 9, 23, 15, 0); // 23/10/2026 15:00 local
const daysAgo = (d: number, hour = 12) => new Date(2026, 9, 23 - d, hour).toISOString();

let seq = 0;
const rec = (over: Partial<MetricsRecord>): MetricsRecord => ({
  id: `t${++seq}`, patient_id: `p${seq}`, triaged_by_name: 'Ana', status: 'triaged', risk_level: 'critical',
  priority: 'urgent', recommended_action: 'refer_professional', follow_up_date: null,
  created_at: daysAgo(1), resolved_at: null, ...over,
});

describe('median / percentile', () => {
  it('handle even, odd and empty lists', () => {
    expect(median([3, 1, 2])).toBe(2);
    expect(median([4, 1, 2, 3])).toBe(2.5);
    expect(median([])).toBeNull();
    expect(percentile([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 90)).toBe(9);
  });
});

describe('periodWindows', () => {
  it('current starts at midnight N days ago; previous is the same length before it', () => {
    const { current, previous } = periodWindows(7, NOW);
    expect(current.start).toEqual(new Date(2026, 9, 16));
    expect(previous.start).toEqual(new Date(2026, 9, 9));
    expect(previous.end.getTime()).toBe(current.start.getTime() - 1);
  });
});

describe('computeHeadline', () => {
  const records = [
    rec({ created_at: daysAgo(3) }),                                                     // open, current period
    rec({ created_at: daysAgo(5), status: 'resolved', resolved_at: daysAgo(1) }),        // resolved in 4 days
    rec({ created_at: daysAgo(10), status: 'resolved', resolved_at: daysAgo(8) }),       // previous period, 2 days
    rec({ created_at: daysAgo(40), status: 'in_progress', follow_up_date: '2026-10-20' }), // stale and overdue
    rec({ created_at: daysAgo(2), follow_up_date: '2026-10-30' }),                        // follow-up on time
    rec({ created_at: daysAgo(20), status: 'triaged', reopened_at: daysAgo(2) }),         // reopened this period
  ];
  const students: MetricsStudent[] = [
    { patientId: 'a', riskLevel: 'critical', lastTriageStatus: 'triaged' },
    { patientId: 'b', riskLevel: 'critical', lastTriageStatus: null },
    { patientId: 'c', riskLevel: 'critical', lastTriageStatus: 'pending' },
    { patientId: 'd', riskLevel: 'alert', lastTriageStatus: 'resolved' },
  ];
  const h = computeHeadline(records, students, 7, NOW);

  it('counts triages and resolutions per window', () => {
    expect(h.triaged).toEqual({ current: 3, previous: 1 });
    expect(h.resolved).toEqual({ current: 1, previous: 1 });
  });
  it('resolution time uses the median of the window', () => {
    expect(h.resolutionDays.median).toBe(4);
    expect(h.resolutionDays.previousMedian).toBe(2);
  });
  it('coverage follows the queue rule (null or pending = not covered)', () => {
    expect(h.coverage.critical).toEqual({ triaged: 1, total: 3 });
    expect(h.coverage.alert).toEqual({ triaged: 1, total: 1 });
  });
  it('backlog, stale cases, follow-ups and reopenings', () => {
    expect(h.backlog.open).toBe(4);
    expect(h.backlog.stale).toBe(1);
    expect(h.followUps).toEqual({ withDate: 2, onTime: 1, overdue: 1 });
    expect(h.reopen).toEqual({ reopened: 1, resolved: 1 });
  });
});

describe('weeklyFlow', () => {
  it('buckets entries, resolutions and end-of-week backlog, oldest first', () => {
    const weeks = weeklyFlow([
      rec({ created_at: daysAgo(1), priority: 'high' }),
      rec({ created_at: daysAgo(9), status: 'resolved', resolved_at: daysAgo(2) }),
    ], NOW, 2);
    expect(weeks).toHaveLength(2);
    expect(weeks[0]).toMatchObject({ key: '2026-10-10', created: 1, resolved: 0, backlog: 1 });
    expect(weeks[0].byPriority.urgent).toEqual({ created: 1, resolvedSoFar: 1 });
    expect(weeks[1]).toMatchObject({ key: '2026-10-17', created: 1, resolved: 1, backlog: 1 });
    expect(weeks[1].byPriority.high).toEqual({ created: 1, resolvedSoFar: 0 });
  });
});

describe('scope + computeBreakdowns', () => {
  const records = [
    rec({ created_at: daysAgo(2), priority: 'urgent', triaged_by_name: 'Ana' }),
    rec({ created_at: daysAgo(3), priority: 'low', triaged_by_name: 'Bia', recommended_action: 'monitor', status: 'resolved', resolved_at: daysAgo(1), resolution_type: 'sem_necessidade' }),
    rec({ created_at: daysAgo(12), priority: 'urgent', triaged_by_name: 'Ana' }),
  ];
  it('period scope groups by priority, action, resolution type and person', () => {
    const { records: list, window } = scope(records, null, periodWindows(7, NOW).current);
    const b = computeBreakdowns(list, window);
    expect(b.byPriority.urgent).toMatchObject({ created: 1, open: 2 });
    expect(b.byPriority.low).toMatchObject({ created: 1, resolved: 1, medianDays: 2 });
    expect(b.byResolution).toEqual([{ key: 'sem_necessidade', count: 1 }]);
    // One triage each in the period; Bia resolved hers, so she ranks first.
    expect(b.team.map((t) => t.name)).toEqual(['Bia', 'Ana']);
    expect(b.team.find((t) => t.name === 'Ana')).toMatchObject({ triaged: 1, open: 2 });
  });
  it('a 3D selection narrows to one priority and one week', () => {
    const { records: list, window } = scope(records, { priority: 'urgent', weekStart: '2026-10-10' }, periodWindows(7, NOW).current);
    const b = computeBreakdowns(list, window);
    expect(b.byPriority.urgent.created).toBe(1);
    expect(b.byPriority.low.created).toBe(0);
  });
});

describe('computeOutcomes', () => {
  it('compares the risk at triage with the current risk of each student', () => {
    const w = periodWindows(15, NOW).current;
    const records = [
      rec({ patient_id: 'up', risk_level: 'critical', status: 'resolved', resolved_at: daysAgo(1) }),
      rec({ patient_id: 'same', risk_level: 'alert', status: 'resolved', resolved_at: daysAgo(1) }),
      rec({ patient_id: 'down', risk_level: 'attention', status: 'resolved', resolved_at: daysAgo(1) }),
      rec({ patient_id: 'gone', risk_level: 'alert', status: 'resolved', resolved_at: daysAgo(1) }),
      rec({ patient_id: 'old', risk_level: 'alert', status: 'resolved', resolved_at: daysAgo(40) }),
    ];
    const students: MetricsStudent[] = [
      { patientId: 'up', riskLevel: 'attention', lastTriageStatus: 'resolved' },
      { patientId: 'same', riskLevel: 'alert', lastTriageStatus: 'resolved' },
      { patientId: 'down', riskLevel: 'critical', lastTriageStatus: 'resolved' },
      { patientId: 'gone', riskLevel: 'no_data', lastTriageStatus: 'resolved' },
      { patientId: 'old', riskLevel: 'healthy', lastTriageStatus: 'resolved' },
    ];
    expect(computeOutcomes(records, students, w)).toEqual({ improved: 1, stable: 1, worsened: 1, noData: 1, total: 4 });
  });
});
