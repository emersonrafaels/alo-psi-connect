/** Summary-type data refreshes after 60s; full student rosters after 5 min. */
export const SUMMARY_FRESH_MS = 60_000;
export const ROSTER_FRESH_MS = 5 * 60_000;
const ROSTER_KEYS = new Set(['patient-institutions', 'institution-students', 'student-triage-data']);

export function isPortalQueryStale(key: readonly unknown[], updatedAt: number, now: number): boolean {
  if (!updatedAt) return true;
  const window = ROSTER_KEYS.has(String(key[0])) ? ROSTER_FRESH_MS : SUMMARY_FRESH_MS;
  return now - updatedAt >= window;
}
