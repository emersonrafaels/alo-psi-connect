import { describe, expect, it } from 'vitest';
import { buildRealModel, pctDist, type RealUnitRow } from './permanenceReal';
import { DEMO_MODEL } from './permanenceModel';
import { toggleMulti, MODULES } from '@/features/permanence/instrument';

const row = (n: number, unit = 'Afya Contagem', sem = '2026.2'): RealUnitRow => ({
  semester: sem, unit_id: unit, unit_name: unit, n, est: 100,
  dist: { '6.1': { 'Muito provável': n } },
});

describe('real permanence model', () => {
  it('returns no model when every unit has fewer than 10 respondents', () => {
    expect(buildRealModel(DEMO_MODEL, [row(9)], '2026.2')).toBeNull();
  });
  it('drops units below 10 and keeps the others', () => {
    const m = buildRealModel(DEMO_MODEL, [row(9, 'Afya Itajubá'), row(12)], '2026.2')!;
    expect(m.units.map((u) => u.k)).toEqual(['CT']);
  });
  it('uses real answer distribution for an item', () => {
    expect(pctDist(row(20), '6.1')).toEqual([0, 0, 0, 0, 100]);
  });
});

describe('form multi-select', () => {
  const q = MODULES[0].items.find((x) => x.id === '1.2')!;
  it('exclusive option clears the others', () => {
    expect(toggleMulti(q, ['Cuidado de filhos'], 'Nenhuma dessas')).toEqual(['Nenhuma dessas']);
  });
  it('picking a regular option removes the exclusive one', () => {
    expect(toggleMulti(q, ['Nenhuma dessas'], 'Cuidado de filhos')).toEqual(['Cuidado de filhos']);
  });
});
