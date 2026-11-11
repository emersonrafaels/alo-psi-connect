import { describe, it, expect } from 'vitest';
import { currentStreak, lastSevenDays, averageOf, compareTrend, shiftDate, pickPeriodWithData, periodStart } from './diaryStats';

describe('diaryStats', () => {
  it('shifts across month boundaries', () => {
    expect(shiftDate('2026-11-01', -1)).toBe('2026-10-31');
  });
  it('counts streak ending today', () => {
    expect(currentStreak(['2026-11-05', '2026-11-04', '2026-11-03', '2026-11-01'], '2026-11-05')).toBe(3);
  });
  it('keeps streak alive when today is not filled yet', () => {
    expect(currentStreak(['2026-11-04', '2026-11-03'], '2026-11-05')).toBe(2);
  });
  it('streak is zero after a missed day', () => {
    expect(currentStreak(['2026-11-03'], '2026-11-05')).toBe(0);
  });
  it('builds 7 days oldest first', () => {
    const days = lastSevenDays(['2026-11-05', '2026-10-30'], '2026-11-05');
    expect(days).toHaveLength(7);
    expect(days[0]).toEqual({ date: '2026-10-30', filled: true });
    expect(days[6]).toEqual({ date: '2026-11-05', filled: true });
    expect(days[3].filled).toBe(false);
  });
  it('averages ignoring nulls and returns null when empty', () => {
    expect(averageOf([4, null, 2])).toBe(3);
    expect(averageOf([null])).toBeNull();
  });
  it('trend uses rounded values', () => {
    expect(compareTrend(3.4, 3.1)).toBe('same');
    expect(compareTrend(4, 3)).toBe('up');
    expect(compareTrend(2, 3)).toBe('down');
    expect(compareTrend(null, 3)).toBeNull();
  });
});

describe('stats period selection', () => {
  const today = '2026-11-10';
  it('keeps 7 days when the last week has data', () => {
    expect(pickPeriodWithData([{ date: '2026-11-09', value: 3 }], today)).toBe('7');
  });
  it('moves to 15 days when the last week is empty but data is 10 days old', () => {
    expect(pickPeriodWithData([{ date: '2026-11-01', value: 4 }], today)).toBe('15');
  });
  it('moves to 30 days for data 20 days old', () => {
    expect(pickPeriodWithData([{ date: '2026-10-21', value: 4 }], today)).toBe('30');
  });
  it('moves to the whole history when data is older than 90 days', () => {
    expect(pickPeriodWithData([{ date: '2026-01-01', value: 2 }], today)).toBe('all');
  });
  it('keeps 7 days when there is no data at all', () => {
    expect(pickPeriodWithData([], today)).toBe('7');
    expect(pickPeriodWithData([{ date: '2026-11-09', value: null }], today)).toBe('7');
  });
  it('computes inclusive period starts', () => {
    expect(periodStart(today, '7')).toBe('2026-11-04');
    expect(periodStart(today, '30')).toBe('2026-10-12');
    expect(periodStart(today, 'all')).toBeNull();
  });
});
