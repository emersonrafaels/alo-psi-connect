import { describe, it, expect } from 'vitest';
import { relDistance, buildChanges, distanceTone, meanDistance } from './overviewLogic';

describe('relDistance', () => {
  it('positive when wellbeing is higher', () => expect(relDistance(true, 55, 50)).toBeCloseTo(10));
  it('inverts symptom scales: lower symptoms is better', () => expect(relDistance(false, 9, 10)).toBeCloseTo(10));
  it('null when a protected group has no average', () => expect(relDistance(true, null, 50)).toBeNull());
});

describe('meanDistance', () => {
  it('ignores missing scales', () => expect(meanDistance([10, null, -4])).toBe(3));
});

describe('distanceTone', () => {
  it('buckets by ±3% and ±8%', () => {
    expect(distanceTone(-9)).toBe('worse2');
    expect(distanceTone(-5)).toBe('worse1');
    expect(distanceTone(1)).toBe('near');
    expect(distanceTone(5)).toBe('better1');
    expect(distanceTone(8)).toBe('better2');
  });
});

describe('buildChanges', () => {
  const base = { previous: '2026.1', population: 2806, whoPrevN: 1380, unitDistances: [] };
  it('reports WHO-5 rise with band', () => {
    const c = buildChanges({ ...base, who: { n: 1549, avg: 48.9 }, whoPrev: { n: 1380, avg: 47.8 } });
    expect(c[0].strong).toBe('Bem-estar mental subiu para 48,9');
    expect(c[0].rest).toContain('faixa Baixo');
    expect(c[0].tone).toBe('good');
  });
  it('reports coverage in p.p.', () => {
    const c = buildChanges({ ...base, who: { n: 1549, avg: 48.9 }, whoPrev: { n: 1380, avg: 47.8 } });
    expect(c[1].strong).toBe('Cobertura do WHO-5 em 55%');
    expect(c[1].rest).toContain('+6 p.p.');
  });
  it('names units above and below in every scale', () => {
    const c = buildChanges({ ...base, who: { n: 0, avg: null }, whoPrev: { n: 0, avg: null },
      unitDistances: [{ unit: 'Montes Claros', values: [3, 5] }, { unit: 'Contagem', values: [-2, -1] }, { unit: 'Itajubá', values: [1, -1] }] });
    expect(c[0].strong).toContain('Montes Claros');
    expect(c[0].rest).toContain('Contagem');
    expect(c).toHaveLength(1);
  });
});
