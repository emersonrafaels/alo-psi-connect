// Trilhas instrumentais públicas (Kevin MacLeod / incompetech.com)
// Licença: Creative Commons Attribution 4.0 (CC-BY 4.0)
// Crédito obrigatório: "Music by Kevin MacLeod — incompetech.com"

const BASE = "https://incompetech.com/music/royalty-free/mp3-royaltyfree";

export const PRATICAS_AUDIO_TRACKS = {
  meditationImpromptu1: `${BASE}/Meditation%20Impromptu%2001.mp3`,
  meditationImpromptu2: `${BASE}/Meditation%20Impromptu%2002.mp3`,
  healing: `${BASE}/Healing.mp3`,
  heartwarming: `${BASE}/Heartwarming.mp3`,
} as const;

// Por grupo (slug do grupo) — fallback temático
export const AUDIO_POR_GRUPO: Record<string, string> = {
  "regular-agora": PRATICAS_AUDIO_TRACKS.meditationImpromptu1,
  "soltar-o-corpo": PRATICAS_AUDIO_TRACKS.healing,
  "acolher-desacelerar": PRATICAS_AUDIO_TRACKS.heartwarming,
};

// Por slug específico — sobrepõe o grupo
export const AUDIO_POR_SLUG: Record<string, string> = {
  "respiracao-abdominal": PRATICAS_AUDIO_TRACKS.meditationImpromptu1,
  "respiracao-lenta-ritmada": PRATICAS_AUDIO_TRACKS.meditationImpromptu2,
  "voltar-ao-presente": PRATICAS_AUDIO_TRACKS.meditationImpromptu1,
  "quick-coherence": PRATICAS_AUDIO_TRACKS.meditationImpromptu2,
  "soltar-tensao-corpo": PRATICAS_AUDIO_TRACKS.healing,
  "criar-espaco-interno": PRATICAS_AUDIO_TRACKS.healing,
  "pausa-autocompaixao": PRATICAS_AUDIO_TRACKS.heartwarming,
  "desaceleracao-profunda": PRATICAS_AUDIO_TRACKS.heartwarming,
};

export const AUDIO_DEFAULT = PRATICAS_AUDIO_TRACKS.meditationImpromptu1;

export const AUDIO_CREDITS = "Música: Kevin MacLeod (incompetech.com) — CC-BY 4.0";

export interface AudioResolution {
  url: string;
  isFallback: boolean;
}

export const resolverAudioPratica = (
  praticaAudioUrl: string | null | undefined,
  slug: string | null | undefined,
  grupoSlug?: string | null,
): AudioResolution => {
  if (praticaAudioUrl) return { url: praticaAudioUrl, isFallback: false };
  if (slug && AUDIO_POR_SLUG[slug]) return { url: AUDIO_POR_SLUG[slug], isFallback: true };
  if (grupoSlug && AUDIO_POR_GRUPO[grupoSlug]) return { url: AUDIO_POR_GRUPO[grupoSlug], isFallback: true };
  return { url: AUDIO_DEFAULT, isFallback: true };
};
