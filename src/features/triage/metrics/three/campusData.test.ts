import { describe, it, expect } from 'vitest';
import type { AcademicUnit } from '@/features/academic/hierarchy';
import type { Risk } from '../../priorities';
import { buildingLevel, buildingWindows, campusBuildings, MIN_GROUP, PROTECTED_WINDOW, UNPLACED_ID, WINDOW_COLS, windowRisks, windowShares, type CampusStudent } from './campusData';
import { RISK_HEX } from './sceneData';

const unit = (id: string, level: AcademicUnit['level'], name: string, parent_id: string | null = null): AcademicUnit =>
  ({ id, institution_id: 'i', parent_id, level, name, sort_order: 0 });

const risk = (over: Partial<Record<Risk, number>>): Record<Risk, number> =>
  ({ critical: 0, alert: 0, attention: 0, healthy: 0, no_data: 0, ...over });

describe('windowShares', () => {
  it('splits windows in proportion to students', () => {
    expect(windowShares(risk({ critical: 3, healthy: 7 }), 10)).toEqual(risk({ critical: 3, healthy: 7 }));
  });
  it('a single Em Risco student always keeps a window', () => {
    const s = windowShares(risk({ critical: 1, healthy: 99 }), 48);
    expect(s.critical).toBe(1);
    expect(s.critical + s.healthy).toBe(48);
  });
  it('never exceeds the window count when many small groups need their minimum', () => {
    const s = windowShares(risk({ critical: 1, alert: 1, attention: 1, healthy: 97 }), 10);
    expect(Object.values(s).reduce((a, b) => a + b, 0)).toBe(10);
    expect(s.critical).toBe(1);
  });
  it('windows are ordered from the most severe level at the ground floor', () => {
    expect(windowRisks(risk({ healthy: 2, critical: 2 }), 2, 2)).toEqual(['critical', 'critical', 'healthy', 'healthy']);
  });
});

describe('campusBuildings', () => {
  const units = [
    unit('u1', 'unit', 'Campus Norte'),
    unit('c1', 'course', 'Medicina', 'u1'),
    unit('c2', 'course', 'Enfermagem', 'u1'),
    unit('s1', 'shift', 'Manhã', 'c1'),
    unit('t1', 'class', 'Turma A', 's1'),
    unit('t2', 'class', 'Turma B', 'c2'),
  ];
  const levels = ['unit', 'course', 'shift', 'class'] as const;
  const students: CampusStudent[] = [
    ...Array.from({ length: 12 }, (_, i) => ({ patientId: `m${i}`, riskLevel: (i < 2 ? 'critical' : 'healthy') as Risk, lastTriageStatus: i === 0 ? 'triaged' : null })),
    ...Array.from({ length: 3 }, (_, i) => ({ patientId: `e${i}`, riskLevel: 'alert' as Risk, lastTriageStatus: null })),
    { patientId: 'loose', riskLevel: 'attention', lastTriageStatus: null },
  ];
  const placements = new Map([
    ...students.filter((s) => s.patientId.startsWith('m')).map((s) => [s.patientId, 't1'] as [string, string]),
    ...students.filter((s) => s.patientId.startsWith('e')).map((s) => [s.patientId, 't2'] as [string, string]),
  ]);
  const { buildings, districts, level, placed } = campusBuildings(units, placements, [...levels], students);
  const byName = (n: string) => buildings.find((b) => b.name === n)!;

  it('one building per course, inside its unit district', () => {
    expect(level).toBe('course');
    expect(placed).toBe(15);
    expect(byName('Medicina')).toMatchObject({ district: 'Campus Norte', total: 12 });
    expect(districts.map((d) => d.name)).toContain('Campus Norte');
  });
  it('shows the risk split and pending Em Risco only for groups of at least MIN_GROUP', () => {
    expect(byName('Medicina').byRisk).toMatchObject({ critical: 2, healthy: 10 });
    expect(byName('Medicina').pendingCritical).toBe(1);
    expect(byName('Enfermagem').total).toBeLessThan(MIN_GROUP);
    expect(byName('Enfermagem').byRisk).toBeNull();
    expect(byName('Enfermagem').pendingCritical).toBeNull();
  });
  it('students without a class go to their own building', () => {
    expect(buildings.find((b) => b.id === UNPLACED_ID)?.total).toBe(1);
  });
  it('the largest building gets the most floors and the campus is centred', () => {
    expect(byName('Medicina').floors).toBeGreaterThan(byName('Enfermagem').floors);
    const xs = buildings.map((b) => b.x);
    expect(Math.min(...xs) + Math.max(...xs)).toBeCloseTo(0);
  });
  it('falls back to the top active level when there are no courses', () => {
    expect(buildingLevel(['shift', 'class'])).toBe('shift');
    expect(buildingLevel(['class'])).toBe('class');
  });
});

describe('buildingWindows', () => {
  it('protected groups get uniform neutral windows', () => {
    expect(new Set(buildingWindows({ byRisk: null, floors: 2 }, new Set(['critical'])))).toEqual(new Set([PROTECTED_WINDOW]));
    expect(buildingWindows({ byRisk: null, floors: 2 }, new Set())).toHaveLength(2 * WINDOW_COLS);
  });
  it('levels filtered out in the toolbar stay unlit', () => {
    const w = buildingWindows({ byRisk: risk({ critical: 1, healthy: 3 }), floors: 1 }, new Set<Risk>(['critical']));
    expect(w).toEqual([RISK_HEX.critical, null, null, null]);
  });
});
