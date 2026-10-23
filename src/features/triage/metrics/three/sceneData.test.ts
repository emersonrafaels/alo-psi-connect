import { describe, it, expect } from 'vitest';
import { AXIS, jitter, toAxis, volumeColumns, wellbeingPoints, VOLUME, type WellbeingInput } from './sceneData';
import type { WeekBucket } from '../teamMetrics';

const week = (key: string, urgent: [number, number], low: [number, number] = [0, 0]): WeekBucket => ({
  key, start: new Date(), end: new Date(), created: urgent[0] + low[0], resolved: 0, backlog: 0,
  byPriority: {
    urgent: { created: urgent[0], resolvedSoFar: urgent[1] },
    high: { created: 0, resolvedSoFar: 0 },
    medium: { created: 0, resolvedSoFar: 0 },
    low: { created: low[0], resolvedSoFar: low[1] },
  },
});

describe('volumeColumns', () => {
  const { columns, max } = volumeColumns([week('2026-10-10', [10, 4]), week('2026-10-17', [5, 5], [2, 0])]);

  it('one column per week × priority, centred on the origin', () => {
    expect(columns).toHaveLength(8);
    expect(columns[0].x).toBeCloseTo(-VOLUME.spacingX / 2);
    expect(columns[4].x).toBeCloseTo(VOLUME.spacingX / 2);
  });
  it('the tallest cell reaches the max height and splits resolved / open', () => {
    expect(max).toBe(10);
    const tallest = columns.find((c) => c.id === '2026-10-10:urgent')!;
    expect(tallest.resolvedHeight + tallest.openHeight).toBeCloseTo(VOLUME.maxHeight);
    expect(tallest.resolvedHeight).toBeCloseTo(VOLUME.maxHeight * 0.4);
    expect(tallest.open).toBe(6);
  });
});

describe('wellbeingPoints', () => {
  const base: WellbeingInput = { patientId: 'p1', riskLevel: 'critical', lastTriageStatus: null, avgMood: 1, avgAnxiety: 5, avgEnergy: 2, avgSleep: 3, entryCount: 15 };

  it('maps the 1–5 scale onto the cube edges', () => {
    expect(toAxis(1)).toBe(-AXIS / 2);
    expect(toAxis(5)).toBe(AXIS / 2);
    const [p] = wellbeingPoints([base], () => 'Aluno #1', 15);
    expect(p.position[0]).toBeCloseTo(-AXIS / 2, 0);
    expect(p.position[1]).toBeCloseTo(AXIS / 2, 0);
    expect(p.label).toBe('Aluno #1');
    expect(p.triaged).toBe(false);
    expect(p.radius).toBeCloseTo(0.16);
  });
  it('skips students that cannot be placed', () => {
    expect(wellbeingPoints([{ ...base, avgSleep: null }], () => '', 15)).toHaveLength(0);
  });
  it('jitter is deterministic and bounded', () => {
    expect(jitter('abc', 1)).toBe(jitter('abc', 1));
    for (const id of ['a', 'b', 'patient-123', 'x'.repeat(40)]) expect(Math.abs(jitter(id, 2))).toBeLessThanOrEqual(0.12);
  });
});
