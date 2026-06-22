// Presets de respiração e temas de cena disponíveis na sessão.

export interface BreathingPreset {
  id: string;
  label: string;
  description: string;
  inspirar: number;
  segurar: number;
  expirar: number;
}

export const BREATHING_PRESETS: BreathingPreset[] = [
  { id: "padrao", label: "Padrão da prática", description: "Usa o ritmo recomendado", inspirar: 0, segurar: 0, expirar: 0 },
  { id: "coerencia55", label: "Coerência 5–5", description: "5s inspira · 5s expira — equilíbrio do SNA", inspirar: 5, segurar: 0, expirar: 5 },
  { id: "box4444", label: "Box 4–4–4", description: "4s inspira · 4s segura · 4s expira", inspirar: 4, segurar: 4, expirar: 4 },
  { id: "calma478", label: "Calma 4–7–8", description: "4s inspira · 7s segura · 8s expira — ótimo para sono", inspirar: 4, segurar: 7, expirar: 8 },
  { id: "lento66", label: "Lento 6–6", description: "6s inspira · 6s expira — desaceleração", inspirar: 6, segurar: 0, expirar: 6 },
];

export interface SceneTheme {
  id: string;
  label: string;
  className: string;
  swatch: string[]; // hex/hsl pequenos para preview
}

export const SCENE_THEMES: SceneTheme[] = [
  { id: "aurora", label: "Aurora", className: "pratica-scene-aurora", swatch: ["#7c3aed", "#a855f7", "#ec4899"] },
  { id: "ocean", label: "Oceano", className: "pratica-scene-ocean", swatch: ["#0c4a6e", "#0284c7", "#22d3ee"] },
  { id: "sunset", label: "Pôr do sol", className: "pratica-scene-sunset", swatch: ["#c2410c", "#db2777", "#7c3aed"] },
  { id: "forest", label: "Floresta", className: "pratica-scene-forest", swatch: ["#14532d", "#15803d", "#65a30d"] },
  { id: "night", label: "Noturno", className: "pratica-scene-night", swatch: ["#0f172a", "#1e293b", "#475569"] },
];

export const getThemeById = (id: string | null | undefined): SceneTheme =>
  SCENE_THEMES.find((t) => t.id === id) ?? SCENE_THEMES[0];

export const getPresetById = (id: string | null | undefined): BreathingPreset | undefined =>
  id ? BREATHING_PRESETS.find((p) => p.id === id) : undefined;
