import { assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts';
import { buildReminders } from './rules.ts';

const now = new Date('2026-11-05T12:00:00Z');
Deno.test('diary reminder only after 2 idle days', () => {
  assertEquals(buildReminders({ now, lastDiary: '2026-11-04', radarSemesters: ['2026.2'], semester: '2026.2', sessionsToday: [] }, 'pt'), []);
  assertEquals(buildReminders({ now, lastDiary: '2026-11-03', radarSemesters: ['2026.2'], semester: '2026.2', sessionsToday: [] }, 'pt').length, 1);
});
Deno.test('english texts and radar pending', () => {
  const r = buildReminders({ now, lastDiary: '2026-11-05', radarSemesters: [], semester: '2026.2', sessionsToday: ['Roda'] }, 'en');
  assertEquals(r, ['Answer the Retention Radar for semester 2026.2.', 'You have a session today: Roda.']);
});
