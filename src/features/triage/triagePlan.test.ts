import { describe, it, expect } from 'vitest';
import { followUpDate, suggestPlan } from './triagePlan';

describe('suggestPlan', () => {
  it('scales priority, action and follow-up with the risk level', () => {
    expect(suggestPlan('critical')).toEqual({ priority: 'urgent', action: 'refer_professional', followUpDays: 1 });
    expect(suggestPlan('alert')).toEqual({ priority: 'high', action: 'schedule_talk', followUpDays: 7 });
    expect(suggestPlan('attention')).toEqual({ priority: 'medium', action: 'monitor', followUpDays: 14 });
    expect(suggestPlan('healthy')).toEqual({ priority: 'low', action: 'monitor', followUpDays: 30 });
  });
  it('a grave diary keyword is urgent whatever the indicators say', () => {
    expect(suggestPlan('healthy', 'grave').priority).toBe('urgent');
  });
  it('students without data are checked again within a week', () => {
    expect(suggestPlan('no_data').followUpDays).toBe(7);
  });
});

describe('followUpDate', () => {
  it('formats a date input value N days ahead', () => {
    expect(followUpDate(7, new Date(2026, 9, 23))).toBe('2026-10-30');
  });
});
