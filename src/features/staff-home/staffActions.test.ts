import { describe, it, expect } from 'vitest';
import { buildStaffActions, staffKind, staffShortcuts, type StaffSummary } from './staffActions';

const base: StaffSummary = { institutions: 1, students: 10, professionals_active: 1, professionals_pending: 2, appointments_week: 0, payments_pending: 3,
  triage_open: 0, triage_urgent: 0, followups_overdue: 0, care_open: 0, care_stalled: 1, radar_semester: '2026.2', radar_answered: 0, by_institution: [] };

describe('staff Meu espaço', () => {
  it('detects the profile', () => {
    expect(staffKind(['clinical_coordinator'])).toBe('clinical');
    expect(staffKind(['admin_rbe'])).toBe('admin_rbe');
    expect(staffKind(['admin'])).toBeNull();
  });
  it('flags support requests stalled more than 3 days', () => {
    expect(buildStaffActions('clinical', base).some((a) => a.id === 'stalled')).toBe(true);
  });
  it('clinical coordination never gets payment or professional tasks', () => {
    const ids = buildStaffActions('clinical', base).map((a) => a.id);
    expect(ids).not.toContain('pay');
    expect(ids).not.toContain('pros');
  });
  it('Admin RBE shortcuts exclude settings, emails and translations', () => {
    const to = staffShortcuts(['admin_rbe']).map((s) => s.to);
    expect(to).not.toContain('/admin/emails');
    expect(to).not.toContain('/admin/configuracoes');
    expect(to).not.toContain('/admin/traducoes');
  });
  it('clinical shortcuts are only the four clinical pages', () => {
    expect(staffShortcuts(['clinical_coordinator']).length).toBe(4);
  });
});
