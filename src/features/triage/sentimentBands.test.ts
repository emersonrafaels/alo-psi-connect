import { describe, expect, test } from 'vitest';
import { sentimentBand, isHigherIsWorse } from './sentimentBands';

describe('sentimentBand', () => {
  test('humor 1,0 (muito baixo) aparece como ruim', () => {
    expect(sentimentBand('Humor', 1)).toBe('bad');
  });
  test('ansiedade 5,0 (máximo) aparece como ruim, não como boa', () => {
    expect(sentimentBand('Ansiedade', 5)).toBe('bad');
  });
  test('ansiedade baixa aparece como boa', () => {
    expect(sentimentBand('Ansiedade', 1.5)).toBe('good');
  });
  test('estresse 3,3 aparece como mediano', () => {
    expect(sentimentBand('Estresse', 3.3)).toBe('medium');
  });
  test('sono 2,0 aparece como ruim', () => {
    expect(sentimentBand('Sono', 2)).toBe('bad');
  });
  test('energia 4,2 aparece como boa', () => {
    expect(sentimentBand('Energia', 4.2)).toBe('good');
  });
  test('emoções desagradáveis da roda têm a escala invertida', () => {
    expect(isHigherIsWorse('Tristeza')).toBe(true);
    expect(sentimentBand('Tristeza', 4.5)).toBe('bad');
    expect(sentimentBand('Tranquilidade', 4.5)).toBe('good');
  });
});
