// Trilhas instrumentais públicas (Kevin MacLeod / incompetech.com)
// Licença: Creative Commons Attribution 4.0 (CC-BY 4.0)
// Crédito obrigatório: "Music by Kevin MacLeod — incompetech.com"

const BASE = "https://incompetech.com/music/royalty-free/mp3-royaltyfree";

export const PRATICAS_AUDIO_TRACKS = {
  meditationImpromptu1: `${BASE}/Meditation%20Impromptu%2001.mp3`,
  meditationImpromptu2: `${BASE}/Meditation%20Impromptu%2002.mp3`,
  healing: `${BASE}/Healing.mp3`,
  relaxingPiano: `${BASE}/Relaxing%20Piano%20Music.mp3`,
  tranquility: `${BASE}/Tranquility.mp3`,
} as const;

// Por grupo (slug do grupo) — fallback temático
export const AUDIO_POR_GRUPO: Record<string, string> = {
  "regular-desacelerar-agora": PRATICAS_AUDIO_TRACKS.meditationImpromptu1,
};

// Por slug específico — sobrepõe o grupo
export const AUDIO_POR_SLUG: Record<string, string> = {
  "suspiro-de-alivio": PRATICAS_AUDIO_TRACKS.healing,
  "pausa-tres-minutos": PRATICAS_AUDIO_TRACKS.tranquility,
  "grounding-54321": PRATICAS_AUDIO_TRACKS.meditationImpromptu2,
  "respiracao-lenta-ritmada": PRATICAS_AUDIO_TRACKS.meditationImpromptu1,
  "respiracao-quatro-etapas": PRATICAS_AUDIO_TRACKS.meditationImpromptu2,
  "respiracao-478": PRATICAS_AUDIO_TRACKS.relaxingPiano,
};

export const AUDIO_DEFAULT = PRATICAS_AUDIO_TRACKS.meditationImpromptu1;

export const AUDIO_CREDITS = "Música: Kevin MacLeod — CC-BY 4.0";

// Catálogo selecionável pelo usuário (tela de detalhe)
export interface TrackOption {
  id: string;
  label: string;
  url: string | null; // null = sem trilha
  mood?: string;
}

export const TRACK_CATALOG: TrackOption[] = [
  { id: "auto", label: "Recomendada", url: null, mood: "Escolha automática para esta prática" },
  { id: "meditation1", label: "Meditação I", url: PRATICAS_AUDIO_TRACKS.meditationImpromptu1, mood: "Piano sereno para respirar" },
  { id: "meditation2", label: "Meditação II", url: PRATICAS_AUDIO_TRACKS.meditationImpromptu2, mood: "Suave e introspectivo" },
  { id: "healing", label: "Healing", url: PRATICAS_AUDIO_TRACKS.healing, mood: "Relaxamento profundo" },
  { id: "relaxingPiano", label: "Piano relaxante", url: PRATICAS_AUDIO_TRACKS.relaxingPiano, mood: "Ambiente leve e calmo" },
  { id: "tranquility", label: "Tranquility", url: PRATICAS_AUDIO_TRACKS.tranquility, mood: "Atmosfera tranquila para yoga" },
  { id: "none", label: "Sem trilha", url: null, mood: "Apenas visual e som ambiente" },
];


export const getTrackById = (id: string | null | undefined): TrackOption | undefined =>
  id ? TRACK_CATALOG.find((t) => t.id === id) : undefined;

export const getTrackByUrl = (url: string | null | undefined): TrackOption | undefined =>
  url ? TRACK_CATALOG.find((t) => t.url === url) : undefined;

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

/**
 * Resolve a faixa efetivamente reproduzida considerando a escolha do usuário.
 * - "none" → sem trilha
 * - id específico → essa faixa
 * - "auto" / vazio → resolução automática por slug/grupo (com fallback default)
 */
export const resolveTrackForPratica = (
  praticaAudioUrl: string | null | undefined,
  slug: string | null | undefined,
  selectedTrackId: string | null | undefined,
  grupoSlug?: string | null,
): TrackOption => {
  if (selectedTrackId === "none") {
    return TRACK_CATALOG.find((t) => t.id === "none")!;
  }
  if (selectedTrackId && selectedTrackId !== "auto") {
    const t = getTrackById(selectedTrackId);
    if (t) return t;
  }
  const res = resolverAudioPratica(praticaAudioUrl, slug, grupoSlug);
  return getTrackByUrl(res.url) ?? TRACK_CATALOG.find((t) => t.url === AUDIO_DEFAULT)!;
};
