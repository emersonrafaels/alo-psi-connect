import { describe, expect, it } from 'vitest';
import { DEMO_MODEL } from './permanenceModel';
import { makeEngine, visibleUnits, tilt, sum, contextFlags } from './permanenceLogic';

describe('Radar de Permanência', () => {
  it('hides units with fewer than 10 respondents', () => {
    const m = { ...DEMO_MODEL, units: [...DEMO_MODEL.units.slice(0, 2), { ...DEMO_MODEL.units[2], n: 9 }] };
    expect(visibleUnits(m).map((u) => u.k)).toEqual(['CT', 'IT']);
    expect(makeEngine(m, 'MC').CUR).toBeNull();
  });
  it('tilted distributions stay normalised to 100%', () => {
    expect(sum(tilt([3, 5, 14, 30, 48], 'protective', 0.5))).toBeCloseTo(100);
  });
  it('institution total is the respondent-weighted mean of units', () => {
    const e = makeEngine(DEMO_MODEL, 'all');
    expect(Math.round(e.scal(DEMO_MODEL.recov))).toBe(72);
  });
  it('context grid marks exactly the reported counts', () => {
    const f = contextFlags({ w: 38, c: 36, t: 47, a: 18 });
    expect(f.filter((x) => x.w).length).toBe(38);
    expect(f.filter((x) => x.c).length).toBe(36);
    expect(f.filter((x) => x.w && x.c && x.t).length).toBe(18);
  });
});

import { resolveModel } from './permanenceLogic';
describe('earlier semesters', () => {
  it('a positive shift makes risk answers more frequent', () => {
    const m = resolveModel(DEMO_MODEL, { shift_k: 1 });
    expect(m.items.aband.b[0]).toBe(76);
    expect(m.items.remat.b[4]).toBe(46);
  });
});
