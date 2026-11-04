import { describe, it, expect } from 'vitest';
import { buildProActions, profileCompleteness, proKpis, type ProProfile } from './professionalActions';

const full: ProProfile = { foto_perfil_url: 'x', resumo: 'r', preco_consulta: 150, tempo_consulta: 50, formacao_raw: 'f', crp_crm: '06/1', pix: 'p' };
const now = new Date('2026-11-04T12:00:00');

describe('professional home rules', () => {
  it('nothing to do when profile, bank and schedule are set', () => {
    expect(buildProActions({ now, profile: full, hasSchedule: true, appts: [], nextSessionAt: null, unreadMessages: 0 })).toEqual([]);
  });
  it('lists missing profile fields', () => {
    expect(profileCompleteness({ ...full, foto_perfil_url: null, preco_consulta: 0 })).toEqual({ pct: 67, missing: ['foto', 'preço'] });
  });
  it('flags missing schedule and bank data', () => {
    const ids = buildProActions({ now, profile: { ...full, pix: null }, hasSchedule: false, appts: [], nextSessionAt: null, unreadMessages: 0 }).map(a => a.id);
    expect(ids).toEqual(['schedule', 'bank']);
  });
  it('puts an appointment in the next 24h first', () => {
    const r = buildProActions({ now, profile: full, hasSchedule: true, appts: [{ data_consulta: '2026-11-05', horario: '09:00', payment_status: 'pending_payment' }], nextSessionAt: null, unreadMessages: 1 });
    expect(r.map(a => a.id)).toEqual(['appt-soon', 'payment', 'messages']);
  });
  it('counts revenue only from paid appointments this month', () => {
    const k = proKpis([
      { data_consulta: '2026-11-02', horario: '10:00', payment_status: 'paid', valor: 200 },
      { data_consulta: '2026-11-03', horario: '10:00', payment_status: 'pending_payment', valor: 200 },
      { data_consulta: '2026-10-20', horario: '10:00', payment_status: 'paid', valor: 100 },
    ], now);
    expect(k.revenue).toBe(200);
    expect(k.last30).toBe(2);
  });
});
