import { describe, it, expect } from 'vitest';
import { buildPendingActions, type PendingInput } from './pendingActions';

const base: PendingInput = {
  now: new Date('2026-11-04T12:00:00Z'), lastDiaryDate: '2026-11-04', scales: [],
  currentSemester: '2026.2', radarSemesters: ['2026.2'], unreadMessages: 0, nextSessionAt: null, pendingPaymentAppointments: 0,
};

describe('buildPendingActions', () => {
  it('is empty when everything is up to date', () => {
    expect(buildPendingActions(base)).toEqual([]);
  });
  it('asks for the diary when the last entry was yesterday', () => {
    expect(buildPendingActions({ ...base, lastDiaryDate: '2026-11-03' }).map(a => a.id)).toEqual(['diary']);
  });
  it('asks for the radar when the current semester has no answer', () => {
    expect(buildPendingActions({ ...base, radarSemesters: ['2026.1'] }).map(a => a.id)).toEqual(['radar']);
  });
  it('flags a scale only after its frequency has passed', () => {
    const s = { code: 'WHO5', name: 'WHO-5', frequencyDays: 14 };
    expect(buildPendingActions({ ...base, scales: [{ ...s, lastTakenAt: '2026-10-25' }] })).toEqual([]);
    expect(buildPendingActions({ ...base, scales: [{ ...s, lastTakenAt: '2026-10-21' }] }).map(a => a.id)).toEqual(['scale-WHO5']);
  });
  it('puts an encontro within 24h first and caps at 5 items', () => {
    const r = buildPendingActions({ ...base, lastDiaryDate: null, radarSemesters: [], unreadMessages: 2, nextSessionAt: '2026-11-05T08:00:00Z',
      scales: ['A', 'B', 'C'].map(c => ({ code: c, name: c, frequencyDays: 7, lastTakenAt: null })) });
    expect(r).toHaveLength(5);
    expect(r[0].id).toBe('session');
  });
});

describe('encontro em breve com detalhes', () => {
  const now = new Date(2026, 10, 5, 10, 0);
  const b = { now, lastDiaryDate: '2026-11-05', scales: [], currentSemester: '2026.2', radarSemesters: ['2026.2'], unreadMessages: 0, pendingPaymentAppointments: 0 };
  it('mostra nome, data e hora e abre a página do encontro', () => {
    const at = new Date(2026, 10, 5, 19, 0).toISOString();
    const [a] = buildPendingActions({ ...b, nextSessionAt: at, nextSession: { id: 's1', title: 'Roda: Provas', startsAt: at, type: 'roda_conversa', meetingUrl: 'https://meet/x' } });
    expect(a.title).toBe('Roda: Provas');
    expect(a.description).toBe('Roda de conversa · Hoje, 19h00 · começa em 9 h');
    expect(a.path).toBe('/encontros/s1');
    expect(a.cta).toBe('Ver encontro');
  });
  it('vira Entrar agora a 15 minutos do início', () => {
    const at = new Date(2026, 10, 5, 10, 10).toISOString();
    const [a] = buildPendingActions({ ...b, nextSessionAt: at, nextSession: { id: 's1', title: 'W', startsAt: at, meetingUrl: 'https://meet/x', otherCount: 1 } });
    expect(a.cta).toBe('Entrar agora');
    expect(a.path).toBe('https://meet/x');
    expect(a.description).toContain('+1 outro encontro');
  });
});
