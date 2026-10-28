import { describe, it, expect } from 'vitest';
import { stageCounts, stageLosses, curve, links, pooledWait, type Flow } from './journeyLogic';

const f = (stage: number, n: number, extra: Partial<Flow> = {}): Flow => ({ sem: '2026.2', unit: 'A', origin: 'buddy', destination: 'psicologia', outcome: 'em_andamento', stage, n, ...extra });

describe('journey rules', () => {
  it('counts everyone who reached each stage', () => {
    expect(stageCounts([f(1, 10), f(3, 5), f(6, 2)])).toEqual([17, 7, 7, 2, 2, 2]);
  });
  it('flags the largest loss before the 1st consult', () => {
    const { losses, worst } = stageLosses([214, 198, 176, 161, 131, 94]);
    expect(losses).toEqual([16, 22, 15, 30, 37]);
    expect(worst).toBe(3);
  });
  it('curve is % of initial requests', () => expect(curve([200, 100, 50])).toEqual([100, 50, 25]));
  it('merges ribbons between the same nodes', () => {
    expect(links([f(1, 3), f(2, 4)], (x) => x.origin, (x) => x.destination)).toEqual([{ from: 'buddy', to: 'psicologia', n: 7 }]);
  });
  it('pools waits weighted by unit volume', () => {
    expect(pooledWait([{ sem: 's', unit: 'A', w1: 1, w2: null, w3: null, w4: null, total: 10 }, { sem: 's', unit: 'B', w1: 4, w2: null, w3: null, w4: null, total: 20 }], 'total', { A: 3, B: 1 })).toBe(12.5);
  });
});
