import { describe, expect, it } from 'vitest';
import { institutionStatus, rankInstitutions, safePct, trendIsGood, trend } from './clinicalHomeLogic';

const base = { id: 'a', name: 'A', logo_url: null, students: 100, elevated: 0, triage_open: 0, triage_urgent: 0, followups_overdue: 0, care_stalled: 0, radar_answered: 0 };

describe('clinical home', () => {
  it('hides percentages for groups under 10', () => {
    expect(safePct(3, 9)).toBeNull();
    expect(safePct(5, 10)).toBe(50);
  });
  it('urgent triage marks institution critical', () => {
    expect(institutionStatus({ ...base, triage_urgent: 1 })).toBe('critical');
    expect(institutionStatus(base)).toBe('ok');
  });
  it('ranks urgent institutions first', () => {
    const r = rankInstitutions([{ ...base, id: 'calm', triage_open: 2 }, { ...base, id: 'hot', triage_urgent: 1 }]);
    expect(r[0].id).toBe('hot');
  });
  it('rising anxiety is not good', () => {
    expect(trendIsGood(trend(3.5, 3), true)).toBe(false);
    expect(trendIsGood(trend(3.5, 3)), ).toBe(true);
  });
});

import { outcomeLabel } from './clinicalHomeLogic';
describe('outcome labels', () => {
  it('translates monitoring tags', () => {
    expect(outcomeLabel('monitoring')).toBe('Em monitoramento');
    expect(outcomeLabel('monitoring_completed')).toBe('Monitoramento concluído');
  });
  it('keeps unknown codes readable', () => {
    expect(outcomeLabel('caso_novo')).toBe('Caso novo');
  });
});

import { breakdownRows as br, INDICATOR_DETAILS as ID } from './clinicalHomeLogic';
describe('breakdownRows', () => {
  const base = { logo_url: null, elevated: 0, triage_open: 0, triage_urgent: 0, followups_overdue: 0, care_stalled: 0, radar_answered: 0 };
  it('hides percentages for institutions under 10 students', () => {
    const rows = br([{ ...base, id: 'a', name: 'A', students: 9, elevated: 3 }, { ...base, id: 'b', name: 'B', students: 20, elevated: 5 }], ID.critical);
    expect(rows[0]).toMatchObject({ id: 'b', value: 25 });
    expect(rows[1]).toMatchObject({ id: 'a', value: null, label: 'Dados protegidos' });
  });
  it('sorts counts descending', () => {
    const rows = br([{ ...base, id: 'a', name: 'A', students: 5, triage_urgent: 1 }, { ...base, id: 'b', name: 'B', students: 5, triage_urgent: 4 }], ID['Prioridade alta em aberto']);
    expect(rows.map((r) => r.value)).toEqual([4, 1]);
  });
});

describe('breakdownRows privacy', () => {
  const b = { logo_url: null, elevated: 0, triage_open: 0, triage_urgent: 0, followups_overdue: 0, care_stalled: 0, radar_answered: 0 };
  it('hides elevated-signal counts for institutions under 10 students', () => {
    const rows = br([{ ...b, id: 'a', name: 'A', students: 8, elevated_untriaged: 2 }, { ...b, id: 'b', name: 'B', students: 30, elevated_untriaged: 3 }], ID['Sinal elevado sem triagem']);
    expect(rows.find((r) => r.id === 'a')?.label).toBe('Dados protegidos');
    expect(rows.find((r) => r.id === 'b')?.value).toBe(3);
  });
  it('shows protected label when the server suppressed an average or flow time', () => {
    const rows = br([{ ...b, id: 'a', name: 'A', students: 50, avg_mood: null }, { ...b, id: 'b', name: 'B', students: 50, avg_mood: 3.84 }], ID.Humor);
    expect(rows.map((r) => r.label)).toEqual(['3,8', 'Dados protegidos']);
    const t = br([{ ...b, id: 'a', name: 'A', students: 50, hours_to_triage: 12.5 }], ID.hours_to_triage);
    expect(t[0].label).toBe('12,5h');
  });
});
