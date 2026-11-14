import { describe, expect, it } from 'vitest';
import { portalFor } from './portalLink';

describe('portalFor', () => {
  it('opens the portal home with the clicked institution selected', () => {
    expect(portalFor('abc')).toBe('/portal-institucional?inst=abc');
  });
  it('keeps the section and its view while selecting the institution', () => {
    expect(portalFor('abc', '/comparador', 'leitura=permanencia')).toBe('/portal-institucional/comparador?leitura=permanencia&inst=abc');
  });
});
