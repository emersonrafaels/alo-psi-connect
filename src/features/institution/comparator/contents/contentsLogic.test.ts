import { describe, it, expect } from 'vitest';
import { conversion, themeGap, peakWeek, trailTrend, attendance, normToPeak } from './contentsLogic';

describe('contents rules', () => {
  it('conversion between ladder steps', () => expect(conversion(1200, 300)).toBe(25));
  it('theme with demand 30% above its offer share is a gap', () => { expect(themeGap(24, 12)).toBe('gap'); expect(themeGap(8, 20)).toBe('over'); expect(themeGap(10, 10)).toBe('balanced'); });
  it('peak week', () => expect(peakWeek([3, 9, 9, 2])).toBe(1));
  it('trail trend', () => { expect(trailTrend(60, 40)).toBe('up'); expect(trailTrend(30, 40)).toBe('down'); expect(trailTrend(40, 41)).toBe('flat'); });
  it('attendance', () => expect(attendance(431, 600)).toBe(72));
  it('normalizes to own peak', () => expect(normToPeak([5, 10])).toEqual([0.5, 1]));
});
