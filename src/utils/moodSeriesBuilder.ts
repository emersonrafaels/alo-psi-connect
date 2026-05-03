import type { MoodEntry } from '@/hooks/useMoodEntries';
import type { EmotionConfig } from '@/hooks/useEmotionConfig';
import { parseISODateLocal } from '@/lib/utils';

export type Granularity = 'day' | 'week';

export const LEGACY_FIELD_MAP: Record<string, keyof MoodEntry> = {
  mood: 'mood_score',
  energy: 'energy_level',
  anxiety: 'anxiety_level',
  sleep_quality: 'sleep_quality',
};

// Emotions where lower values are better (for "trend up = good" coloring)
export const INVERTED_EMOTIONS = new Set(['anxiety', 'stress']);

export function getEmotionRaw(entry: MoodEntry, key: string): number | null {
  if (entry.emotion_values && typeof entry.emotion_values === 'object') {
    const v = (entry.emotion_values as Record<string, any>)[key];
    if (v !== null && v !== undefined && Number.isFinite(Number(v))) return Number(v);
  }
  const legacy = LEGACY_FIELD_MAP[key];
  if (legacy && entry[legacy] !== null && entry[legacy] !== undefined) {
    const n = Number(entry[legacy]);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

export function getConfigFor(configs: EmotionConfig[], key: string): EmotionConfig | undefined {
  return configs.find((c) => c.emotion_type === key);
}

export function getScale(configs: EmotionConfig[], key: string): { min: number; max: number } {
  const c = getConfigFor(configs, key);
  if (c) return { min: c.scale_min, max: c.scale_max };
  return { min: 1, max: 5 };
}

// Distinct, stable color per emotion. We don't read color_scheme.mid from configs
// because the DB stores yellow (slider midpoint) for almost all emotions, which
// would make every chart line look the same.
const EMOTION_PALETTE: Record<string, string> = {
  mood: 'hsl(142 71% 45%)',
  energy: 'hsl(32 95% 55%)',
  anxiety: 'hsl(0 78% 58%)',
  stress: 'hsl(347 77% 50%)',
  motivation: 'hsl(262 70% 58%)',
  focus: 'hsl(217 85% 56%)',
  gratitude: 'hsl(330 75% 60%)',
  confidence: 'hsl(280 70% 55%)',
  hope: 'hsl(195 80% 50%)',
  creativity: 'hsl(295 75% 55%)',
  productivity: 'hsl(173 70% 40%)',
  satisfaction: 'hsl(45 90% 50%)',
  sleep_quality: 'hsl(245 60% 60%)',
  sleep_hours: 'hsl(220 50% 55%)',
};

const FALLBACK_PALETTE = [
  'hsl(142 71% 45%)',
  'hsl(32 95% 55%)',
  'hsl(0 78% 58%)',
  'hsl(217 85% 56%)',
  'hsl(262 70% 58%)',
  'hsl(330 75% 60%)',
  'hsl(195 80% 50%)',
  'hsl(173 70% 40%)',
  'hsl(45 90% 50%)',
  'hsl(295 75% 55%)',
  'hsl(280 70% 55%)',
  'hsl(347 77% 50%)',
];

function hashKey(key: string): number {
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function getEmotionColor(_configs: EmotionConfig[], key: string, fallbackIdx = 0): string {
  if (EMOTION_PALETTE[key]) return EMOTION_PALETTE[key];
  const idx = (hashKey(key) + fallbackIdx) % FALLBACK_PALETTE.length;
  return FALLBACK_PALETTE[idx];
}

export function filterEntriesByDays(entries: MoodEntry[], days: number): MoodEntry[] {
  const since = new Date();
  since.setDate(since.getDate() - days);
  since.setHours(0, 0, 0, 0);
  return entries.filter((e) => parseISODateLocal(e.date) >= since);
}

interface SeriesPoint {
  date: string; // display label
  rawDate: string; // ISO key for ordering
  [emotionKey: string]: any;
}

export function buildSeries(
  entries: MoodEntry[],
  selected: string[],
  granularity: Granularity = 'day'
): SeriesPoint[] {
  if (entries.length === 0 || selected.length === 0) return [];
  const sorted = [...entries].sort(
    (a, b) => parseISODateLocal(a.date).getTime() - parseISODateLocal(b.date).getTime()
  );

  if (granularity === 'day') {
    return sorted.map((e) => {
      const d = parseISODateLocal(e.date);
      const point: SeriesPoint = {
        date: d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
        rawDate: e.date,
      };
      selected.forEach((key) => {
        const v = getEmotionRaw(e, key);
        if (v !== null) point[key] = v;
      });
      return point;
    });
  }

  // weekly
  const weeks = new Map<string, { entries: MoodEntry[]; key: string }>();
  sorted.forEach((e) => {
    const d = parseISODateLocal(e.date);
    const monday = new Date(d);
    monday.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    const key = monday.toISOString().slice(0, 10);
    if (!weeks.has(key)) weeks.set(key, { entries: [], key });
    weeks.get(key)!.entries.push(e);
  });

  return Array.from(weeks.values())
    .sort((a, b) => a.key.localeCompare(b.key))
    .map(({ entries: weekEntries, key }) => {
      const point: SeriesPoint = {
        date: parseISODateLocal(key).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
        rawDate: key,
      };
      selected.forEach((emotionKey) => {
        const vals = weekEntries
          .map((e) => getEmotionRaw(e, emotionKey))
          .filter((v): v is number => v !== null);
        if (vals.length > 0) {
          point[emotionKey] = +(vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2);
        }
      });
      return point;
    });
}

export function pearson(xs: number[], ys: number[]): number | null {
  const n = xs.length;
  if (n < 3) return null;
  const meanX = xs.reduce((a, b) => a + b, 0) / n;
  const meanY = ys.reduce((a, b) => a + b, 0) / n;
  let num = 0;
  let denX = 0;
  let denY = 0;
  for (let i = 0; i < n; i++) {
    const dx = xs[i] - meanX;
    const dy = ys[i] - meanY;
    num += dx * dy;
    denX += dx * dx;
    denY += dy * dy;
  }
  if (denX === 0 || denY === 0) return null;
  return num / Math.sqrt(denX * denY);
}

export function computeCorrelations(
  entries: MoodEntry[],
  configs: EmotionConfig[],
  keys: string[]
): { matrix: Record<string, Record<string, number | null>>; counts: Record<string, Record<string, number>> } {
  // Build normalized values per entry per key
  const matrix: Record<string, Record<string, number | null>> = {};
  const counts: Record<string, Record<string, number>> = {};
  keys.forEach((k1) => {
    matrix[k1] = {};
    counts[k1] = {};
    keys.forEach((k2) => {
      const xs: number[] = [];
      const ys: number[] = [];
      entries.forEach((e) => {
        const v1 = getEmotionRaw(e, k1);
        const v2 = getEmotionRaw(e, k2);
        if (v1 === null || v2 === null) return;
        const s1 = getScale(configs, k1);
        const s2 = getScale(configs, k2);
        const r1 = s1.max - s1.min || 1;
        const r2 = s2.max - s2.min || 1;
        xs.push((v1 - s1.min) / r1);
        ys.push((v2 - s2.min) / r2);
      });
      matrix[k1][k2] = k1 === k2 ? 1 : pearson(xs, ys);
      counts[k1][k2] = xs.length;
    });
  });
  return { matrix, counts };
}

export function linearRegression(xs: number[], ys: number[]): { slope: number; intercept: number } | null {
  const n = xs.length;
  if (n < 2) return null;
  const meanX = xs.reduce((a, b) => a + b, 0) / n;
  const meanY = ys.reduce((a, b) => a + b, 0) / n;
  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    const dx = xs[i] - meanX;
    num += dx * (ys[i] - meanY);
    den += dx * dx;
  }
  if (den === 0) return null;
  const slope = num / den;
  return { slope, intercept: meanY - slope * meanX };
}

export function describeCorrelation(r: number | null): string {
  if (r === null) return 'Sem dados suficientes';
  const abs = Math.abs(r);
  const strength = abs >= 0.7 ? 'forte' : abs >= 0.4 ? 'moderada' : abs >= 0.2 ? 'fraca' : 'muito fraca';
  const dir = r > 0 ? 'positiva' : r < 0 ? 'negativa' : 'nula';
  return `Correlação ${strength} ${dir} (${r.toFixed(2)})`;
}
