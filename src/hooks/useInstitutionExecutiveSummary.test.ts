import { describe, expect, it } from 'vitest';
import { mapPortalSummary, type PortalSummaryRaw } from './useInstitutionExecutiveSummary';

const raw: PortalSummaryRaw = {
  total_students: 2800, enrolled_students: 2700, active_week: 700, active_prev_week: 650,
  sparkline: [1, 2, 3, 4, 5, 6, 7], total_triage: 200, resolved_triage: 150,
  open_critical: [{ id: 't1', risk_level: 'critical', priority: 'high', created_at: '2026-11-18T10:00:00Z' }],
  absent_profile_ids: ['p1', 'p2'],
};

describe('mapPortalSummary', () => {
  it('computes engagement as active this week over all linked students', () => {
    expect(mapPortalSummary(raw, 0).engagementRate).toBe(0.25);
  });
  it('computes triage resolution rate from totals', () => {
    expect(mapPortalSummary(raw, 0).resolutionRate).toBe(0.75);
  });
  it('keeps the awaiting-triage count passed from the triage data', () => {
    expect(mapPortalSummary(raw, 12).criticalOpen).toBe(12);
  });
  it('labels open critical triages as Sinal elevado', () => {
    expect(mapPortalSummary(raw, 0).criticalTriageAlerts[0].title).toBe('Triagem em aberto — risco Sinal elevado');
  });
  it('returns zero engagement when the institution has no students', () => {
    expect(mapPortalSummary({ ...raw, total_students: 0 }, 0).engagementRate).toBe(0);
  });
});
