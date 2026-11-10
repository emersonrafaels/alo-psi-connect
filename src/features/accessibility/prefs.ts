export type A11yPrefs = {
  scale: number; contrast: boolean; grayscale: boolean; readableFont: boolean;
  spacing: boolean; links: boolean; bigCursor: boolean; noMotion: boolean; readingGuide: boolean;
};
export const DEFAULT_PREFS: A11yPrefs = {
  scale: 1, contrast: false, grayscale: false, readableFont: false,
  spacing: false, links: false, bigCursor: false, noMotion: false, readingGuide: false,
};
export const SCALES = [0.9, 1, 1.15, 1.3, 1.5];
export const STORAGE_KEY = "rbe-a11y-prefs";
export function clampScale(v: number) { return Math.min(1.5, Math.max(0.9, v)); }
export function stepScale(cur: number, dir: 1 | -1) {
  const i = SCALES.findIndex((s) => s >= cur - 0.001);
  const idx = Math.min(SCALES.length - 1, Math.max(0, (i < 0 ? 1 : i) + dir));
  return SCALES[idx];
}
export function loadPrefs(): A11yPrefs {
  try {
    const p = { ...DEFAULT_PREFS, ...JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}") };
    p.scale = clampScale(Number(p.scale) || 1);
    return p;
  } catch { return { ...DEFAULT_PREFS }; }
}
const CLASS_MAP: Record<string, string> = {
  contrast: "a11y-contrast", grayscale: "a11y-grayscale", readableFont: "a11y-readable-font",
  spacing: "a11y-spacing", links: "a11y-links", bigCursor: "a11y-big-cursor", noMotion: "a11y-no-motion",
};
export function applyPrefs(p: A11yPrefs) {
  const el = document.documentElement;
  Object.entries(CLASS_MAP).forEach(([k, c]) => el.classList.toggle(c, Boolean((p as any)[k])));
  el.style.fontSize = p.scale === 1 ? "" : `${p.scale * 100}%`;
}
