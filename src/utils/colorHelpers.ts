/**
 * Converte cor hexadecimal para HSL (formato Tailwind CSS)
 * @param hex - Cor em formato hexadecimal (#RRGGBB)
 * @returns String HSL no formato "H S% L%" (ex: "142 76% 36%")
 */
export const hexToHSL = (hex: string): string => {
  // Remove # se presente
  hex = hex.replace('#', '');
  
  // Converte para RGB
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;
  
  // Calcula HSL
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;
  
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  
  h = Math.round(h * 360);
  s = Math.round(s * 100);
  l = Math.round(l * 100);
  
  // IMPORTANTE: Retornar sem vírgulas, apenas espaços (formato Tailwind CSS)
  return `${h} ${s}% ${l}%`;
};

/**
 * Calcula a luminância de uma cor HSL
 * @param hsl - String HSL no formato "H S% L%"
 * @returns Valor de luminância entre 0 e 1
 */
export const getLuminance = (hsl: string): number => {
  const parts = hsl.split(' ');
  const l = parseFloat(parts[2]);
  return l / 100;
};

/**
 * Determina se deve usar texto claro ou escuro baseado na cor de fundo
 * @param backgroundColor - Cor de fundo em HSL
 * @returns String HSL para cor do texto
 */
export const getContrastingTextColor = (backgroundColor: string): string => {
  const luminance = getLuminance(backgroundColor);
  // Se a cor de fundo for clara (luminância > 50%), use texto escuro
  // Se for escura (luminância <= 50%), use texto claro
  return luminance > 0.5 
    ? '222 84% 5%'   // Texto escuro
    : '0 0% 100%';   // Texto branco
};

/**
 * Verifica se uma string é uma cor em formato hex válida
 */
export const isHexColor = (color: string): boolean => {
  return /^#?[0-9A-F]{6}$/i.test(color);
};

/**
 * Verifica se uma string é uma cor em formato HSL válida
 */
export const isHSLColor = (color: string): boolean => {
  // Formato: "H S% L%" ou "hsl(H, S%, L%)"
  return /^\d+\s+\d+%\s+\d+%$/.test(color) || /^hsl\(\d+,\s*\d+%,\s*\d+%\)$/.test(color);
};
