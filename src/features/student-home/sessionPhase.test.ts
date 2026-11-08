import { describe, it, expect } from 'vitest';
import { sessionPhase, countdownLabel } from './pendingActions';
const now = new Date('2026-11-08T10:00:00');
describe('sessionPhase', () => {
  it('upcoming when more than 15 min away', () => expect(sessionPhase('2026-11-08T10:16:00', 60, now)).toBe('upcoming'));
  it('joinable at exactly 15 min before', () => expect(sessionPhase('2026-11-08T10:15:00', 60, now)).toBe('joinable'));
  it('live during duration', () => expect(sessionPhase('2026-11-08T09:30:00', 45, now)).toBe('live'));
  it('ended after duration', () => expect(sessionPhase('2026-11-08T09:00:00', 60, now)).toBe('ended'));
  it('defaults duration to 60 min', () => expect(sessionPhase('2026-11-08T09:01:00', null, now)).toBe('live'));
});
describe('countdownLabel', () => {
  it('hours and minutes', () => expect(countdownLabel('2026-11-08T12:15:00', now)).toBe('começa em 2h 15min'));
  it('days', () => expect(countdownLabel('2026-11-11T10:00:00', now)).toBe('começa em 3 dias'));
});
