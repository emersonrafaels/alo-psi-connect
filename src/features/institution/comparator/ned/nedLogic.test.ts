import { describe, it, expect } from 'vitest';
import { mean, vsMean, requiredTeam, quadrant, enrich, byAttention, type NedRaw } from './nedLogic';

const raw = (o: Partial<NedRaw>): NedRaw => ({ key: 'x', nome: 'X', uf: 'MG', reg: 'Sudeste', tipo: 'Faculdade', est: 1000, atend: 100, horas: 50, esp: 5, com: 85, col: 3, pei: 85, peis: 10, niv: 50, sat: 4.4, eq: [1, 2, 1, 0], ate: '17h', grupo: 10, canais: '', rel: [1, 1, 1], plano: 1, cia: 1, dem: [30, 20, 15, 15, 10, 10], ...o });

describe('NED rules', () => {
  it('mean of lists', () => { expect(mean([3, 1, 2])).toBe(2); expect(mean([1, 2, 3, 6])).toBe(3); expect(mean([])).toBe(0); });
  it('lower wait is better', () => { expect(vsMean(3, 6, false, 1)).toBe(1); expect(vsMean(12, 6, false, 1)).toBe(-1); expect(vsMean(6.5, 6, false, 1)).toBe(0); });
  it('centro universitário needs administrative support', () => { expect(requiredTeam('Centro universitário')[3]).toBe(1); expect(requiredTeam('Faculdade')[3]).toBe(0); });
  it('quadrant: high demand, low staff', () => expect(quadrant(15, 3, 13, 5)).toBe('Muita procura, pouca equipe'));
  it('management on time counts reports, plan and CIA', () => expect(enrich([raw({ rel: [1, 0, 0], plano: 2, cia: 0 })]).neds[0].ges).toBe(20));
  it('team incomplete when psychology missing', () => expect(enrich([raw({ eq: [1, 1, 0, 0] })]).neds[0].full).toBe(false));
  it('attention ordering puts the worst first', () => {
    const { neds } = enrich([raw({ key: 'a' }), raw({ key: 'b', esp: 12, com: 70, col: 0 }), raw({ key: 'c' })]);
    expect([...neds].sort(byAttention)[0].key).toBe('b');
  });
});
