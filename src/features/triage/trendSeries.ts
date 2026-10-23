import type { MoodEntry } from '@/hooks/useStudentActivityData';
import { getEmotionDisplayName } from '@/utils/emotionFormatters';

export type TrendSeries = { key: string; label: string; colorToken: string; getValue: (entry: MoodEntry) => number | null };
const normalize = (name: string) => name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();
const valid = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value) && value >= 1 && value <= 5;

export function buildTrendSeries(entries: MoodEntry[]): TrendSeries[] {
  const groups = new Map<string, { key: string; label: string; legacy?: 'mood_score' | 'anxiety_level' | 'energy_level' | 'sleep_quality'; aliases: string[] }>();
  for (const [key, label] of [['mood_score', 'Humor'], ['anxiety_level', 'Ansiedade'], ['energy_level', 'Energia'], ['sleep_quality', 'Sono']] as const) {
    groups.set(normalize(label), { key, label, legacy: key, aliases: [] });
  }
  const keys = [...new Set(entries.flatMap((entry) => Object.keys(entry.emotion_values ?? {})))].sort();
  for (const key of keys) {
    if (!entries.some((entry) => valid(entry.emotion_values?.[key]))) continue;
    const display = getEmotionDisplayName(key);
    const name = normalize(display);
    const identity = ['qualidade do sono', 'qualidade sono', 'sleep', 'sono'].includes(name) ? 'sono' : name;
    const group = groups.get(identity) ?? { key: `emo:${identity}`, label: display, aliases: [] };
    group.aliases.push(key);
    groups.set(identity, group);
  }
  return [...groups.values()].map((group, index) => ({
    key: group.key,
    label: group.label,
    colorToken: index < 12 ? `var(--chart-${index + 1})` : `calc(var(--trend-hue-origin) + ${index} * var(--trend-hue-step)) var(--trend-saturation) var(--trend-lightness)`,
    getValue: (entry) => {
      const legacy = group.legacy ? entry[group.legacy] : null;
      if (valid(legacy)) return legacy;
      for (const alias of group.aliases) {
        const value = entry.emotion_values?.[alias];
        if (valid(value)) return value;
      }
      return null;
    },
  }));
}