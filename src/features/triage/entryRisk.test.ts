import { describe, expect, test } from 'bun:test';
import { reconcileRisk } from './entryRisk';

describe('reconcileRisk', () => {
  test('humor 1 e ansiedade 5 nunca aparece como Estável/Saudável', () => {
    expect(reconcileRisk('healthy', 1, 5)).toBe('critical');
  });
  test('mantém o rótulo da IA quando coerente com as notas', () => {
    expect(reconcileRisk('healthy', 4, 2)).toBe('healthy');
  });
});
