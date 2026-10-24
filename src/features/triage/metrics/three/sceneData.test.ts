import { describe, it, expect } from 'vitest';
import { jitter, volumeColumns, volumeWindows, VOLUME, VOLUME_LIT } from './sceneData';
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

describe('volumeWindows', () => {
  it('lights a share of windows equal to the resolved share, from the ground up', () => {
    const { rows, cols, windows } = volumeWindows({ created: 10, resolved: 5, resolvedHeight: 1.08, openHeight: 1.08 });
    expect(rows * cols).toBe(windows.length);
    expect(windows.filter(Boolean)).toHaveLength(windows.length / 2);
    expect(windows[0]).toBe(VOLUME_LIT);
    expect(windows.at(-1)).toBeNull();
  });
  it('keeps at least one lit and one dark window when both exist', () => {
    const tiny = volumeWindows({ created: 100, resolved: 1, resolvedHeight: 0.01, openHeight: 0.7 });
    expect(tiny.windows.filter(Boolean)).toHaveLength(1);
    const almost = volumeWindows({ created: 100, resolved: 99, resolvedHeight: 0.7, openHeight: 0.01 });
    expect(almost.windows.filter((w) => w === null)).toHaveLength(1);
  });
});

describe('jitter', () => {
  it('is deterministic and bounded', () => {
    expect(jitter('abc', 1)).toBe(jitter('abc', 1));
    for (const id of ['a', 'b', 'patient-123', 'x'.repeat(40)]) expect(Math.abs(jitter(id, 2))).toBeLessThanOrEqual(0.12);
  });
});
