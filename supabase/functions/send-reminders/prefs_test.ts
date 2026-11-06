import { assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts';
import { isDueNow, buildFilteredReminders, DEFAULT_PREFS } from './rules.ts';

// 2026-11-09 is a Monday; 12:00 UTC = 9h Brasília
const mon9 = new Date('2026-11-09T12:00:00Z');
const tue9 = new Date('2026-11-10T12:00:00Z');
Deno.test('weekly only on chosen weekday', () => {
  const p = { ...DEFAULT_PREFS, frequency: 'weekly' as const, weekday: 1 };
  assertEquals(isDueNow(p, mon9, null), true);
  assertEquals(isDueNow(p, tue9, null), false);
});
Deno.test('3x week only mon/wed/fri', () => {
  const p = { ...DEFAULT_PREFS, frequency: '3x_week' as const };
  assertEquals(isDueNow(p, mon9, null), true);
  assertEquals(isDueNow(p, tue9, null), false);
});
Deno.test('hour respected', () => {
  assertEquals(isDueNow({ ...DEFAULT_PREFS, hour: 19 }, mon9, null), false);
  assertEquals(isDueNow({ ...DEFAULT_PREFS, hour: 19 }, new Date('2026-11-09T22:00:00Z'), null), true);
});
Deno.test('not twice the same day', () => {
  assertEquals(isDueNow(DEFAULT_PREFS, mon9, '2026-11-09T11:00:00Z'), false);
});
const input = { now: mon9, lastDiary: '2026-11-06', radarSemesters: [], semester: '2026.2', sessionsToday: ['Roda'] };
Deno.test('unchecked types excluded', () => {
  assertEquals(buildFilteredReminders(input, 'pt', { ...DEFAULT_PREFS, types: ['session'] }).length, 1);
});
Deno.test('diary gap threshold', () => {
  assertEquals(buildFilteredReminders(input, 'pt', { ...DEFAULT_PREFS, types: ['diary'], diary_gap_days: 5 }).length, 0);
  assertEquals(buildFilteredReminders(input, 'pt', { ...DEFAULT_PREFS, types: ['diary'], diary_gap_days: 3 }).length, 1);
});
