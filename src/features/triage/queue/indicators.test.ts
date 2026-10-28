import { describe, it, expect } from 'vitest';
import { riskReasons, riskDrivers, sortPending, type IndicatorInput } from './indicators';

const base: IndicatorInput = {
  riskLevel: 'healthy', avgMood: 4, avgAnxiety: 2, avgEnergy: 4, avgSleep: 4, moodTrend: null, entryCount: 10,
};

describe('riskDrivers / riskReasons', () => {
  it('lists the worst indicators first in plain language', () => {
    const s = { ...base, riskLevel: 'critical' as const, avgMood: 1, avgAnxiety: 5, avgEnergy: 2, avgSleep: 2 };
    expect(riskDrivers(s).map((d) => d.key)).toEqual(['mood', 'anxiety', 'sleep', 'energy']);
    expect(riskReasons(s)).toEqual(['Humor médio baixo', 'Ansiedade elevada', 'Sono baixo', 'Registros insuficientes para tendência']);
  });
  it('shows a relevant mood drop only as a complementary reason, without a percentage', () => {
    expect(riskReasons({ ...base, avgMood: 3, moodTrend: -45 })).toEqual(['Humor médio baixo', 'Queda relevante de humor']);
  });
  it('returns nothing for a healthy student', () => {
    expect(riskReasons({ ...base, moodTrend: 0 })).toEqual([]);
  });
});

describe('sortPending', () => {
  const rows = [
    { ...base, id: 'alert', riskLevel: 'alert' as const, avgMood: 2.2 },
    { ...base, id: 'crit-mild', riskLevel: 'critical' as const, avgMood: 1.5 },
    { ...base, id: 'crit-keyword', riskLevel: 'critical' as const, avgMood: 3, criticalKeywordFlag: { severity: 'grave' as const } },
    { ...base, id: 'crit-severe', riskLevel: 'critical' as const, avgMood: 1, avgAnxiety: 5 },
    { ...base, id: 'no-data', riskLevel: 'no_data' as const, avgMood: null, avgAnxiety: null, entryCount: 0 },
  ];
  it('urgency: risk level, then keyword, then indicator severity', () => {
    expect(sortPending(rows, 'urgency').map((r) => r.id)).toEqual(['crit-keyword', 'crit-severe', 'crit-mild', 'alert', 'no-data']);
  });
  it('anxiety: highest first, missing values last', () => {
    expect(sortPending(rows, 'anxiety').map((r) => r.id)[0]).toBe('crit-severe');
    expect(sortPending(rows, 'anxiety').at(-1)!.id).toBe('no-data');
  });
  it('engagement: fewest diary entries first', () => {
    expect(sortPending(rows, 'engagement')[0].id).toBe('no-data');
  });
});
