import { describe, expect, it } from 'bun:test';
import { isPortalQueryStale } from './portalFreshness';

describe('isPortalQueryStale', () => {
  const now = 10_000_000;
  it('refreshes summaries older than 60s', () => {
    expect(isPortalQueryStale(['summary'], now - 61_000, now)).toBe(true);
    expect(isPortalQueryStale(['summary'], now - 30_000, now)).toBe(false);
  });
  it('keeps student rosters for 5 minutes', () => {
    expect(isPortalQueryStale(['patient-institutions', 'x'], now - 120_000, now)).toBe(false);
    expect(isPortalQueryStale(['patient-institutions', 'x'], now - 301_000, now)).toBe(true);
  });
});
