import { describe, it, expect } from 'vitest';
import { escalateRisk } from './criticalTerms';

describe('escalateRisk (phase 1: text signal is separate)', () => {
  it('grave or moderate terms never change the numeric level', () => {
    expect(escalateRisk('healthy', 'grave')).toBe('healthy');
    expect(escalateRisk('attention', 'moderate')).toBe('attention');
    expect(escalateRisk('no_data', 'grave')).toBe('no_data');
  });
});
