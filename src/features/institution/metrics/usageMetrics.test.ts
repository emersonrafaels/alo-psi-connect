import { describe, it, expect } from 'vitest';
import { pct, deltaPct, funnelSteps, heatmapMatrix, featureRanking } from './usageMetrics';

describe('usageMetrics', () => {
  it('pct returns null without base', () => {
    expect(pct(5, 0)).toBeNull();
    expect(pct(1942, 2806)).toBe(69);
  });
  it('deltaPct compares with previous period', () => {
    expect(deltaPct(1942, 1661)).toBe(17);
    expect(deltaPct(10, 0)).toBeNull();
  });
  it('funnel percentages are relative to linked students', () => {
    const s = funnelSteps({ linked: 200, accessed: 100, one_feature: 50, three_features: 10, recurring: 20 });
    expect(s.map((x) => x.pctOfLinked)).toEqual([100, 50, 25, 5, 10]);
  });
  it('heatmap ignores out-of-range cells', () => {
    const { matrix, max } = heatmapMatrix([{ dow: 1, slot: 2, n: 7 }, { dow: 9, slot: 0, n: 99 }]);
    expect(matrix[1][2]).toBe(7);
    expect(max).toBe(7);
  });
  it('feature ranking sorts by students', () => {
    expect(featureRanking({ diario: 3, buddy: 9 }, 10)[0].key).toBe('buddy');
  });
});
