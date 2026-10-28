import { describe, expect, it } from 'vitest';
import { careStatus, classifySignals, moodTrendPct, triageActionLabel } from './signalRules';

const base = { avgMood: null, avgAnxiety: null, avgEnergy: null, avgSleep: null };

describe('classifySignals', () => {
  it('highest level met wins and other reasons stay visible', () => {
    const r = classifySignals({ ...base, avgMood: 2.8, avgAnxiety: 4.6, validCount: 5, moodTrend: 0 });
    expect(r.level).toBe('critical');
    expect(r.reasons).toEqual(expect.arrayContaining(['Humor médio baixo', 'Ansiedade elevada']));
  });
  it('mood 2.5 with a 50% drop stays Alerta', () => {
    const r = classifySignals({ ...base, avgMood: 2.5, moodTrend: -50, validCount: 6 });
    expect(r.level).toBe('alert');
    expect(r.reasons).toContain('Queda relevante de humor');
  });
  it('no valid metric is Dados insuficientes, never Sem sinais prioritários', () => {
    expect(classifySignals(base).level).toBe('no_data');
  });
  it('classifies with available metrics when mood is missing', () => {
    expect(classifySignals({ ...base, avgEnergy: 1 }).level).toBe('alert');
  });
  it('single record keeps the signal with an isolated-record note', () => {
    const r = classifySignals({ ...base, avgMood: 1, validCount: 1 });
    expect(r.level).toBe('critical');
    expect(r.reasons).toContain('Registro isolado');
  });
  it('thresholds: 1.5 critical, 2.5 alert, 3.0 attention, sleep 2 attention, 4 none', () => {
    expect(classifySignals({ ...base, avgMood: 1.5 }).level).toBe('critical');
    expect(classifySignals({ ...base, avgMood: 2.5 }).level).toBe('alert');
    expect(classifySignals({ ...base, avgMood: 3 }).level).toBe('attention');
    expect(classifySignals({ ...base, avgMood: 4, avgSleep: 2 }).level).toBe('attention');
    expect(classifySignals({ ...base, avgMood: 4 }).level).toBe('healthy');
  });
});

describe('moodTrendPct', () => {
  it('ignores missing values instead of counting them as zero', () => {
    expect(moodTrendPct([4, null, 4, 2, null, 2])).toBe(-50);
  });
  it('no comparable base returns null (never 0%)', () => {
    expect(moodTrendPct([3, 3])).toBeNull();
    expect(moodTrendPct([0, 0, 3, 3])).toBeNull();
  });
});

describe('care status and action', () => {
  it('overdue follow-up is a care status, separate from level', () => {
    expect(careStatus('triaged', true)).toBe('overdue');
    expect(careStatus(null)).toBe('not_triaged');
    expect(careStatus('resolved')).toBe('concluded');
    expect(careStatus('in_progress')).toBe('in_follow_up');
  });
  it('Triar for never triaged, Revisar otherwise', () => {
    expect(triageActionLabel(null)).toBe('Triar');
    expect(triageActionLabel('t1')).toBe('Revisar');
  });
});
