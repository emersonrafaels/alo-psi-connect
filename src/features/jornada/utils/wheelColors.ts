/**
 * Derivação de tons por anel da Roda das Emoções + escolha de tinta legível.
 * Todas as funções recebem/retornam cores hex (#RRGGBB).
 */

type HSL = { h: number; s: number; l: number };

const hexToHsl = (hex: string): HSL => {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.substring(0, 2), 16) / 255;
  const g = parseInt(clean.substring(2, 4), 16) / 255;
  const b = parseInt(clean.substring(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      default:
        h = ((r - g) / d + 4) / 6;
    }
  }
  return { h: h * 360, s: s * 100, l: l * 100 };
};

const clamp = (value: number, min = 0, max = 100) => Math.min(max, Math.max(min, value));

const hslToHex = ({ h, s, l }: HSL): string => {
  const sN = clamp(s) / 100;
  const lN = clamp(l) / 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = sN * Math.min(lN, 1 - lN);
  const f = (n: number) => lN - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  const toHex = (v: number) =>
    Math.round(v * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${toHex(f(0))}${toHex(f(8))}${toHex(f(4))}`;
};

/** Ajusta luminosidade/saturação de uma cor hex (deltas em pontos percentuais). */
export const shade = (hex: string, deltaL: number, deltaS = 0): string => {
  const hsl = hexToHsl(hex);
  return hslToHex({ h: hsl.h, s: clamp(hsl.s + deltaS), l: clamp(hsl.l + deltaL) });
};

/** Reduz saturação mantendo luminosidade — usado em fatias fora do caminho ativo. */
export const muteColor = (hex: string, amount = 55): string => {
  const hsl = hexToHsl(hex);
  return hslToHex({ h: hsl.h, s: clamp(hsl.s * (1 - amount / 100)), l: clamp(hsl.l + 6) });
};

/** Luminância relativa aproximada (0–1) para decidir a cor do texto. */
export const relativeLuminance = (hex: string): number => {
  const clean = hex.replace("#", "");
  const channels = [0, 2, 4].map((i) => {
    const c = parseInt(clean.substring(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
};

/** Tinta escura ou clara conforme o fundo, garantindo contraste em qualquer família. */
export const inkOn = (hex: string): string => (relativeLuminance(hex) > 0.42 ? "#16233a" : "#ffffff");

/** Tons por anel derivados da cor da família. */
export const ringTones = (base: string) => ({
  family: shade(base, -6, 4),
  level2: shade(base, -20, 12),
  level3: shade(base, 20, -6),
});
