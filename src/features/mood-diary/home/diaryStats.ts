/** Pure helpers for the Diário Emocional home page. Dates are local YYYY-MM-DD strings. */

export function shiftDate(date: string, days: number): string {
  const [y, m, d] = date.split('-').map(Number);
  const dt = new Date(y, m - 1, d + days);
  const mm = String(dt.getMonth() + 1).padStart(2, '0');
  const dd = String(dt.getDate()).padStart(2, '0');
  return `${dt.getFullYear()}-${mm}-${dd}`;
}

/** Consecutive days with an entry, ending today (or yesterday if today is not filled yet). */
export function currentStreak(dates: string[], today: string): number {
  const set = new Set(dates);
  let cursor = set.has(today) ? today : shiftDate(today, -1);
  let count = 0;
  while (set.has(cursor)) {
    count++;
    cursor = shiftDate(cursor, -1);
  }
  return count;
}

/** The last 7 days (oldest first) with whether each has an entry. */
export function lastSevenDays(dates: string[], today: string): { date: string; filled: boolean }[] {
  const set = new Set(dates);
  return Array.from({ length: 7 }, (_, i) => {
    const date = shiftDate(today, i - 6);
    return { date, filled: set.has(date) };
  });
}

/** Average of non-null values; null when there is nothing to average. */
export function averageOf(values: (number | null | undefined)[]): number | null {
  const nums = values.filter((v): v is number => typeof v === 'number' && !Number.isNaN(v));
  if (nums.length === 0) return null;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

export type Trend = 'up' | 'down' | 'same' | null;

/** Compares rounded averages so the trend matches the integers shown on screen. */
export function compareTrend(current: number | null, previous: number | null): Trend {
  if (current === null || previous === null) return null;
  const c = Math.round(current);
  const p = Math.round(previous);
  return c > p ? 'up' : c < p ? 'down' : 'same';
}

/** Periods the stats card can analyse; `null` days = whole history. */
export const STAT_PERIODS = [
  { key: '7', days: 7, label: '7 dias' },
  { key: '15', days: 15, label: '15 dias' },
  { key: '30', days: 30, label: '30 dias' },
  { key: '90', days: 90, label: '90 dias' },
  { key: 'all', days: null, label: 'Todo o período' },
] as const;

export type StatPeriodKey = (typeof STAT_PERIODS)[number]['key'];

/** First date (inclusive) of a period ending today; null for the whole history. */
export function periodStart(today: string, key: StatPeriodKey): string | null {
  const p = STAT_PERIODS.find(x => x.key === key)!;
  return p.days === null ? null : shiftDate(today, -(p.days - 1));
}

/**
 * Shortest period whose window has at least one value. Falls back to '7'
 * when there is no data at all, so the card keeps its default.
 */
export function pickPeriodWithData(
  points: { date: string; value: number | null | undefined }[],
  today: string,
): StatPeriodKey {
  const dated = points.filter(p => typeof p.value === 'number' && !Number.isNaN(p.value) && p.date <= today);
  if (dated.length === 0) return '7';
  for (const p of STAT_PERIODS) {
    const start = periodStart(today, p.key);
    if (start === null || dated.some(d => d.date >= start)) return p.key;
  }
  return '7';
}
