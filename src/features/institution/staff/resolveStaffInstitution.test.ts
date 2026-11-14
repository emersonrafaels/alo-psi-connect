import { describe, it, expect } from 'vitest';
import { resolveStaffInstitution } from './resolveStaffInstitution';
describe('resolveStaffInstitution', () => {
  it('prefers the URL institution', () => expect(resolveStaffInstitution('a', 'b')).toBe('a'));
  it('falls back to the session choice', () => expect(resolveStaffInstitution(null, 'b')).toBe('b'));
  it('returns null so the picker opens', () => expect(resolveStaffInstitution(null, null)).toBeNull());
});
