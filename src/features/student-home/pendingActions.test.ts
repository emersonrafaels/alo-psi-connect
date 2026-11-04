import { describe, it, expect } from 'vitest';
import { buildPendingActions, type PendingInput } from './pendingActions';

const base: PendingInput = {
  now: new Date('2026-11-04T12:00:00Z'), lastDiaryDate: '2026-11-04', scales: [],
  currentSemester: '2026.2', radarSemesters: ['2026.2'], unreadMessages: 0, nextSessionAt: null, pendingPaymentAppointments: 0,
};

describe('buildPendingActions', () => {
  it('is empty when everything is up to date', () => {
    expect(buildPendingActions(base)).toEqual([]);
  });
  it('asks for the diary when the last entry was yesterday', () => {
    expect(buildPendingActions({ ...base, lastDiaryDate: '2026-11-03' }).map(a => a.id)).toEqual(['diary']);
  });
  it('asks for the radar when the current semester has no answer', () => {
    expect(buildPendingActions({ ...base, radarSemesters: ['2026.1'] }).map(a => a.id)).toEqual(['radar']);
  });
  it('flags a scale only after its frequency has passed', () => {
    const s = { code: 'WHO5', name: 'WHO-5', frequencyDays: 14 };
    expect(buildPendingActions({ ...base, scales: [{ ...s, lastTakenAt: '2026-10-25' }] })).toEqual([]);
    expect(buildPendingActions({ ...base, scales: [{ ...s, lastTakenAt: '2026-10-21' }] }).map(a => a.id)).toEqual(['scale-WHO5']);
  });
  it('puts an encontro within 24h first and caps at 5 items', () => {
    const r = buildPendingActions({ ...base, lastDiaryDate: null, radarSemesters: [], unreadMessages: 2, nextSessionAt: '2026-11-05T08:00:00Z',
      scales: ['A', 'B', 'C'].map(c => ({ code: c, name: c, frequencyDays: 7, lastTakenAt: null })) });
    expect(r).toHaveLength(5);
    expect(r[0].id).toBe('session');
  });
});
