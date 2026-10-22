import { describe, it, expect } from 'vitest';
import { escalateRisk } from './criticalTerms';

describe('escalateRisk', () => {
  it('grave term makes student critical', () => {
    expect(escalateRisk('healthy', 'grave')).toBe('critical');
  });
  it('moderate term raises one level', () => {
    expect(escalateRisk('attention', 'moderate')).toBe('alert');
  });
  it('never goes above critical', () => {
    expect(escalateRisk('critical', 'moderate')).toBe('critical');
  });
  it('no term keeps level', () => {
    expect(escalateRisk('alert', null)).toBe('alert');
  });
});
