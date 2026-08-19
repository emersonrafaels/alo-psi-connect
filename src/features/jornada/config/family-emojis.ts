/** Emoji de cada família emocional da Roda (rostos: máxima compatibilidade). */
export const FAMILY_EMOJI: Record<string, string> = {
  raiva: "😠",
  medo: "😨",
  tristeza: "😢",
  alegria: "😄",
  nojo: "🤢",
  surpresa: "😲",
};

export const getFamilyEmoji = (familyId?: string | null) =>
  (familyId && FAMILY_EMOJI[familyId]) || "🙂";
