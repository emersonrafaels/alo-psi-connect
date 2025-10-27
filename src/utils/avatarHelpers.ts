/**
 * Gera uma URL de avatar ilustrativo baseado em gênero e raça
 * Usa DiceBear Avatars (Open Peeps style) - avatares de código aberto
 */
export function getIllustrativeAvatar(
  gender?: string | null,
  race?: string | null,
  seed?: string
): string {
  // Usar nome como seed para consistência
  const avatarSeed = seed || `user-${Date.now()}`;
  
  // Mapear raça para paleta de cores de pele
  const raceToSkinToneMap: Record<string, string> = {
    'branca': 'ffdbb4',      // Tom claro
    'preta': '6b4423',       // Tom escuro
    'parda': 'd08b5b',       // Tom médio
    'amarela': 'f4c48c',     // Tom amarelado
    'indigena': 'ae794c',    // Tom acobreado
    'prefiro_nao_declarar': 'd08b5b' // Tom médio neutro
  };

  const skinTone = race ? raceToSkinToneMap[race.toLowerCase()] || 'd08b5b' : 'd08b5b';

  // API do DiceBear (gratuita, open-source)
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(avatarSeed)}&skinColor=${skinTone}&backgroundColor=b6e3f4`;
}

/**
 * Verifica se um usuário tem foto própria carregada
 */
export function hasCustomPhoto(photoUrl?: string | null): boolean {
  if (!photoUrl) return false;
  // Verificar se NÃO é um avatar ilustrativo
  return !photoUrl.includes('dicebear.com') && !photoUrl.includes('placeholder');
}
