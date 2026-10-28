import { describe, expect, it } from 'vitest';
import { escalateRisk as feEscalate } from './criticalTerms';
import { isAwaitingTriage as feAwaiting } from './priorities';
import { baseRisk, escalateRisk, isAwaitingTriage, queueBucket } from '../../../supabase/functions/buddy-institution-chat/triageRules';

const row = (mood: number, anxiety: number | null = null) => ({ mood_score: mood, anxiety_level: anxiety, energy_level: null, sleep_quality: null, sleep_hours: null, date: '2026-10-20' });

describe('Buddy uses the same triage rules as the portal', () => {
  it('counts Para Triar the same way as the portal', () => {
    for (const risk of ['critical', 'alert', 'attention', 'healthy', 'no_data'] as const)
      for (const st of [null, 'pending', 'triaged', 'in_progress', 'resolved'])
        expect(isAwaitingTriage(risk, st)).toBe(feAwaiting({ riskLevel: risk, lastTriageStatus: st }));
    expect(queueBucket('critical', null)).toBe('para_triar');
    expect(queueBucket('alert', null)).toBe('fora_da_fila');
  });
  it('escalates risk with critical keywords exactly like the portal', () => {
    for (const risk of ['critical', 'alert', 'attention', 'healthy', 'no_data'] as const)
      for (const sev of [null, 'grave', 'moderate'] as const) expect(escalateRisk(risk, sev)).toBe(feEscalate(risk, sev));
  });
  it('classifies mood averages with the portal thresholds', () => {
    expect(baseRisk([row(1)])).toBe('critical');
    expect(baseRisk([row(3, 4.5)])).toBe('critical');
    expect(baseRisk([row(2)])).toBe('alert');
    expect(baseRisk([row(3)])).toBe('attention');
    expect(baseRisk([row(4)])).toBe('healthy');
    expect(baseRisk([])).toBe('no_data');
  });
});
