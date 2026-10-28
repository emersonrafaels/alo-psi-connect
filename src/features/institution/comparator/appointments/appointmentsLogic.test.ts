import { describe, it, expect } from 'vitest';
import { capacityStatus, periodGap, gapLabel, warn, bestUnit, serviceSentence } from './appointmentsLogic';

describe('appointments rules', () => {
  it('demand above 115% of offer is above capacity', () => expect(capacityStatus(24, 16)).toBe('over'));
  it('demand between 80% and 115% is at the limit', () => expect(capacityStatus(128, 120)).toBe('limit'));
  it('demand below 80% leaves spare agenda', () => expect(capacityStatus(22, 40)).toBe('spare'));
  it('period gap in p.p.', () => { expect(periodGap(41, 18)).toBe(23); expect(gapLabel(-17)).toBe('agenda acima da procura'); });
  it('warns on occupancy ≥95%, wait >7 days, attendance <84%', () => {
    expect(warn('ocup', 98)).toBe(true); expect(warn('ocup', 90)).toBe(false);
    expect(warn('espera', 10)).toBe(true); expect(warn('compar', 82)).toBe(true); expect(warn('noite', 5)).toBe(false);
  });
  it('best unit is the shortest wait', () => expect(bestUnit([{ n: 'CT', espera: 10, compar: 82 }, { n: 'MC', espera: 4, compar: 90 }])?.n).toBe('MC'));
  it('sentence names the most overloaded service', () => expect(serviceSentence([{ nome: 'Psiquiatria', oferta: 16, procura: 24 }, { nome: 'Mentoria', oferta: 40, procura: 22 }])).toContain('Psiquiatria tem procura 50% acima'));
});
