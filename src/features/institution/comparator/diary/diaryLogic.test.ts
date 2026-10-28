import { describe, it, expect } from 'vitest';
import { examWeeks, dev, examInsight, hardestLightest, ppChange } from './diaryLogic';

describe('diary rules', () => {
  it('marks weeks where Provas is well above normal', () => expect(examWeeks([10, 12, 11, 35, 40, 12])).toEqual([false, false, false, true, true, false]));
  it('never marks low shares as exam weeks', () => expect(examWeeks([2, 3, 6]).some(Boolean)).toBe(false));
  it('deviation from the semester mean', () => expect(dev(2.9, 3.3)).toBe(-0.4));
  it('compares mood in and out of exam weeks, sleep leading', () => {
    const r = examInsight([3.4, 3.4, 2.9, 2.9, 3.4], [3.3, 2.9, 2.7, 2.7, 3.2], [false, false, true, true, false])!;
    expect(r.during).toBeCloseTo(2.9); expect(r.outside).toBeCloseTo(3.4); expect(r.sleepLeads).toBe(true);
  });
  it('finds hardest and lightest weekday', () => expect(hardestLightest([{ dow: 1, mood: 3.0 }, { dow: 5, mood: 3.5 }, { dow: 3, mood: 3.2 }])).toEqual({ hardest: 1, lightest: 5 }));
  it('hides change without previous base', () => { expect(ppChange(24, null)).toBeNull(); expect(ppChange(24, 21)).toBe(3); });
});
