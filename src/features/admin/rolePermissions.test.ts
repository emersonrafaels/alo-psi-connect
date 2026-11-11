import { describe, it, expect } from 'bun:test';
import { canAccessAdminPath, mustAnonymizeStudents } from './rolePermissions';

describe('Admin RBE', () => {
  it('cannot open system settings, emails or translations', () => {
    for (const p of ['/admin/configuracoes', '/admin/emails', '/admin/traducoes'])
      expect(canAccessAdminPath(['admin_rbe'], p)).toBe(false);
  });
  it('can open other admin pages', () => {
    expect(canAccessAdminPath(['admin_rbe'], '/admin/financial')).toBe(true);
  });
});

describe('Coordenação clínica', () => {
  it('opens the institutional portal for any institution', () => {
    expect(canAccessAdminPath(['clinical_coordinator'], '/admin/portal-institucional')).toBe(true);
  });
  it('cannot open financial or emails', () => {
    expect(canAccessAdminPath(['clinical_coordinator'], '/admin/financial')).toBe(false);
    expect(canAccessAdminPath(['clinical_coordinator'], '/admin/emails')).toBe(false);
  });
  it('always sees students anonymized', () => {
    expect(mustAnonymizeStudents(['clinical_coordinator'])).toBe(true);
  });
});
