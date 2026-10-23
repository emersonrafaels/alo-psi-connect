import { describe, it, expect } from 'vitest';
import { riskReasons, riskDrivers, sortPending, type IndicatorInput } from './indicators';

const base: IndicatorInput = {
  riskLevel: 'healthy', avgMood: 4, avgAnxiety: 2, avgEnergy: 4, avgSleep: 4, moodTrend: null, entryCount: 10,
};

describe('riskDrivers / riskReasons', () => {
  it('lists the worst indicators first in plain language', () => {
    const s = { ...base, riskLevel: 'critical' as const, avgMood: 1, avgAnxiety: 5, avgEnergy: 2, avgSleep: 2 };
    expect(riskDrivers(s).map((d) => d.key)).toEqual(['mood', 'anxiety', 'sleep', 'energy']);
    expect(riskReasons(s)).toEqual(['Humor muito baixo', 'Ansiedade muito alta', 'Sono ruim']);
  });
  it('falls back to attention-level indicators and adds a steep mood drop', () => {
    expect(riskReasons({ ...base, avgMood: 3, moodTrend: -35 })).toEqual(['Humor abaixo do esperado', 'Humor caiu 35%']);
  });
  it('returns nothing for a healthy student', () => {
    expect(riskReasons(base)).toEqual([]);
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
