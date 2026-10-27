import { describe, it, expect } from 'vitest';
import { buildOverviewActions, type OverviewActionsInput } from './overviewActionRules';

const now = new Date('2026-10-27T12:00:00Z');
const ok: OverviewActionsInput = {
  criticalOpen: 0, totalTriage: 100, resolvedTriage: 90, engagementRate: 0.5,
  activeStudentsWeek: 100, activeStudentsPrevWeek: 90, lastBriefAt: '2026-10-26T12:00:00Z', now,
};
const ids = (i: OverviewActionsInput) => buildOverviewActions(i).map((a) => a.id);

describe('buildOverviewActions', () => {
  it('Em Risco pendente vira ação urgente em primeiro', () => {
    const r = buildOverviewActions({ ...ok, criticalOpen: 10, engagementRate: 0.1, lastBriefAt: null });
    expect(r[0].id).toBe('triage_risk');
    expect(r[0].level).toBe('urgent');
  });
  it('resolução de 79% gera ação', () => {
    expect(ids({ ...ok, resolvedTriage: 79 })).toContain('triage_in_progress');
  });
  it('resolução de 80% não gera ação', () => {
    expect(ids({ ...ok, resolvedTriage: 80 })).not.toContain('triage_in_progress');
  });
  it('engajamento de 39% gera ação', () => {
    expect(ids({ ...ok, engagementRate: 0.39 })).toContain('engagement');
  });
  it('resumo com mais de 7 dias gera sugestão', () => {
    expect(ids({ ...ok, lastBriefAt: '2026-10-19T00:00:00Z' })).toContain('buddy_brief');
  });
  it('tudo em dia retorna lista vazia', () => {
    expect(buildOverviewActions(ok)).toEqual([]);
  });
  it('nunca passa de 5 itens', () => {
    const r = buildOverviewActions({ ...ok, criticalOpen: 5, resolvedTriage: 10, engagementRate: 0, lastBriefAt: null });
    expect(r.length).toBeLessThanOrEqual(5);
  });
});
